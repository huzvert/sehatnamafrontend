"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, FileText, FlaskRoundIcon as Flask, LogOut, User, AlertCircle } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"
import ProtectedRoute from "../../../components/ProtectedRoute"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function PatientPortalPage() {
  return (
    <ProtectedRoute allowedRoles={['patient']}>
      <PatientPortalContent />
    </ProtectedRoute>
  )
}

function PatientPortalContent() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [patientData, setPatientData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const params = useParams()

  // Use consistent API URL
  const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '')

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        
        if (!token) {
          throw new Error('Authentication token not found')
        }

        // Try to get patient ID in the following order:
        // 1. From URL params
        // 2. From localStorage
        // 3. From user object
        // 4. From API by matching email
        let patientId = params?.id || localStorage.getItem('patientId') || user?.patientId

        console.log('Initial patient ID:', patientId)

        // If still no patientId, fetch from user's profile
        if (!patientId && user?._id) {
          console.log('Fetching user profile to get patient ID')
          const userResponse = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          if (userResponse.ok) {
            const userData = await userResponse.json()
            patientId = userData.patientId
            console.log('Patient ID from user profile:', patientId)
          }
        }
        
        // If we still don't have a patientId, try to get it from the patients endpoint
        if (!patientId && user?.email) {
          console.log('Fetching all patients to find match')
          const patientsResponse = await fetch(`${API_URL}/api/patients`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (patientsResponse.ok) {
            const patientsData = await patientsResponse.json()
            console.log('All patients:', patientsData)
            
            const currentUserPatient = patientsData.find(p => 
              p.email === user.email || 
              (p.user && p.user.email === user.email)
            )
            
            if (currentUserPatient) {
              patientId = currentUserPatient.patientId || currentUserPatient.id
              console.log('Found patient ID:', patientId)
              
              // Save it for future use
              localStorage.setItem('patientId', patientId)
              
              // Update URL if needed
              if (patientId !== params?.id) {
                window.history.replaceState({}, '', `/patient-portal/${patientId}`)
              }
            }
          }
        }
        
        if (!patientId) {
          console.error('Patient ID not found')
          throw new Error('Patient ID not available. Please contact support.')
        }

        console.log('Fetching patient data for ID:', patientId)

        const response = await fetch(`${API_URL}/api/patients/${patientId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || `Error ${response.status}: Failed to fetch patient data`)
        }
        
        const data = await response.json()
        setPatientData(data)
        setError(null)
      } catch (error) {
        console.error('Error fetching patient data:', error)
        setError(error.message)
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchPatientData()
    } else {
      setLoading(false)
      setError('User not authenticated')
    }
  }, [user, params?.id, API_URL])

  // Handle reschedule appointment functionality
  const handleRescheduleAppointment = async (appointmentId) => {
    toast({
      title: "Feature Coming Soon",
      description: "Appointment rescheduling will be available in the next update.",
    })
  }

  // Handle download prescription functionality
  const handleDownloadPrescription = async (prescriptionId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/prescriptions/${prescriptionId}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) {
        throw new Error('Failed to download prescription')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prescription-${prescriptionId}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Success",
        description: "Prescription downloaded successfully",
      })
    } catch (error) {
      console.error('Error downloading prescription:', error)
      toast({
        title: "Error",
        description: "Failed to download prescription",
        variant: "destructive"
      })
    }
  }

  // Handle view full report functionality
  const handleViewFullReport = (reportId) => {
    window.location.href = `/dashboard/lab-reports/${reportId}`
  }

  // Format allergies array properly
  const formatAllergies = (allergies) => {
    if (!allergies) return []
    if (Array.isArray(allergies)) return allergies
    if (typeof allergies === 'string') return allergies.split(',').map(a => a.trim())
    return []
  }

  // Format date and time for appointments
  const formatAppointmentDateTime = (dateStr, timeStr) => {
    try {
      const date = new Date(dateStr)
      const formattedDate = date.toLocaleDateString()
      return {
        date: formattedDate,
        time: timeStr || date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        })
      }
    } catch (error) {
      return {
        date: 'Invalid date',
        time: timeStr || 'Time not specified'
      }
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
            <h2 className="text-xl font-bold mb-2">Error Loading Data</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/login'}>
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <User className="h-6 w-6 text-teal-600" />
            <span className="text-lg font-bold">Patient Portal</span>
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm font-medium hidden md:block">
            Welcome, {patientData?.firstName || user?.firstName || 'Patient'}
          </span>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading patient information...</p>
            </div>
          </div>
        ) : !patientData ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-lg font-medium">No Patient Data</h3>
              <p className="text-gray-600">Patient information not available</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-4">
            <div className="md:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src="/placeholder-user.jpg" alt={patientData.name} />
                      <AvatarFallback>
                        {patientData.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <h2 className="text-xl font-bold">{patientData.name}</h2>
                      <p className="text-sm text-gray-500">Patient ID: {patientData.id}</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-1">
                    <Button
                      variant={activeTab === "overview" ? "default" : "ghost"}
                      className={`w-full justify-start ${activeTab === "overview" ? "bg-teal-600 hover:bg-teal-700" : ""}`}
                      onClick={() => setActiveTab("overview")}
                    >
                      Overview
                    </Button>
                    <Button
                      variant={activeTab === "appointments" ? "default" : "ghost"}
                      className={`w-full justify-start ${
                        activeTab === "appointments" ? "bg-teal-600 hover:bg-teal-700" : ""
                      }`}
                      onClick={() => setActiveTab("appointments")}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Appointments
                    </Button>
                    <Button
                      variant={activeTab === "prescriptions" ? "default" : "ghost"}
                      className={`w-full justify-start ${
                        activeTab === "prescriptions" ? "bg-teal-600 hover:bg-teal-700" : ""
                      }`}
                      onClick={() => setActiveTab("prescriptions")}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Prescriptions
                    </Button>
                    <Button
                      variant={activeTab === "lab-reports" ? "default" : "ghost"}
                      className={`w-full justify-start ${
                        activeTab === "lab-reports" ? "bg-teal-600 hover:bg-teal-700" : ""
                      }`}
                      onClick={() => setActiveTab("lab-reports")}
                    >
                      <Flask className="mr-2 h-4 w-4" />
                      Lab Reports
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-3">
              {activeTab === "overview" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Patient Overview</CardTitle>
                    <CardDescription>Your personal and medical information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <h3 className="font-medium">Personal Information</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-500">Age</span>
                            <span>{patientData.age || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-500">Gender</span>
                            <span>{patientData.gender || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-500">Blood Group</span>
                            <span>{patientData.bloodGroup || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-500">Contact</span>
                            <span>{patientData.contact || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-500">Email</span>
                            <span>{patientData.email || 'Not specified'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="font-medium">Medical Information</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-500">Medical Condition</span>
                            <Badge variant="outline">{patientData.condition || 'None specified'}</Badge>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Allergies</span>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {formatAllergies(patientData.allergies).length > 0 ? (
                                formatAllergies(patientData.allergies).map((allergy, index) => (
                                  <Badge key={index} variant="destructive" className="bg-red-500">
                                    {allergy}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-gray-500">No known allergies</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-medium">Upcoming Appointments</h3>
                      {patientData.appointments?.filter((appointment) => appointment.status === "Scheduled").length > 0 ? (
                        patientData.appointments
                          .filter((appointment) => appointment.status === "Scheduled")
                          .map((appointment) => {
                            const dateTime = formatAppointmentDateTime(appointment.date, appointment.time)
                            return (
                              <Card key={appointment.id} className="border border-gray-200">
                                <CardContent className="p-4">
                                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                                          {appointment.status}
                                        </Badge>
                                        <span className="font-medium">{appointment.purpose}</span>
                                      </div>
                                      <div className="text-sm text-gray-500 mt-1">
                                        {dateTime.date} at {dateTime.time} • {appointment.doctor}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })
                      ) : (
                        <p className="text-center text-gray-500">No upcoming appointments</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-medium">Current Medications</h3>
                      {patientData.prescriptions?.filter((prescription) => prescription.status === "Active").length > 0 ? (
                        patientData.prescriptions
                          .filter((prescription) => prescription.status === "Active")
                          .flatMap((prescription) =>
                            prescription.medications.map((medication, index) => (
                              <div key={`${prescription.id}-${index}`} className="p-3 bg-gray-50 rounded-md">
                                <div className="font-medium">
                                  {medication.name} ({medication.dosage})
                                </div>
                                <div className="text-sm text-gray-500">
                                  {medication.frequency} for {medication.duration}
                                </div>
                              </div>
                            )),
                          )
                      ) : (
                        <p className="text-center text-gray-500">No active medications</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "appointments" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Appointments</CardTitle>
                    <CardDescription>View your scheduled and past appointments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="upcoming">
                      <TabsList className="mb-4">
                        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                        <TabsTrigger value="past">Past</TabsTrigger>
                      </TabsList>
                      <TabsContent value="upcoming">
                        <div className="space-y-4">
                          {patientData.appointments?.filter((appointment) => appointment.status === "Scheduled").length > 0 ? (
                            patientData.appointments
                              .filter((appointment) => appointment.status === "Scheduled")
                              .map((appointment) => {
                                const dateTime = formatAppointmentDateTime(appointment.date, appointment.time)
                                return (
                                  <Card key={appointment.id} className="border border-gray-200">
                                    <CardContent className="p-4">
                                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                                              {appointment.status}
                                            </Badge>
                                            <span className="font-medium">{appointment.purpose}</span>
                                          </div>
                                          <div className="text-sm text-gray-500 mt-1">
                                            {dateTime.date} at {dateTime.time} • {appointment.doctor}
                                          </div>
                                        </div>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => handleRescheduleAppointment(appointment.id)}
                                        >
                                          Reschedule
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )
                              })
                          ) : (
                            <p className="text-center text-gray-500">No upcoming appointments</p>
                          )}
                        </div>
                      </TabsContent>
                      <TabsContent value="past">
                        <div className="space-y-4">
                          {patientData.appointments?.filter((appointment) => appointment.status === "Completed").length > 0 ? (
                            patientData.appointments
                              .filter((appointment) => appointment.status === "Completed")
                              .map((appointment) => {
                                const dateTime = formatAppointmentDateTime(appointment.date, appointment.time)
                                return (
                                  <Card key={appointment.id} className="border border-gray-200">
                                    <CardContent className="p-4">
                                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <Badge variant="default" className="bg-green-500">
                                              {appointment.status}
                                            </Badge>
                                            <span className="font-medium">{appointment.purpose}</span>
                                          </div>
                                          <div className="text-sm text-gray-500 mt-1">
                                            {dateTime.date} at {dateTime.time} • {appointment.doctor}
                                          </div>
                                        </div>
                                      </div>
                                      {appointment.notes && (
                                        <div className="mt-2 p-2 bg-gray-50 rounded-md text-sm">
                                          <span className="font-medium">Notes: </span>
                                          {appointment.notes}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                )
                              })
                          ) : (
                            <p className="text-center text-gray-500">No past appointments</p>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}

              {activeTab === "prescriptions" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Prescriptions</CardTitle>
                    <CardDescription>View your current and past prescriptions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {patientData.prescriptions?.length > 0 ? (
                        patientData.prescriptions.map((prescription) => (
                          <Card key={prescription.id} className="border border-gray-200">
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
                                      <span className="font-medium">Prescription #{prescription.id.slice(-8)}</span>
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                      {new Date(prescription.date).toLocaleDateString()} • {prescription.doctor}
                                    </div>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleDownloadPrescription(prescription.id)}
                                  >
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
                        <p className="text-center text-gray-500">No prescriptions available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "lab-reports" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Lab Reports</CardTitle>
                    <CardDescription>View your laboratory test results</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {patientData.labReports?.length > 0 ? (
                        patientData.labReports.map((report) => (
                          <Card key={report.id} className="border border-gray-200">
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
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleViewFullReport(report.id)}
                                  >
                                    View Full Report
                                  </Button>
                                </div>
                                {report.results?.length > 0 && (
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
                        <p className="text-center text-gray-500">No lab reports available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}