"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "../context/AuthContext"

// API base URL
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '')

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    specialty: "",
    // Additional patient fields
    age: "",
    gender: "",
    bloodGroup: "",
    contact: "",
  })
  const [error, setError] = useState("")
  const [isRegistering, setIsRegistering] = useState(false)
  const router = useRouter()
  
  const { register, loading } = useAuth()

  // Show specialty field only when role is doctor
  const [showSpecialty, setShowSpecialty] = useState(false)
  const [showPatientFields, setShowPatientFields] = useState(false)

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData({
      ...formData,
      [id]: value
    })
  }

  const handleRoleChange = (value) => {
    setFormData({
      ...formData,
      role: value
    })
    setShowSpecialty(value === "doctor")
    setShowPatientFields(value === "patient")
  }

  const handleSpecialtyChange = (e) => {
    setFormData({
      ...formData,
      specialty: e.target.value
    })
  }

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.role) {
      setError("All required fields must be filled")
      return false
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      return false
    }
    
    if (formData.role === "doctor" && !formData.specialty) {
      setError("Specialty is required for doctors")
      return false
    }
    
    if (formData.role === "patient" && (!formData.age || !formData.gender || !formData.bloodGroup || !formData.contact)) {
      setError("All patient information fields are required")
      return false
    }
    
    setError("")
    return true
  }

  const createPatientProfile = async (user, token) => {
    try {
      console.log('=== Starting Patient Creation ===')
      console.log('Token:', token ? 'Present' : 'Missing')
      console.log('API URL:', API_URL)
      
      const patientData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        age: parseInt(formData.age),
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        contact: formData.contact,
        address: "",
        emergencyContact: "",
        condition: "",
        allergies: []
      }

      console.log('Patient data to send:', JSON.stringify(patientData, null, 2))

      const patientResponse = await fetch(`${API_URL}/api/patients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patientData)
      })

      console.log('Patient creation response status:', patientResponse.status)
      console.log('Patient creation response headers:', Object.fromEntries(patientResponse.headers.entries()))

      const responseText = await patientResponse.text()
      console.log('Patient creation raw response:', responseText)

      let patientResult
      try {
        patientResult = JSON.parse(responseText)
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`)
      }

      if (!patientResponse.ok) {
        throw new Error(patientResult.message || `Error ${patientResponse.status}: Failed to create patient profile`)
      }

      console.log('Patient created successfully:', patientResult)
      return patientResult
    } catch (error) {
      console.error('Error in createPatientProfile:', error)
      throw error
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsRegistering(true)
    
    try {
      console.log('=== Starting Registration Process ===')
      console.log('Form data:', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role
      })

      // Step 1: Register the user
      const result = await register(formData)
      console.log('Registration result:', result)

      if (result.success) {
        console.log('User registration successful')
        
        // Step 2: For patients, create patient profile
        if (result.user.role === "patient") {
          const token = result.token || localStorage.getItem('token')
          console.log('Creating patient profile with token:', token ? 'Present' : 'Missing')
          
          if (!token) {
            throw new Error('No authentication token available')
          }

          const patientResult = await createPatientProfile(result.user, token)
          
          // Step 3: Store patient ID and redirect
          if (patientResult.id) {
            localStorage.setItem('patientId', patientResult.id)
            console.log('Stored patient ID:', patientResult.id)
            
            toast({
              title: "Registration Successful",
              description: `Welcome to SehatNama, ${result.user.firstName}! Your patient profile has been created.`,
            })

            // Wait for toast before redirecting
            setTimeout(() => {
              console.log('Redirecting to:', `/patient-portal/${patientResult.id}`)
              router.push(`/patient-portal/${patientResult.id}`)
            }, 1000)
          } else {
            throw new Error('Patient ID not received from server')
          }
        } else {
          // Non-patient user - redirect to dashboard
          toast({
            title: "Registration Successful",
            description: `Welcome to SehatNama, ${result.user.firstName}!`,
          })

          setTimeout(() => {
            if (result.user.role === "doctor" || result.user.role === "admin") {
              router.push("/dashboard")
            }
          }, 1000)
        }
      } else {
        setError(result.error)
        toast({
          title: "Registration Failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Registration error:', error)
      const errorMessage = error.message || "An error occurred during registration. Please try again later."
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <Toaster />
      <Link href="/" className="absolute left-8 top-8 flex items-center gap-2">
        <Shield className="h-6 w-6 text-teal-600" />
        <span className="text-xl font-bold">SehatNama</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Enter your information to create your SehatNama account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-100 p-3 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input 
                  id="firstName" 
                  placeholder="John" 
                  required 
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input 
                  id="lastName" 
                  placeholder="Doe" 
                  required 
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                required 
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                required 
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Register as</Label>
              <Select onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {showSpecialty && (
              <div className="space-y-2">
                <Label htmlFor="specialty">Medical Specialty</Label>
                <Input 
                  id="specialty" 
                  placeholder="e.g., Cardiology, Pediatrics" 
                  required 
                  value={formData.specialty}
                  onChange={handleSpecialtyChange}
                />
              </div>
            )}
            {showPatientFields && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input 
                    id="age" 
                    type="number" 
                    placeholder="30" 
                    required 
                    min="0"
                    max="120"
                    value={formData.age}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select onValueChange={(value) => setFormData({...formData, gender: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <Select onValueChange={(value) => setFormData({...formData, bloodGroup: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Number</Label>
                  <Input 
                    id="contact" 
                    type="tel" 
                    placeholder="+1234567890" 
                    required 
                    value={formData.contact}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              className="w-full bg-teal-600 hover:bg-teal-700" 
              type="submit" 
              disabled={loading || isRegistering}
            >
              {isRegistering ? "Creating account..." : loading ? "Loading..." : "Create account"}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-teal-600 hover:underline">
                Login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}