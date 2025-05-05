"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "../context/AuthContext"

// API base URL
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '')

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const router = useRouter()
  
  const { login, loading } = useAuth()

  const findPatientId = async (user, token) => {
    try {
      // Try to get patientId from user object first
      if (user.patientId) {
        console.log('Patient ID from user object:', user.patientId)
        return user.patientId
      }

      // Try to get it from user profile
      const userResponse = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (userResponse.ok) {
        const userData = await userResponse.json()
        if (userData.patientId) {
          console.log('Patient ID from user profile:', userData.patientId)
          return userData.patientId
        }
      }

      // Query all patients to find by email
      const patientsResponse = await fetch(`${API_URL}/api/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json()
        console.log(`Found ${patientsData.length} patients in database`)
        
        const userPatient = patientsData.find(p => 
          p.email === user.email || 
          (p.user && p.user.email === user.email)
        )

        if (userPatient) {
          const patientId = userPatient.patientId || userPatient.id
          console.log('Found patient ID:', patientId)
          
          // Save for future use
          localStorage.setItem('patientId', patientId)
          return patientId
        }
      }
      
      return null
    } catch (error) {
      console.error('Error finding patient ID:', error)
      return null
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoggingIn(true)

    try {
      console.log('=== Starting Login Process ===')
      
      // Step 1: Authenticate user
      const result = await login(email, password)
      console.log('Login result:', result)

      if (result.success) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${result.user.firstName}!`,
        })

        const token = result.token || localStorage.getItem('token')
        console.log('Token available:', !!token)

        // Redirect based on user role
        if (result.user.role === "doctor" || result.user.role === "admin") {
          console.log('Redirecting to dashboard')
          router.push("/dashboard")
        } else if (result.user.role === "patient") {
          console.log('Finding patient ID for patient role')
          
          // Step 2: Find patient ID
          const patientId = await findPatientId(result.user, token)
          
          if (patientId) {
            console.log('Redirecting to patient portal with ID:', patientId)
            router.push(`/patient-portal/${patientId}`)
          } else {
            console.log('No patient ID found')
            toast({
              title: "Warning",
              description: "Patient profile not found. Please contact support.",
              variant: "destructive"
            })
            // Redirect to base portal where user can create profile
            router.push(`/patient-portal`)
          }
        }
      } else {
        setError(result.error)
        toast({
          title: "Login Failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = "An error occurred during login. Please try again later."
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoggingIn(false)
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
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-100 p-3 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm text-teal-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 rounded border-gray-300"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember" className="text-sm text-gray-500">
                Remember me
              </label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              className="w-full bg-teal-600 hover:bg-teal-700" 
              type="submit" 
              disabled={loading || isLoggingIn}
            >
              {isLoggingIn ? "Logging in..." : loading ? "Loading..." : "Login"}
            </Button>
            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link href="/register" className="text-teal-600 hover:underline">
                Register
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}