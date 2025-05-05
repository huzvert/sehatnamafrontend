"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/app/context/AuthContext"
import ProtectedRoute from "../../components/ProtectedRoute"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Users, Calendar, FileText, FlaskRoundIcon as Flask, ArrowUpRight, Plus } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['doctor', 'admin']}>
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const { user, isDoctor, isAdmin, loading: authLoading } = useAuth()
  const [stats, setStats] = useState({
    totalPatients: 0,
    appointmentsToday: 0,
    remainingAppointments: 0,
    prescriptions: 0,
    labReports: 0,
    pendingReports: 0
  })
  const [appointments, setAppointments] = useState([])
  const [recentPatients, setRecentPatients] = useState([])
  const [pendingReports, setPendingReports] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Use consistent API URL (same as prescription page)
  const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '')
  
  // Determine if we're still loading data
  const isLoading = loading || authLoading

  // Fetch dashboard data function with user context
  const fetchDashboardData = useCallback(async () => {
    // Fix: Check for user and user.id like the appointments page does
    if (!user || !user.id) {
      console.log('DEBUG - No user or user.id:', { user: !!user, id: user?.id })
      return;
    }
    
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      // Same authentication check as prescriptions page
      if (!token) {
        console.log('No authentication token found')
        window.location.href = '/login'
        return
      }

      console.log('DEBUG - Fetching data for user:', { userId: user.id })

      // Fetch patients data to calculate stats
      const patientsResponse = await fetch(`${API_URL}/api/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!patientsResponse.ok) {
        console.error('Failed to fetch patients:', patientsResponse.status)
      } else {
        const patientsData = await patientsResponse.json()
        console.log('DEBUG - Patients data:', patientsData)
        setStats(prev => ({ ...prev, totalPatients: Array.isArray(patientsData) ? patientsData.length : 0 }))
      }
      
      // Fetch recent patients - this only works if user is a doctor
      if (isDoctor()) {
        const recentPatientsResponse = await fetch(`${API_URL}/api/patients/recent`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (recentPatientsResponse.ok) {
          const recentData = await recentPatientsResponse.json()
          console.log('DEBUG - Recent patients data:', recentData)
          setRecentPatients(recentData || [])
        } else {
          console.error('Failed to fetch recent patients:', recentPatientsResponse.status)
        }
      } else {
        // For admins, get recent patients differently
        const allPatientsResponse = await fetch(`${API_URL}/api/patients?page=1&limit=5`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (allPatientsResponse.ok) {
          const allData = await allPatientsResponse.json()
          const formattedRecent = allData.slice(0, 5).map(patient => ({
            id: patient.id,
            name: patient.name,
            age: patient.age,
            condition: patient.condition || 'No condition specified',
            lastVisit: 'No visits yet' // This would need to be determined from appointments
          }))
          setRecentPatients(formattedRecent)
        }
      }
      
      // Fetch today's appointments for this doctor/admin (same as appointments page)
      const appointmentsResponse = await fetch(`${API_URL}/api/appointments/today`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json()
        console.log('DEBUG - Appointments data:', appointmentsData)
        setAppointments(appointmentsData || [])
        
        // Calculate stats from appointments
        const todayCount = appointmentsData.length
        const remainingCount = appointmentsData.filter(apt => apt.status !== 'Completed').length
        
        setStats(prev => ({
          ...prev,
          appointmentsToday: todayCount,
          remainingAppointments: remainingCount
        }))
      }
      
      // Fetch all prescriptions to calculate stats
      const prescriptionsResponse = await fetch(`${API_URL}/api/prescriptions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (prescriptionsResponse.ok) {
        const prescriptionsData = await prescriptionsResponse.json()
        console.log('DEBUG - Prescriptions data:', prescriptionsData)
        setStats(prev => ({ ...prev, prescriptions: Array.isArray(prescriptionsData) ? prescriptionsData.length : 0 }))
      }
      
      // Fetch lab reports
      const reportsResponse = await fetch(`${API_URL}/api/lab-reports`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json()
        console.log('DEBUG - Lab reports response:', reportsData)
        
        // The API returns a structured response with reports array
        let allReports = []
        let pendingReportsData = []
        
        if (Array.isArray(reportsData)) {
          allReports = reportsData
          pendingReportsData = reportsData.filter(report => report.status === 'Pending')
        } else if (reportsData && Array.isArray(reportsData.reports)) {
          allReports = reportsData.reports
          pendingReportsData = reportsData.reports.filter(report => report.status === 'Pending')
        }
        
        // Format the pending reports for display
        const formattedPendingReports = pendingReportsData.map(report => ({
          id: report.id,
          patientName: report.patientName || 'Unknown Patient',
          type: report.type,
          test: report.testType || report.type,
          date: report.date,
          status: report.status
        }))
        
        setPendingReports(formattedPendingReports)
        
        setStats(prev => ({
          ...prev,
          labReports: allReports.length,
          pendingReports: pendingReportsData.length
        }))
      } else {
        console.error('Failed to fetch lab reports:', reportsResponse.status)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [user, API_URL, isDoctor])

  // Fix: Use same useEffect pattern as appointments page
  useEffect(() => {
    console.log('DEBUG - useEffect triggered:', { user: !!user, authLoading, userId: user?.id })
    if (user && user.id) {
      fetchDashboardData()
    }
  }, [user, fetchDashboardData])

  // Display doctor's specialty if available
  const doctorSpecialty = user?.specialty ? ` - ${user.specialty}` : ''
  
  // Display appropriate role title
  const roleTitle = isAdmin() ? 'Admin' : (isDoctor() ? 'Doctor' : 'User')
  
  // Get user's full name from context
  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : roleTitle

  // Format appointment time
  const formatTime = (time) => {
    if (time) return time
    return new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  // Extract patient name from appointment data
  const getPatientName = (appointment) => {
    if (appointment.patientName) return appointment.patientName
    if (appointment.patient?.user?.firstName && appointment.patient?.user?.lastName) {
      return `${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`
    }
    return 'Unknown Patient'
  }

  // Add debug for entire component render
  console.log('DEBUG - Dashboard render:', { 
    user: !!user, 
    userId: user?.id, 
    authLoading, 
    loading,
    isLoading 
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Medical Portal</h1>
        <p className="text-gray-500">Welcome back, {userName}{doctorSpecialty}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? 'Loading...' : stats.totalPatients || '0'}</div>
            <p className="text-xs text-gray-500">All patients in the system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Appointments Today</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? 'Loading...' : stats.appointmentsToday || '0'}</div>
            <p className="text-xs text-gray-500">{stats.remainingAppointments || '0'} remaining</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? 'Loading...' : stats.prescriptions || '0'}</div>
            <p className="text-xs text-gray-500">Total prescriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lab Reports</CardTitle>
            <Flask className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? 'Loading...' : stats.labReports || '0'}</div>
            <p className="text-xs text-gray-500">{stats.pendingReports || '0'} pending review</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="appointments">Today's Appointments</TabsTrigger>
          <TabsTrigger value="recent-patients">Recent Patients</TabsTrigger>
          <TabsTrigger value="pending-reports">Pending Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="appointments" className="border rounded-md mt-2">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Today's Appointments</h3>
              <Link href="/dashboard/appointments/new">
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="mr-2 h-4 w-4" />
                  New Appointment
                </Button>
              </Link>
            </div>
            <div className="divide-y">
              {isLoading ? (
                <div className="py-4 text-center text-gray-500">Loading appointments...</div>
              ) : appointments.length > 0 ? (
                appointments.map((appointment, index) => (
                  <div key={appointment.id || appointment._id || index} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium">
                        {formatTime(appointment.time)}
                      </div>
                      <div>
                        <div className="font-medium">
                          {getPatientName(appointment)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.purpose || appointment.reason || 'No reason specified'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div
                        className={`text-xs px-2 py-1 rounded-full ${
                          appointment.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : appointment.status === "In Progress"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {appointment.status}
                      </div>
                      <Link href={`/dashboard/appointments/${appointment.id || appointment._id}`}>
                        <Button variant="ghost" size="icon">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-gray-500">No appointments scheduled for today</div>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="recent-patients" className="border rounded-md mt-2">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Patients</h3>
              <Link href="/dashboard/patients/new">
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Patient
                </Button>
              </Link>
            </div>
            <div className="divide-y">
              {isLoading ? (
                <div className="py-4 text-center text-gray-500">Loading patients...</div>
              ) : recentPatients.length > 0 ? (
                recentPatients.map((patient, index) => (
                  <div key={patient.id || index} className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium">{patient.name}</div>
                      <div className="text-sm text-gray-500">
                        {patient.age} years • {patient.condition || 'No condition specified'}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-500">
                        Last visit: {patient.lastVisit || 'No visits yet'}
                      </div>
                      <Link href={`/dashboard/patients/${patient.id}`}>
                        <Button variant="ghost" size="icon">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-gray-500">No recent patients</div>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="pending-reports" className="border rounded-md mt-2">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Pending Lab Reports</h3>
              <Link href="/dashboard/lab-reports">
                <Button size="sm" variant="outline">
                  View All
                </Button>
              </Link>
            </div>
            <div className="divide-y">
              {isLoading ? (
                <div className="py-4 text-center text-gray-500">Loading reports...</div>
              ) : pendingReports.length > 0 ? (
                pendingReports.map((report, index) => (
                  <div key={report.id || index} className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium">
                        {report.patientName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {report.type} • {report.date ? new Date(report.date).toLocaleDateString() : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                        {report.status}
                      </div>
                      <Link href={`/dashboard/lab-reports/${report.id}`}>
                        <Button variant="ghost" size="icon">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-gray-500">No pending reports</div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}