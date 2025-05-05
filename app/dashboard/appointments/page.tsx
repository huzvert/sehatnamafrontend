"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/app/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Filter, Clock, Trash, Edit, Eye } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { format, parse, isValid } from "date-fns"
import ProtectedRoute from "@/components/ProtectedRoute"

// Constants for appointment status
const APPOINTMENT_STATUS = {
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled"
}

export default function AppointmentsPage() {
  return (
    <ProtectedRoute allowedRoles={['doctor', 'admin']}>
      <AppointmentsContent />
    </ProtectedRoute>
  )
}

function AppointmentsContent() {
  // Debug environment variables
  console.log('DEBUG - Environment variables:', {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NODE_ENV: process.env.NODE_ENV,
    computedAPI_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
  })

  const { user, isDoctor, isAdmin } = useAuth()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
  
  // Make sure this logs the correct URL
  console.log('DEBUG - Final API_URL being used:', API_URL)
  
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointmentsForSelectedDate, setAppointmentsForSelectedDate] = useState([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [formData, setFormData] = useState({
    patient: "",
    patientName: "",
    doctor: "",
    doctorName: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    time: "",
    purpose: "",
    notes: "",
    status: APPOINTMENT_STATUS.SCHEDULED,
    manualEntry: false
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10
  const [highlightedDates, setHighlightedDates] = useState([])

  // Format date for API calls
  const formatDateForAPI = (date) => {
    if (!date) return ""
    return format(new Date(date), 'yyyy-MM-dd')
  }

  // Format date for display
  const formatDateForDisplay = (date) => {
    if (!date) return ""
    
    if (typeof date === 'string' && date.includes('T')) {
      return format(new Date(date), 'MMMM d, yyyy')
    }
    
    if (typeof date === 'string' && date.includes('-')) {
      const parsed = parse(date, 'yyyy-MM-dd', new Date())
      if (isValid(parsed)) {
        return format(parsed, 'MMMM d, yyyy')
      }
    }
    
    return format(new Date(date), 'MMMM d, yyyy')
  }

  // Fetch appointments data
  const fetchAppointments = useCallback(async () => {
    if (!user || !user.id) return
    
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      // Construct endpoint URL based on user role
      let endpoint = isAdmin() 
        ? `${API_URL}/api/appointments?page=${currentPage}&limit=${itemsPerPage}`
        : `${API_URL}/api/appointments/today`
      
      console.log('Fetching from endpoint:', endpoint)
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched appointments data:', data)
        
        if (isAdmin() && data.appointments) {
          setAppointments(data.appointments)
          setTotalPages(Math.ceil(data.total / itemsPerPage))
          updateCalendarHighlights(data.appointments)
        } else {
          setAppointments(data)
          setTotalPages(1)
          updateCalendarHighlights(data)
        }
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        
        toast({
          title: "Error",
          description: errorData.message || `Failed to load appointments. Status: ${response.status}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast({
        title: "Error",
        description: "Failed to load appointments. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [user, currentPage, isAdmin, API_URL])

  // Update calendar highlighted dates
  const updateCalendarHighlights = (appointmentsData) => {
    if (!appointmentsData || !Array.isArray(appointmentsData)) return
    
    const dates = appointmentsData.map(app => {
      if (typeof app.date === 'string' && app.date.includes('-')) {
        return parse(app.date, 'yyyy-MM-dd', new Date())
      }
      return new Date(app.date)
    }).filter(date => isValid(date))
    
    setHighlightedDates(dates)
  }

  const fetchAppointmentsByDate = useCallback(async (date) => {
    if (!user || !user.id) return
    
    try {
      const token = localStorage.getItem('token')
      const formattedDate = formatDateForAPI(date)
      
      console.log('Fetching appointments for date:', formattedDate)
      
      const response = await fetch(`${API_URL}/api/appointments/date/${formattedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Appointments for date:', data)
        setAppointmentsForSelectedDate(data)
      } else {
        console.error('Error fetching appointments by date:', response.status)
        setAppointmentsForSelectedDate([])
        toast({
          title: "Error",
          description: "Failed to load appointments for selected date.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching appointments by date:', error)
      setAppointmentsForSelectedDate([])
      toast({
        title: "Error",
        description: "Failed to load appointments for selected date.",
        variant: "destructive"
      })
    }
  }, [user, API_URL])
  
  // Create a new appointment
  const createAppointment = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Add comprehensive debugging
      console.log('DEBUG - Form Data:', {
        patient: formData.patient,
        patientName: formData.patientName,
        doctor: formData.doctor,
        doctorName: formData.doctorName,
        date: formData.date,
        time: formData.time,
        purpose: formData.purpose,
        manualEntry: formData.manualEntry,
        user: {
          id: user?.id,
          _id: user?._id,
          role: user?.role
        }
      })
      
      // Debug API URL and token
      console.log('DEBUG - API URL:', `${API_URL}/api/appointments`)
      console.log('DEBUG - Token exists:', !!token)
      console.log('DEBUG - Token value:', token ? token.substring(0, 10) + '...' : 'NO TOKEN')
      
      // Validate required fields
      if (!formData.time || !formData.purpose) {
        console.log('DEBUG - Validation failed: Missing time or purpose')
        toast({
          title: "Error",
          description: "Please fill in time and purpose",
          variant: "destructive"
        })
        return
      }
      
      if (formData.manualEntry && !formData.patientName) {
        console.log('DEBUG - Validation failed: Manual entry missing patient name')
        toast({
          title: "Error",
          description: "Please enter patient name",
          variant: "destructive"
        })
        return
      }
      
      if (!formData.manualEntry && !formData.patient) {
        console.log('DEBUG - Validation failed: Standard mode missing patient selection')
        toast({
          title: "Error", 
          description: "Please select a patient",
          variant: "destructive"
        })
        return
      }
      
      // Create payload based on form data
      let payload
      
      if (formData.manualEntry) {
        payload = {
          patient: "000000000000000000000000", // Placeholder ObjectId
          patientName: formData.patientName,
          doctor: formData.doctor || (user._id || user.id),
          doctorName: formData.doctorName || (user.role === 'doctor' ? `Dr. ${user.firstName} ${user.lastName}` : ''),
          date: formData.date,
          time: formData.time,
          purpose: formData.purpose,
          notes: formData.notes || "",
          status: formData.status,
          manualEntry: true
        }
        console.log('DEBUG - Manual entry payload:', payload)
      } else {
        payload = {
          patient: formData.patient, // This should be the patientId (P-1001, etc.)
          doctor: formData.doctor || (user._id || user.id),
          date: formData.date,
          time: formData.time,
          purpose: formData.purpose,
          notes: formData.notes || "",
          status: formData.status,
          manualEntry: false
        }
        console.log('DEBUG - Standard mode payload:', payload)
      }
      
      console.log('DEBUG - Final payload to be sent:', JSON.stringify(payload, null, 2))
      
      const requestUrl = `${API_URL}/api/appointments`
      console.log('DEBUG - Making POST request to:', requestUrl)
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      
      console.log('DEBUG - Response status:', response.status)
      console.log('DEBUG - Response headers:', Object.fromEntries(response.headers.entries()))
      
      const data = await response.json()
      console.log('DEBUG - Server response:', data)
      
      if (response.ok) {
        console.log('DEBUG - Successfully created appointment')
        toast({
          title: "Success",
          description: "Appointment created successfully.",
        })
        setShowAddDialog(false)
        resetFormData()
        fetchAppointments()
        
        if (formatDateForAPI(selectedDate) === formData.date) {
          fetchAppointmentsByDate(selectedDate)
        }
      } else {
        console.error('DEBUG - Error creating appointment:', data)
        toast({
          title: "Error",
          description: data.message || `Failed to create appointment. Status: ${response.status}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('DEBUG - Error creating appointment:', error)
      console.error('ERROR - Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      toast({
        title: "Error",
        description: `Failed to create appointment: ${error.message}`,
        variant: "destructive"
      })
    }
  }
    
  // Update an existing appointment
  const updateAppointment = async () => {
    if (!selectedAppointment || !selectedAppointment.id) return
    
    try {
      const token = localStorage.getItem('token')
      
      let payload
      
      if (formData.manualEntry) {
        payload = {
          patient: formData.patient,
          patientName: formData.patientName,
          doctor: formData.doctor || selectedAppointment.doctor,
          doctorName: formData.doctorName,
          date: formData.date,
          time: formData.time,
          purpose: formData.purpose,
          notes: formData.notes || "",
          status: formData.status,
          manualEntry: true
        }
      } else {
        payload = {
          patient: formData.patient,
          doctor: formData.doctor,
          date: formData.date,
          time: formData.time,
          purpose: formData.purpose,
          notes: formData.notes || "",
          status: formData.status
        }
      }
      
      console.log('Updating appointment with data:', payload)
      
      const response = await fetch(`${API_URL}/api/appointments/${selectedAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Updated appointment:', data)
        
        toast({
          title: "Success",
          description: "Appointment updated successfully.",
        })
        setShowEditDialog(false)
        resetFormData()
        fetchAppointments()
        
        if (formatDateForAPI(selectedDate) === formatDateForAPI(new Date(formData.date))) {
          fetchAppointmentsByDate(selectedDate)
        }
      } else {
        const errorData = await response.json()
        console.error('Error updating appointment:', errorData)
        toast({
          title: "Error",
          description: errorData.message || "Failed to update appointment.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
      toast({
        title: "Error",
        description: "Failed to update appointment. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Delete an appointment
  const deleteAppointment = async () => {
    if (!selectedAppointment || !selectedAppointment.id) return
    
    try {
      const token = localStorage.getItem('token')
      
      console.log('Deleting appointment:', selectedAppointment.id)
      
      const response = await fetch(`${API_URL}/api/appointments/${selectedAppointment.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Appointment deleted successfully.",
        })
        setShowDeleteDialog(false)
        fetchAppointments()
        fetchAppointmentsByDate(selectedDate)
      } else {
        const errorData = await response.json()
        console.error('Error deleting appointment:', errorData)
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete appointment.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting appointment:', error)
      toast({
        title: "Error",
        description: "Failed to delete appointment. Please try again.",
        variant: "destructive"
      })
    }
  }
  
  // Search appointments
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchAppointments()
      return
    }
    
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      console.log('Searching appointments with query:', searchQuery)
      
      const response = await fetch(`${API_URL}/api/appointments/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Search results:', data)
        setAppointments(data)
      } else {
        const errorData = await response.json()
        console.error('Search error:', errorData)
        toast({
          title: "Error",
          description: errorData.message || "Failed to search appointments.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error searching appointments:', error)
      toast({
        title: "Error",
        description: "Failed to search appointments. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Reset form data
  const resetFormData = () => {
    setFormData({
      patient: "",
      patientName: "",
      doctor: user.role === 'doctor' ? (user._id || user.id) : "",
      doctorName: user.role === 'doctor' ? `Dr. ${user.firstName} ${user.lastName}` : "",
      date: format(new Date(), 'yyyy-MM-dd'),
      time: "",
      purpose: "",
      notes: "",
      status: APPOINTMENT_STATUS.SCHEDULED,
      manualEntry: false
    })
  }
  
  // Toggle manual entry mode
  const toggleManualEntry = (enabled) => {
    setFormData(prev => ({
      ...prev,
      manualEntry: enabled
    }))
  }

  // Handle date selection in calendar view
  const handleDateSelect = (date) => {
    setSelectedDate(date)
    fetchAppointmentsByDate(date)
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  // Handle select changes for dropdowns
  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    })
  }

  // Status badge component
  const StatusBadge = ({ status }) => (
    <Badge
      variant={
        status === APPOINTMENT_STATUS.COMPLETED
          ? "default"
          : status === APPOINTMENT_STATUS.CANCELLED
            ? "destructive"
            : status === APPOINTMENT_STATUS.IN_PROGRESS
              ? "secondary"
              : "outline"
      }
      className={
        status === APPOINTMENT_STATUS.COMPLETED
          ? "bg-green-500"
          : status === APPOINTMENT_STATUS.IN_PROGRESS
            ? "bg-blue-500"
            : ""
      }
    >
      {status}
    </Badge>
  )

  // Initial data fetch
  useEffect(() => {
    const testAPIConnection = async () => {
      try {
        console.log('DEBUG - Testing API connection...')
        console.log('DEBUG - API_URL:', API_URL)
        
        // Test base API endpoint
        const testResponse = await fetch(`${API_URL}/api`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        console.log('DEBUG - API test response status:', testResponse.status)
        
        if (testResponse.ok) {
          const testData = await testResponse.json()
          console.log('DEBUG - API test response data:', testData)
        } else {
          console.log('DEBUG - API test failed with status:', testResponse.status)
        }
      } catch (error) {
        console.error('DEBUG - API test error:', error)
      }
    }
    
    // Run the test when component mounts
    testAPIConnection()
    
    if (user && user.id) {
      fetchAppointments()
      
      if (isDoctor()) {
        setFormData(prev => ({
          ...prev,
          doctor: user._id || user.id,
          doctorName: `Dr. ${user.firstName} ${user.lastName}`,
          date: format(new Date(), 'yyyy-MM-dd')
        }))
      }
    }
  }, [user, fetchAppointments, isDoctor, API_URL])

  useEffect(() => {
    if (user && user.id) {
      fetchAppointmentsByDate(selectedDate)
    }
  }, [user, selectedDate, fetchAppointmentsByDate])

  // Get title for the page
  const pageTitle = isAdmin() ? "All Appointments" : "Your Appointments"

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Medical Portal</h1>
        <p className="text-gray-500">{pageTitle}</p>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <Button 
              className="bg-teal-600 hover:bg-teal-700" 
              size="sm"
              onClick={() => {
                resetFormData()
                setShowAddDialog(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Appointment
            </Button>
          </div>
        </div>

        <TabsContent value="list">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input 
                type="search" 
                placeholder="Search appointments..." 
                className="w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                type="submit" 
                size="icon" 
                variant="ghost"
                onClick={handleSearch}
              >
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>

          <Card>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6">
                        Loading appointments...
                      </TableCell>
                    </TableRow>
                  ) : appointments.length > 0 ? (
                    appointments.map((appointment) => (
                      <TableRow key={appointment.id || appointment._id}>
                        <TableCell className="font-medium">{appointment.id || appointment._id}</TableCell>
                        <TableCell>
                          {appointment.patientName || (appointment.patient && (
                            typeof appointment.patient === 'object' 
                              ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                              : appointment.patient
                          ))}
                        </TableCell>
                        <TableCell>
                          {appointment.date && formatDateForDisplay(appointment.date)}
                        </TableCell>
                        <TableCell>{appointment.time}</TableCell>
                        <TableCell>{appointment.purpose}</TableCell>
                        <TableCell>
                          {appointment.doctorName || (appointment.doctor && (
                            typeof appointment.doctor === 'object'
                              ? `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
                              : appointment.doctor
                          ))}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={appointment.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setSelectedAppointment(appointment)
                                setShowViewDialog(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setSelectedAppointment(appointment)
                                setFormData({
                                  patient: appointment.patient || "",
                                  patientName: appointment.patientName || "",
                                  doctor: appointment.doctor || "",
                                  doctorName: appointment.doctorName || "",
                                  date: formatDateForAPI(appointment.date),
                                  time: appointment.time,
                                  purpose: appointment.purpose,
                                  notes: appointment.notes || "",
                                  status: appointment.status,
                                  manualEntry: appointment.manualEntry || false
                                })
                                setShowEditDialog(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setSelectedAppointment(appointment)
                                setShowDeleteDialog(true)
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6">
                        No appointments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-gray-500">
              Showing page {currentPage} of {totalPages || 1}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              Next
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <Card className="p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold mb-4">Select Date</h3>
                <Calendar 
                  className="rounded-md border" 
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  mode="single"
                  modifiers={{
                    hasAppointment: highlightedDates
                  }}
                  modifiersStyles={{
                    hasAppointment: {
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      borderRadius: '50%',
                      fontWeight: 'bold',
                      border: '2px solid #10b981'
                    }
                  }}
                />
                <div className="mt-4 flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-teal-100 border-2 border-teal-500"></div>
                  <span className="text-sm text-gray-500">Days with appointments</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </h3>
                <div className="space-y-4 max-h-[450px] overflow-y-auto">
                  {appointmentsForSelectedDate.length > 0 ? (
                    appointmentsForSelectedDate.map((appointment, index) => (
                      <div
                        key={appointment.id || appointment._id || index}
                        className="flex items-center gap-4 p-3 rounded-md border hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          setSelectedAppointment(appointment)
                          setShowViewDialog(true)
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 text-teal-600">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">
                            {appointment.patientName || (appointment.patient && (
                              typeof appointment.patient === 'object' 
                                ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                                : appointment.patient
                            ))}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.time} • {appointment.purpose}
                          </div>
                        </div>
                        <StatusBadge status={appointment.status} />
                        <div className="flex ml-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedAppointment(appointment)
                              setFormData({
                                patient: appointment.patient || "",
                                patientName: appointment.patientName || "",
                                doctor: appointment.doctor || "",
                                doctorName: appointment.doctorName || "",
                                date: formatDateForAPI(appointment.date),
                                time: appointment.time,
                                purpose: appointment.purpose,
                                notes: appointment.notes || "",
                                status: appointment.status,
                                manualEntry: appointment.manualEntry || false
                              })
                              setShowEditDialog(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      No appointments for this date
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Appointment</DialogTitle>
          </DialogHeader>
          
          <div className="mb-4">
            <Label className="flex items-center space-x-2">
              <Input 
                type="checkbox" 
                checked={formData.manualEntry}
                onChange={(e) => toggleManualEntry(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Manual entry (type patient and doctor names directly)</span>
            </Label>
          </div>
          
          <div className="grid gap-4 py-4">
            {formData.manualEntry ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="patient">Patient ID (optional)</Label>
                  <Input
                    id="patient"
                    name="patient"
                    value={formData.patient}
                    onChange={handleInputChange}
                    placeholder="P-1234"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="patientName">Patient Name</Label>
                  <Input
                    id="patientName"
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleInputChange}
                    placeholder="e.g. Ahmed Khan"
                    required
                  />
                </div>
                
                {!isDoctor() && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="doctor">Doctor ID (optional)</Label>
                      <Input
                        id="doctor"
                        name="doctor"
                        value={formData.doctor}
                        onChange={handleInputChange}
                        placeholder="D-1234"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="doctorName">Doctor Name</Label>
                      <Input
                        id="doctorName"
                        name="doctorName"
                        value={formData.doctorName}
                        onChange={handleInputChange}
                        placeholder="e.g. Dr. Rashid Ahmed"
                        required
                      />
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="patient">Patient</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("patient", value)}
                    value={formData.patient}  // Changed from defaultValue
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select or search for a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P-1001">Ahmed Khan</SelectItem>
                      <SelectItem value="P-1002">Fatima Ali</SelectItem>
                      <SelectItem value="P-1003">Zainab Malik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {!isDoctor() && (
                  <div className="grid gap-2">
                    <Label htmlFor="doctor">Doctor</Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("doctor", value)}
                      value={formData.doctor}  // Changed from defaultValue
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="D-1001">Dr. Rashid Ahmed</SelectItem>
                        <SelectItem value="D-1002">Dr. Sara Khan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Input
                id="purpose"
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                placeholder="Reason for visit"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={createAppointment}
              disabled={!formData.time || !formData.purpose || 
                (formData.manualEntry ? !formData.patientName : !formData.patient)}
            >
              Create Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Patient</p>
                  <p className="mt-1">
                    {selectedAppointment.patientName || (selectedAppointment.patient && (
                      typeof selectedAppointment.patient === 'object' 
                        ? `${selectedAppointment.patient.firstName} ${selectedAppointment.patient.lastName}`
                        : selectedAppointment.patient
                    ))}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Doctor</p>
                  <p className="mt-1">
                    {selectedAppointment.doctorName || (selectedAppointment.doctor && (
                      typeof selectedAppointment.doctor === 'object'
                        ? `Dr. ${selectedAppointment.doctor.firstName} ${selectedAppointment.doctor.lastName}`
                        : selectedAppointment.doctor
                    ))}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="mt-1">
                    {selectedAppointment.date && formatDateForDisplay(selectedAppointment.date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Time</p>
                  <p className="mt-1">{selectedAppointment.time}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Purpose</p>
                <p className="mt-1">{selectedAppointment.purpose}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedAppointment.status} />
                </div>
              </div>
              {selectedAppointment.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="mt-1">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
            <Button 
              variant="outline"
              onClick={() => {
                setShowViewDialog(false)
                if (selectedAppointment) {
                  setFormData({
                    patient: selectedAppointment.patient || "",
                    patientName: selectedAppointment.patientName || "",
                    doctor: selectedAppointment.doctor || "",
                    doctorName: selectedAppointment.doctorName || "",
                    date: formatDateForAPI(selectedAppointment.date),
                    time: selectedAppointment.time,
                    purpose: selectedAppointment.purpose,
                    notes: selectedAppointment.notes || "",
                    status: selectedAppointment.status,
                    manualEntry: selectedAppointment.manualEntry || false
                  })
                  setShowEditDialog(true)
                }
              }}
            >
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
          </DialogHeader>
          
          <div className="mb-4">
            <Label className="flex items-center space-x-2">
              <Input 
                type="checkbox" 
                checked={formData.manualEntry}
                onChange={(e) => toggleManualEntry(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Manual entry (type patient and doctor names directly)</span>
            </Label>
          </div>
          
          <div className="grid gap-4 py-4">
            {formData.manualEntry ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="edit-patient">Patient ID (optional)</Label>
                  <Input
                    id="edit-patient"
                    name="patient"
                    value={formData.patient}
                    onChange={handleInputChange}
                    placeholder="P-1234"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-patientName">Patient Name</Label>
                  <Input
                    id="edit-patientName"
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleInputChange}
                    placeholder="e.g. Ahmed Khan"
                    required
                  />
                </div>
                
                {!isDoctor() && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-doctor">Doctor ID (optional)</Label>
                      <Input
                        id="edit-doctor"
                        name="doctor"
                        value={formData.doctor}
                        onChange={handleInputChange}
                        placeholder="D-1234"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-doctorName">Doctor Name</Label>
                      <Input
                        id="edit-doctorName"
                        name="doctorName"
                        value={formData.doctorName}
                        onChange={handleInputChange}
                        placeholder="e.g. Dr. Rashid Ahmed"
                        required
                      />
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="edit-patient-select">Patient</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("patient", value)}
                    value={formData.patient}  // Changed from defaultValue
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select or search for a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P-1001">Ahmed Khan</SelectItem>
                      <SelectItem value="P-1002">Fatima Ali</SelectItem>
                      <SelectItem value="P-1003">Zainab Malik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {!isDoctor() && (
                  <div className="grid gap-2">
                    <Label htmlFor="edit-doctor-select">Doctor</Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("doctor", value)}
                      value={formData.doctor}  // Changed from defaultValue
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="D-1001">Dr. Rashid Ahmed</SelectItem>
                        <SelectItem value="D-1002">Dr. Sara Khan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-time">Time</Label>
                <Input
                  id="edit-time"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-purpose">Purpose</Label>
              <Input
                id="edit-purpose"
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                placeholder="Reason for visit"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                onValueChange={(value) => handleSelectChange("status", value)}
                value={formData.status}  // Changed from defaultValue
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={APPOINTMENT_STATUS.SCHEDULED}>{APPOINTMENT_STATUS.SCHEDULED}</SelectItem>
                  <SelectItem value={APPOINTMENT_STATUS.IN_PROGRESS}>{APPOINTMENT_STATUS.IN_PROGRESS}</SelectItem>
                  <SelectItem value={APPOINTMENT_STATUS.COMPLETED}>{APPOINTMENT_STATUS.COMPLETED}</SelectItem>
                  <SelectItem value={APPOINTMENT_STATUS.CANCELLED}>{APPOINTMENT_STATUS.CANCELLED}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={updateAppointment}
              disabled={!formData.time || !formData.purpose || 
                (formData.manualEntry ? !formData.patientName : !formData.patient)}
            >
              Update Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this appointment? This action cannot be undone.</p>
            {selectedAppointment && (
              <div className="mt-4 p-4 border rounded-md bg-gray-50">
                <p><strong>Patient:</strong> {
                  selectedAppointment.patientName || (selectedAppointment.patient && (
                    typeof selectedAppointment.patient === 'object' 
                      ? `${selectedAppointment.patient.firstName} ${selectedAppointment.patient.lastName}`
                      : selectedAppointment.patient
                  ))
                }</p>
                <p><strong>Date:</strong> {selectedAppointment.date && formatDateForDisplay(selectedAppointment.date)}</p>
                <p><strong>Time:</strong> {selectedAppointment.time}</p>
                <p><strong>Purpose:</strong> {selectedAppointment.purpose}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={deleteAppointment}>Delete Appointment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}