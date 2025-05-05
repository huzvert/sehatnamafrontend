"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/app/context/AuthContext"

export default function PatientsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false)
  const [isEditPatientOpen, setIsEditPatientOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [patientToEdit, setPatientToEdit] = useState(null)
  const [patientToDelete, setPatientToDelete] = useState(null)
  const [editedPatient, setEditedPatient] = useState(null)
  const [newPatient, setNewPatient] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "Patient@123",
    age: "",
    gender: "",
    bloodGroup: "",
    contact: "",
    address: "",
    emergencyContact: "",
    condition: "",
    allergies: ""
  })
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Use consistent API URL
  const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '')

  // Fetch patients data from API
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        
        if (!token) {
          router.push('/login')
          return
        }

        const response = await fetch(`${API_URL}/api/patients`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.status === 401) {
          localStorage.removeItem('token')
          router.push('/login')
          return
        }

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || `Error: ${response.status}`)
        }

        const data = await response.json()
        
        // Ensure data is an array and format it properly
        const formattedPatients = Array.isArray(data) ? data.map(patient => ({
          id: patient.id || patient.patientId || patient._id,
          name: patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
          age: patient.age || '',
          gender: patient.gender || '',
          contact: patient.contact || '',
          condition: patient.condition || 'None',
          lastVisit: patient.lastVisit || 'No visits',
          email: patient.email || ''
        })) : []
        
        setPatients(formattedPatients)
        setError(null)
      } catch (error) {
        console.error('Error fetching patients:', error)
        setError('Failed to load patients. Please try again later.')
        toast({
          title: "Error",
          description: error.message || "Could not load patients. Please try again.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
  }, [API_URL, router])

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // Reset to first page on search
  }

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient => 
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.condition && patient.condition.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Calculate pagination
  const patientsPerPage = 10
  const calculatedTotalPages = Math.ceil(filteredPatients.length / patientsPerPage)
  const startIndex = (currentPage - 1) * patientsPerPage
  const endIndex = Math.min(startIndex + patientsPerPage, filteredPatients.length)
  const currentPatients = filteredPatients.slice(startIndex, endIndex)

  // Update totalPages when filteredPatients change
  useEffect(() => {
    setTotalPages(calculatedTotalPages)
  }, [calculatedTotalPages])

  // Handle new patient form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewPatient({
      ...newPatient,
      [name]: value
    })
  }

  // Handle edit patient form input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target
    setEditedPatient({
      ...editedPatient,
      [name]: value
    })
  }

  // Handle select input changes
  const handleSelectChange = (name, value) => {
    setNewPatient({
      ...newPatient,
      [name]: value
    })
  }

  // Handle edit select input changes
  const handleEditSelectChange = (name, value) => {
    setEditedPatient({
      ...editedPatient,
      [name]: value
    })
  }

  // Fetch patient details for editing
  const fetchPatientDetails = async (patientId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/patients/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch patient details')
      }
      
      const data = await response.json()
      // Transform allergies array to comma-separated string
      if (Array.isArray(data.allergies)) {
        data.allergies = data.allergies.join(', ')
      }
      setEditedPatient(data)
      setIsEditPatientOpen(true)
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to load patient details",
        variant: "destructive"
      })
    }
  }

  // Handle patient edit
  const handleEditPatient = (patient) => {
    setPatientToEdit(patient)
    fetchPatientDetails(patient.id)
  }

  // Handle patient update
  const handleUpdatePatient = async () => {
    try {
      setEditing(true)
      const token = localStorage.getItem('token')
      
      const dataToSend = {
        firstName: editedPatient.firstName,
        lastName: editedPatient.lastName,
        age: editedPatient.age ? parseInt(editedPatient.age) : null,
        gender: editedPatient.gender,
        bloodGroup: editedPatient.bloodGroup,
        contact: editedPatient.contact,
        email: editedPatient.email,
        address: editedPatient.address,
        emergencyContact: editedPatient.emergencyContact,
        condition: editedPatient.condition,
        allergies: typeof editedPatient.allergies === 'string' 
          ? editedPatient.allergies.split(',').map(a => a.trim()).filter(a => a)
          : editedPatient.allergies
      }

      const response = await fetch(`${API_URL}/api/patients/${editedPatient.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error: ${response.status}`)
      }

      const data = await response.json()
      
      // Update patient in the list
      setPatients(patients.map(p => {
        if (p.id === editedPatient.id) {
          return {
            ...p,
            name: `${dataToSend.firstName} ${dataToSend.lastName}`,
            age: dataToSend.age || '',
            gender: dataToSend.gender || '',
            contact: dataToSend.contact || '',
            condition: dataToSend.condition || 'None',
            email: dataToSend.email || ''
          }
        }
        return p
      }))
      
      setIsEditPatientOpen(false)
      setEditedPatient(null)
      setPatientToEdit(null)
      
      toast({
        title: "Success",
        description: "Patient updated successfully",
      })
    } catch (error) {
      console.error('Error updating patient:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update patient. Please try again.",
        variant: "destructive"
      })
    } finally {
      setEditing(false)
    }
  }

  // Handle patient creation - SIMPLIFIED WITHOUT VALIDATION
  const handleCreatePatient = async () => {
    try {
      setCreating(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        router.push('/login')
        return
      }
      
      // Convert age to number and format allergies
      const patientData = {
        ...newPatient,
        age: newPatient.age ? parseInt(newPatient.age, 10) : undefined,
        allergies: newPatient.allergies ? newPatient.allergies.split(',').map(a => a.trim()).filter(a => a) : []
      };
      
      const response = await fetch(`${API_URL}/api/patients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patientData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error: ${response.status}`)
      }

      const data = await response.json()
      
      // Format the new patient data for the list
      const newPatientForList = {
        id: data.id || data.patientId,
        name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        age: data.age || '',
        gender: data.gender || '',
        contact: patientData.contact || '',
        condition: patientData.condition || 'None',
        lastVisit: 'No visits',
        email: data.email || ''
      }
      
      // Add new patient to the list
      setPatients([newPatientForList, ...patients])
      
      // Reset form and close dialog
      setNewPatient({
        firstName: "",
        lastName: "",
        email: "",
        password: "Patient@123",
        age: "",
        gender: "",
        bloodGroup: "",
        contact: "",
        address: "",
        emergencyContact: "",
        condition: "",
        allergies: ""
      })
      setIsAddPatientOpen(false)
      
      toast({
        title: "Success",
        description: "Patient created successfully",
      })
    } catch (error) {
      console.error('Error creating patient:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create patient. Please try again.",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  // Handle patient deletion confirmation
  const handleConfirmDelete = (patient) => {
    console.log('Setting patient to delete:', patient)
    setPatientToDelete(patient)
    setIsDeleteDialogOpen(true)
  }

  // Handle patient deletion - FIXED
  const handleDeletePatient = async () => {
    if (!patientToDelete) {
      console.error('No patient selected for deletion')
      return
    }
    
    try {
      setDeleting(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        console.error('No token found')
        router.push('/login')
        return
      }

      console.log('Deleting patient ID:', patientToDelete.id)
      console.log('API URL:', `${API_URL}/api/patients/${patientToDelete.id}`)
      
      const response = await fetch(`${API_URL}/api/patients/${patientToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Delete response status:', response.status)

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (jsonError) {
          const textData = await response.text()
          console.error('Non-JSON error response:', textData)
          throw new Error(`Server error: ${response.status}`)
        }
        console.error('Delete error data:', errorData)
        throw new Error(errorData.message || `Error: ${response.status}`)
      }

      // Parse response if JSON
      let responseData
      try {
        responseData = await response.json()
        console.log('Delete success response:', responseData)
      } catch (jsonError) {
        // Response might not be JSON, that's okay
        console.log('Delete successful (no JSON response)')
      }

      // Remove the deleted patient from the list
      const updatedPatients = patients.filter(p => p.id !== patientToDelete.id)
      setPatients(updatedPatients)
      
      setIsDeleteDialogOpen(false)
      setPatientToDelete(null)
      
      toast({
        title: "Success",
        description: "Patient deleted successfully",
      })
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete patient. Please try again.",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
    }
  }


  // Navigate to patient details page
  const navigateToPatientDetails = (patientId) => {
    router.push(`/dashboard/patients/${patientId}`)
  }

  // Navigate to patient edit page
  const navigateToPatientEdit = (patientId) => {
    router.push(`/dashboard/patients/${patientId}/edit`)
  }

  // Handle next page
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Handle previous page
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Toaster />
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
        <p className="text-gray-500">Manage and view patient records</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input 
            type="search" 
            placeholder="Search patients..." 
            className="w-full"
            value={searchTerm}
            onChange={handleSearchChange} 
          />
          <Button type="submit" size="icon" variant="ghost">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button 
            className="bg-teal-600 hover:bg-teal-700" 
            size="sm"
            onClick={() => setIsAddPatientOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading patients...</p>
              </div>
            </div>
          ) : currentPatients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Medical Condition</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.id}</TableCell>
                    <TableCell>{patient.name}</TableCell>
                    <TableCell>{patient.age}</TableCell>
                    <TableCell>{patient.gender}</TableCell>
                    <TableCell>{patient.contact}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{patient.condition || 'None'}</Badge>
                    </TableCell>
                    <TableCell>{patient.lastVisit || 'No visits'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigateToPatientDetails(patient.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditPatient(patient)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleConfirmDelete(patient)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">No patients found</h3>
              <p className="text-sm text-gray-500">
                {searchTerm 
                  ? "Try adjusting your search term" 
                  : "Add your first patient to get started"}
              </p>
            </div>
          )}
        </div>
      </Card>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">{filteredPatients.length > 0 ? startIndex + 1 : 0}</span> to{" "}
          <span className="font-medium">{endIndex}</span> of{" "}
          <span className="font-medium">{filteredPatients.length}</span> results
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleNextPage}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Next
        </Button>
      </div>

      {/* Add Patient Dialog - SIMPLIFIED */}
      <Dialog open={isAddPatientOpen} onOpenChange={setIsAddPatientOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>
              Enter the patient's information below to create a new patient record.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={newPatient.firstName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={newPatient.lastName}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={newPatient.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  value={newPatient.age}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select 
                  value={newPatient.gender} 
                  onValueChange={(value) => handleSelectChange('gender', value)}
                >
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Select 
                  value={newPatient.bloodGroup} 
                  onValueChange={(value) => handleSelectChange('bloodGroup', value)}
                >
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
                  name="contact"
                  value={newPatient.contact}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={newPatient.address}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input
                id="emergencyContact"
                name="emergencyContact"
                value={newPatient.emergencyContact}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Medical Condition</Label>
              <Input
                id="condition"
                name="condition"
                value={newPatient.condition}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies (comma-separated)</Label>
              <Input
                id="allergies"
                name="allergies"
                value={newPatient.allergies}
                onChange={handleInputChange}
                placeholder="e.g. Penicillin, Dust, Pollen"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddPatientOpen(false)
                setNewPatient({
                  firstName: "",
                  lastName: "",
                  email: "",
                  password: "Patient@123",
                  age: "",
                  gender: "",
                  bloodGroup: "",
                  contact: "",
                  address: "",
                  emergencyContact: "",
                  condition: "",
                  allergies: ""
                })
              }}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={handleCreatePatient}
              disabled={creating}
            >
              {creating ? (
                <>
                  <div className="mr-2 h-4 w-4 rounded-full border-2 border-t-teal-100 border-teal-200 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Patient'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={isEditPatientOpen} onOpenChange={setIsEditPatientOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
            <DialogDescription>
              Update the patient's information below.
            </DialogDescription>
          </DialogHeader>
          {editedPatient && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">First Name</Label>
                  <Input
                    id="edit-firstName"
                    name="firstName"
                    value={editedPatient.firstName}
                    onChange={handleEditInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Last Name</Label>
                  <Input
                    id="edit-lastName"
                    name="lastName"
                    value={editedPatient.lastName}
                    onChange={handleEditInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={editedPatient.email}
                  onChange={handleEditInputChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-age">Age</Label>
                  <Input
                    id="edit-age"
                    name="age"
                    type="number"
                    value={editedPatient.age || ''}
                    onChange={handleEditInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-gender">Gender</Label>
                  <Select 
                    value={editedPatient.gender || ''} 
                    onValueChange={(value) => handleEditSelectChange('gender', value)}
                  >
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-bloodGroup">Blood Group</Label>
                  <Select 
                    value={editedPatient.bloodGroup || ''} 
                    onValueChange={(value) => handleEditSelectChange('bloodGroup', value)}
                  >
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
                  <Label htmlFor="edit-contact">Contact Number</Label>
                  <Input
                    id="edit-contact"
                    name="contact"
                    value={editedPatient.contact || ''}
                    onChange={handleEditInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  name="address"
                  value={editedPatient.address || ''}
                  onChange={handleEditInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-emergencyContact">Emergency Contact</Label>
                <Input
                  id="edit-emergencyContact"
                  name="emergencyContact"
                  value={editedPatient.emergencyContact || ''}
                  onChange={handleEditInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-condition">Medical Condition</Label>
                <Input
                  id="edit-condition"
                  name="condition"
                  value={editedPatient.condition || ''}
                  onChange={handleEditInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-allergies">Allergies (comma-separated)</Label>
                <Input
                  id="edit-allergies"
                  name="allergies"
                  value={editedPatient.allergies || ''}
                  onChange={handleEditInputChange}
                  placeholder="e.g. Penicillin, Dust, Pollen"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditPatientOpen(false)
                setEditedPatient(null)
                setPatientToEdit(null)
              }}
              disabled={editing}
            >
              Cancel
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={handleUpdatePatient}
              disabled={editing}
            >
              {editing ? (
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this patient? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {patientToDelete && (
              <p className="text-sm font-medium">
                {patientToDelete.name} (ID: {patientToDelete.id})
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setPatientToDelete(null)
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeletePatient}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <div className="mr-2 h-4 w-4 rounded-full border-2 border-t-red-100 border-red-200 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Patient'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}