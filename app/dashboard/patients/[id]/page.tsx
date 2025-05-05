"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Calendar, FileText, FlaskRoundIcon as Flask, Phone, Mail, MapPin, Edit, Upload, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/app/context/AuthContext"

export default function PatientDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDocumentScannerOpen, setIsDocumentScannerOpen] = useState(false)
  const [editedPatient, setEditedPatient] = useState(null)
  const [scanningStatus, setScanningStatus] = useState("idle") // idle, scanning, complete
  const [updating, setUpdating] = useState(false)

  // Use consistent API URL
  const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '')

  // Fetch patient data from API
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/api/patients/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const data = await response.json()
        setPatient(data)
        setEditedPatient(data)
        setError(null)
      } catch (error) {
        console.error('Error fetching patient data:', error)
        setError('Failed to load patient data. Please try again later.')
        toast({
          title: "Error",
          description: "Could not load patient data. Please try again.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchPatientData()
    } else {
      setLoading(false)
      setError('No patient ID provided')
    }
  }, [params.id, API_URL])

  // Handle patient information update
  const handleUpdatePatient = async () => {
    try {
      setUpdating(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/api/patients/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: editedPatient.firstName,
          lastName: editedPatient.lastName,
          age: editedPatient.age,
          gender: editedPatient.gender,
          bloodGroup: editedPatient.bloodGroup,
          contact: editedPatient.contact,
          email: editedPatient.email,
          address: editedPatient.address,
          emergencyContact: editedPatient.emergencyContact,
          condition: editedPatient.condition,
          allergies: editedPatient.allergies
        })
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      
      // Update the patient state with the updated information
      setPatient(editedPatient)
      setIsEditDialogOpen(false)
      
      toast({
        title: "Patient Updated",
        description: `${editedPatient.name}'s information has been updated.`,
      })
    } catch (error) {
      console.error('Error updating patient:', error)
      toast({
        title: "Error",
        description: "Failed to update patient information. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }

  // Handle document scanning and upload
  const handleScanDocument = async (event) => {
    event.preventDefault()
    const fileInput = event.target.querySelector('input[type="file"]')
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      toast({
        title: "Error",
        description: "Please select a document to scan",
        variant: "destructive"
      })
      return
    }

    try {
      setScanningStatus("scanning")
      const file = fileInput.files[0]
      const token = localStorage.getItem('token')
      
      // Create form data for upload
      const formData = new FormData()
      formData.append('document', file)
      formData.append('title', 'Scanned Prescription')
      formData.append('type', 'prescription')
      formData.append('tags', 'prescription,scanned')
      
      // Upload document
      const uploadResponse = await fetch(
        `${API_URL}/api/patients/${params.id}/documents`, 
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      )
      
      if (!uploadResponse.ok) {
        throw new Error(`Error: ${uploadResponse.status}`)
      }
      
      const uploadData = await uploadResponse.json()
      
      // Process document (extract data from it)
      const processResponse = await fetch(
        `${API_URL}/api/patients/${params.id}/documents/${uploadData.document.id}/process`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (!processResponse.ok) {
        throw new Error(`Error: ${processResponse.status}`)
      }
      
      const processData = await processResponse.json()
      
      // Set status to complete and show success message
      setScanningStatus("complete")
      
      toast({
        title: "Document Scanned",
        description: "Medical document has been scanned and data extracted successfully.",
      })
      
      // Fetch updated patient data to reflect new prescription
      const patientResponse = await fetch(`${API_URL}/api/patients/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (patientResponse.ok) {
        const patientData = await patientResponse.json()
        setPatient(patientData)
      }
      
      // Close the scanner dialog after a delay
      setTimeout(() => {
        setIsDocumentScannerOpen(false)
        setScanningStatus("idle")
      }, 1500)
    } catch (error) {
      console.error('Error scanning document:', error)
      setScanningStatus("idle")
      toast({
        title: "Error",
        description: "Failed to scan document. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Display error message if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <AlertCircle className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-bold mb-2">Error Loading Patient</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Display loading state
  if (loading || !patient) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/patients">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Patient Details</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading patient information...</p>
          </div>
        </div>
      </div>
    )
  }

  // Format allergies if it's a string
  const allergiesArray = typeof patient.allergies === 'string' 
    ? patient.allergies.split(',').map(a => a.trim()) 
    : patient.allergies || []

  return (
    <div className="flex flex-col gap-6">
      <Toaster />
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/patients">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Patient Details</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Patient Information</CardTitle>
              <CardDescription>Personal and contact details</CardDescription>
            </div>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Edit Patient Information</DialogTitle>
                  <DialogDescription>Update the patient's personal and contact details.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={editedPatient.firstName || ''}
                        onChange={(e) => setEditedPatient({ ...editedPatient, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={editedPatient.lastName || ''}
                        onChange={(e) => setEditedPatient({ ...editedPatient, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        value={editedPatient.age || ''}
                        onChange={(e) =>
                          setEditedPatient({ ...editedPatient, age: Number.parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Input
                        id="gender"
                        value={editedPatient.gender || ''}
                        onChange={(e) => setEditedPatient({ ...editedPatient, gender: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bloodGroup">Blood Group</Label>
                      <Input
                        id="bloodGroup"
                        value={editedPatient.bloodGroup || ''}
                        onChange={(e) => setEditedPatient({ ...editedPatient, bloodGroup: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="condition">Medical Condition</Label>
                      <Input
                        id="condition"
                        value={editedPatient.condition || ''}
                        onChange={(e) => setEditedPatient({ ...editedPatient, condition: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact Number</Label>
                    <Input
                      id="contact"
                      value={editedPatient.contact || ''}
                      onChange={(e) => setEditedPatient({ ...editedPatient, contact: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editedPatient.email || ''}
                      onChange={(e) => setEditedPatient({ ...editedPatient, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={editedPatient.address || ''}
                      onChange={(e) => setEditedPatient({ ...editedPatient, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                    <Input
                      id="emergencyContact"
                      value={editedPatient.emergencyContact || ''}
                      onChange={(e) => setEditedPatient({ ...editedPatient, emergencyContact: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allergies">Allergies (comma-separated)</Label>
                    <Input
                      id="allergies"
                      value={Array.isArray(editedPatient.allergies) ? editedPatient.allergies.join(', ') : (editedPatient.allergies || '')}
                      onChange={(e) => setEditedPatient({ 
                        ...editedPatient, 
                        allergies: e.target.value.split(',').map(a => a.trim())
                      })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEditedPatient(patient)
                      setIsEditDialogOpen(false)
                    }}
                    disabled={updating}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="bg-teal-600 hover:bg-teal-700" 
                    onClick={handleUpdatePatient}
                    disabled={updating}
                  >
                    {updating ? (
                      <>
                        <div className="mr-2 h-4 w-4 rounded-full border-2 border-t-teal-100 border-teal-200 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src="/placeholder-user.jpg" alt={patient.name} />
                <AvatarFallback>
                  {patient.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-xl font-bold">{patient.name}</h2>
                <p className="text-sm text-gray-500">Patient ID: {patient.id}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Age</span>
                <span>{patient.age} years</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Gender</span>
                <span>{patient.gender}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Blood Group</span>
                <span>{patient.bloodGroup}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Medical Condition</span>
                <Badge variant="outline">{patient.condition}</Badge>
              </div>
            </div>
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{patient.contact}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{patient.email}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                <span className="text-sm">{patient.address}</span>
              </div>
            </div>
            {patient.medicalHistory && patient.medicalHistory.length > 0 && (
              <div className="space-y-3 pt-3 border-t">
                <h3 className="font-medium">Medical History</h3>
                <div className="space-y-2">
                  {patient.medicalHistory.map((item, index) => (
                    <div key={index} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span>{item.condition}</span>
                        <Badge
                          variant={item.status === "Ongoing" ? "default" : "secondary"}
                          className={item.status === "Ongoing" ? "bg-blue-500" : ""}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        Diagnosed: {new Date(item.diagnosedDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-3 pt-3 border-t">
              <h3 className="font-medium">Allergies</h3>
              <div className="flex flex-wrap gap-2">
                {allergiesArray.length > 0 ? (
                  allergiesArray.map((allergy, index) => (
                    <Badge key={index} variant="destructive" className="bg-red-500">
                      {allergy}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No known allergies</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Patient History</CardTitle>
              <div className="flex gap-2">
                <Button asChild className="bg-teal-600 hover:bg-teal-700" size="sm">
                  <Link href={`/dashboard/patients/${params.id}/documents`}>
                    <FileText className="mr-2 h-4 w-4" />
                    View Documents
                  </Link>
                </Button>
                <Dialog open={isDocumentScannerOpen} onOpenChange={setIsDocumentScannerOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-teal-600 hover:bg-teal-700" size="sm">
                      <Upload className="mr-2 h-4 w-4" />
                      Scan Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Document Scanner</DialogTitle>
                      <DialogDescription>
                        Scan a medical document to automatically extract patient data.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleScanDocument}>
                      <div className="py-6">
                        {scanningStatus === "idle" && (
                          <div className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-lg">
                            <Upload className="h-10 w-10 text-gray-400" />
                            <p className="text-center text-gray-500">
                              Drag and drop a document here, or click to select a file
                            </p>
                            <Input 
                              type="file" 
                              className="max-w-xs" 
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            />
                            <p className="text-xs text-gray-500">
                              Supported formats: PDF, DOC, DOCX, JPG, PNG
                            </p>
                          </div>
                        )}
                        {scanningStatus === "scanning" && (
                          <div className="flex flex-col items-center justify-center gap-4 p-8">
                            <div className="h-10 w-10 rounded-full border-4 border-t-teal-600 animate-spin" />
                            <p className="text-center">Scanning document and extracting data...</p>
                          </div>
                        )}
                        {scanningStatus === "complete" && (
                          <div className="flex flex-col items-center justify-center gap-4 p-8">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                              ✓
                            </div>
                            <p className="text-center font-medium">Document scanned successfully!</p>
                            <p className="text-center text-sm text-gray-500">
                              Extracted prescription data has been added to the patient's record
                            </p>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button 
                          type="button"
                          variant="outline" 
                          onClick={() => {
                            setIsDocumentScannerOpen(false)
                            setScanningStatus("idle")
                          }}
                          disabled={scanningStatus === "scanning"}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="bg-teal-600 hover:bg-teal-700"
                          disabled={scanningStatus !== "idle"}
                        >
                          {scanningStatus === "idle"
                            ? "Scan Document"
                            : scanningStatus === "scanning"
                              ? "Scanning..."
                              : "Done"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="appointments" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="appointments">
                    <Calendar className="mr-2 h-4 w-4" />
                    Appointments
                  </TabsTrigger>
                  <TabsTrigger value="prescriptions">
                    <FileText className="mr-2 h-4 w-4" />
                    Prescriptions
                  </TabsTrigger>
                  <TabsTrigger value="lab-reports">
                    <Flask className="mr-2 h-4 w-4" />
                    Lab Reports
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="appointments" className="mt-4">
                  <div className="space-y-4">
                    {patient.appointments && patient.appointments.length > 0 ? (
                      patient.appointments.map((appointment) => (
                        <Card key={appointment.id}>
                          <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={appointment.status === "Completed" ? "default" : "outline"}
                                    className={appointment.status === "Completed" ? "bg-green-500" : ""}
                                  >
                                    {appointment.status}
                                  </Badge>
                                  <span className="font-medium">{appointment.purpose}</span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {new Date(appointment.date).toLocaleDateString()} at {appointment.time} •{" "}
                                  {appointment.doctor}
                                </div>
                              </div>
                              <div className="text-sm">
                                {appointment.notes && (
                                  <div className="p-2 bg-gray-50 rounded-md">
                                    <span className="font-medium">Notes: </span>
                                    {appointment.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium">No appointments found</h3>
                        <p className="text-sm text-gray-500">This patient has no recorded appointments</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="prescriptions" className="mt-4">
                  <div className="space-y-4">
                    {patient.prescriptions && patient.prescriptions.length > 0 ? (
                      patient.prescriptions.map((prescription) => (
                        <Card key={prescription.id}>
                          <CardContent className="p-4">
                            <div className="flex flex-col gap-4">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant={prescription.status === "Active" ? "default" : "secondary"}
                                      className={prescription.status === "Active" ? "bg-green-500" : ""}
                                    >
                                      {prescription.status}
                                    </Badge>
                                    <span className="font-medium">{prescription.id}</span>
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    {new Date(prescription.date).toLocaleDateString()} • {prescription.doctor}
                                  </div>
                                </div>
                                <Button variant="outline" size="sm">
                                  Download
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium">Medications</h4>
                                <div className="grid gap-2">
                                  {prescription.medications.map((medication, index) => (
                                    <div key={index} className="p-2 bg-gray-50 rounded-md">
                                      <div className="font-medium">
                                        {medication.name} ({medication.dosage})
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {medication.frequency} for {medication.duration}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {prescription.notes && (
                                <div className="text-sm">
                                  <span className="font-medium">Notes: </span>
                                  {prescription.notes}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium">No prescriptions found</h3>
                        <p className="text-sm text-gray-500">This patient has no recorded prescriptions</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="lab-reports" className="mt-4">
                  <div className="space-y-4">
                    {patient.labReports && patient.labReports.length > 0 ? (
                      patient.labReports.map((report) => (
                        <Card key={report.id}>
                          <CardContent className="p-4">
                            <div className="flex flex-col gap-4">
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant={report.status === "Completed" ? "default" : "secondary"}
                                      className={report.status === "Completed" ? "bg-green-500" : ""}
                                    >
                                      {report.status}
                                    </Badge>
                                    <span className="font-medium">{report.type}</span>
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    {new Date(report.date).toLocaleDateString()} • {report.lab} • Requested by{" "}
                                    {report.requestedBy}
                                  </div>
                                </div>
                                <Button variant="outline" size="sm">
                                  View Full Report
                                </Button>
                              </div>
                              {report.results && report.results.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium">Results</h4>
                                  <div className="grid gap-2">
                                    {report.results.map((result, index) => (
                                      <div key={index} className="p-2 bg-gray-50 rounded-md">
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium">{result.test}</span>
                                          <Badge
                                            variant={result.status === "Normal" ? "outline" : "secondary"}
                                            className={
                                              result.status === "High"
                                                ? "bg-yellow-500"
                                                : result.status === "Low"
                                                  ? "bg-blue-500"
                                                  : ""
                                            }
                                          >
                                            {result.status}
                                          </Badge>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          Value: {result.value} (Normal Range: {result.normalRange})
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {report.notes && (
                                <div className="text-sm">
                                  <span className="font-medium">Notes: </span>
                                  {report.notes}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Flask className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium">No lab reports found</h3>
                        <p className="text-sm text-gray-500">This patient has no recorded lab reports</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}