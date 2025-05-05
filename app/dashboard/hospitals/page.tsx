"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Filter, Edit, Trash2, MapPin, Phone } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentHospital, setCurrentHospital] = useState(null)
  const [newHospital, setNewHospital] = useState({
    name: "",
    type: "",
    address: "",
    phone: "",
    email: "",
    services: [],
    status: "Active",
  })

  // Fetch hospitals on component mount
  useEffect(() => {
    fetchHospitals()
  }, [])

  // Fetch all hospitals from API
  const fetchHospitals = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`${API_BASE_URL}/hospitals`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to fetch hospitals')
      }
      
      const data = await response.json()
      setHospitals(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching hospitals:', err.message)
      setError(err.message || 'Failed to fetch hospitals. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Filter hospitals based on search term
  const filteredHospitals = hospitals.filter(
    (hospital) =>
      hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.address.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Handle adding a new hospital
  const handleAddHospital = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/hospitals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newHospital),
      })
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to add hospital')
      }
  
      const addedHospital = await response.json()
      setHospitals([...hospitals, addedHospital])
      setIsAddDialogOpen(false)
      setNewHospital({
        name: "",
        type: "",
        address: "",
        phone: "",
        email: "",
        services: [],
        status: "Active",
      })
  
      toast({
        title: "Hospital/Lab Added",
        description: `${addedHospital.name} has been added to the system.`,
      })
    } catch (err) {
      console.error('Error adding hospital:', err.message)
      toast({
        title: "Error",
        description: err.message || "Failed to add hospital. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Handle editing a hospital
  const handleEditHospital = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/hospitals/${currentHospital._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(currentHospital),
      })
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to update hospital')
      }
  
      const updatedHospital = await response.json()
      const updatedHospitals = hospitals.map((hospital) =>
        hospital._id === updatedHospital._id ? updatedHospital : hospital
      )
  
      setHospitals(updatedHospitals)
      setIsEditDialogOpen(false)
      setCurrentHospital(null)
  
      toast({
        title: "Hospital/Lab Updated",
        description: `${updatedHospital.name} has been updated.`,
      })
    } catch (err) {
      console.error('Error updating hospital:', err.message)
      toast({
        title: "Error",
        description: err.message || "Failed to update hospital. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Handle deleting a hospital
  const handleDeleteHospital = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/hospitals/${currentHospital._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to delete hospital')
      }
  
      const updatedHospitals = hospitals.filter((hospital) => hospital._id !== currentHospital._id)
      setHospitals(updatedHospitals)
      setIsDeleteDialogOpen(false)
      setCurrentHospital(null)
  
      toast({
        title: "Hospital/Lab Deleted",
        description: `${currentHospital.name} has been removed from the system.`,
      })
    } catch (err) {
      console.error('Error deleting hospital:', err.message)
      toast({
        title: "Error",
        description: err.message || "Failed to delete hospital. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Handle service selection
  const handleServiceSelection = (service, isSelected) => {
    if (currentHospital) {
      // For editing
      if (isSelected) {
        setCurrentHospital({
          ...currentHospital,
          services: [...currentHospital.services, service],
        })
      } else {
        setCurrentHospital({
          ...currentHospital,
          services: currentHospital.services.filter((s) => s !== service),
        })
      }
    } else {
      // For adding new
      if (isSelected) {
        setNewHospital({
          ...newHospital,
          services: [...newHospital.services, service],
        })
      } else {
        setNewHospital({
          ...newHospital,
          services: newHospital.services.filter((s) => s !== service),
        })
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Toaster />
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Hospitals & Labs</h1>
        <p className="text-gray-500">Manage hospitals, labs, and diagnostic centers</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            type="search"
            placeholder="Search hospitals and labs..."
            className="w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Hospital/Lab
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Hospital or Lab</DialogTitle>
                <DialogDescription>Enter the details of the new facility to add to the system.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Facility Name</Label>
                    <Input
                      id="name"
                      value={newHospital.name}
                      onChange={(e) => setNewHospital({ ...newHospital, name: e.target.value })}
                      placeholder="Enter facility name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Facility Type</Label>
                    <Select onValueChange={(value) => setNewHospital({ ...newHospital, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hospital">Hospital</SelectItem>
                        <SelectItem value="Laboratory">Laboratory</SelectItem>
                        <SelectItem value="Diagnostic Center">Diagnostic Center</SelectItem>
                        <SelectItem value="Specialty Clinic">Specialty Clinic</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={newHospital.address}
                    onChange={(e) => setNewHospital({ ...newHospital, address: e.target.value })}
                    placeholder="Enter complete address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={newHospital.phone}
                      onChange={(e) => setNewHospital({ ...newHospital, phone: e.target.value })}
                      placeholder="e.g., +92 21 1234567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newHospital.email}
                      onChange={(e) => setNewHospital({ ...newHospital, email: e.target.value })}
                      placeholder="e.g., info@hospital.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Services Offered</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Emergency",
                      "Surgery",
                      "Radiology",
                      "Laboratory",
                      "Blood Tests",
                      "X-Ray",
                      "MRI",
                      "CT Scan",
                      "Ultrasound",
                      "Pathology",
                      "Cardiology",
                      "ECG",
                    ].map((service) => (
                      <div key={service} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`service-${service}`}
                          className="h-4 w-4 rounded border-gray-300"
                          checked={newHospital.services.includes(service)}
                          onChange={(e) => handleServiceSelection(service, e.target.checked)}
                        />
                        <label htmlFor={`service-${service}`} className="text-sm">
                          {service}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    defaultValue="Active"
                    onValueChange={(value) => setNewHospital({ ...newHospital, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleAddHospital}>
                  Add Facility
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <p>Loading hospitals...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-8 text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHospitals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      No hospitals found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHospitals.map((hospital) => (
                    <TableRow key={hospital._id}>
                      <TableCell className="font-medium">{hospital._id}</TableCell>
                      <TableCell>{hospital.name}</TableCell>
                      <TableCell>{hospital.type}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={hospital.address}>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-500" />
                          {hospital.address}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-500" />
                            {hospital.phone}
                          </div>
                          <div className="text-xs text-gray-500">{hospital.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {hospital.services?.slice(0, 2).map((service, idx) => (
                            <Badge key={`${hospital._id}-${idx}`} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                          {hospital.services?.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{hospital.services.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={hospital.status === "Active" ? "default" : "secondary"}
                          className={hospital.status === "Active" ? "bg-green-500" : ""}
                        >
                          {hospital.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog
                            open={isEditDialogOpen && currentHospital?._id === hospital._id}
                            onOpenChange={(open) => {
                              setIsEditDialogOpen(open)
                              if (!open) setCurrentHospital(null)
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setCurrentHospital(hospital)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                              {currentHospital && (
                                <>
                                  <DialogHeader>
                                    <DialogTitle>Edit Facility</DialogTitle>
                                    <DialogDescription>Update the details of this facility.</DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-name">Facility Name</Label>
                                        <Input
                                          id="edit-name"
                                          value={currentHospital.name}
                                          onChange={(e) => setCurrentHospital({ ...currentHospital, name: e.target.value })}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-type">Facility Type</Label>
                                        <Select
                                          defaultValue={currentHospital.type}
                                          onValueChange={(value) => setCurrentHospital({ ...currentHospital, type: value })}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Hospital">Hospital</SelectItem>
                                            <SelectItem value="Laboratory">Laboratory</SelectItem>
                                            <SelectItem value="Diagnostic Center">Diagnostic Center</SelectItem>
                                            <SelectItem value="Specialty Clinic">Specialty Clinic</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-address">Address</Label>
                                      <Textarea
                                        id="edit-address"
                                        value={currentHospital.address}
                                        onChange={(e) =>
                                          setCurrentHospital({ ...currentHospital, address: e.target.value })
                                        }
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-phone">Phone Number</Label>
                                        <Input
                                          id="edit-phone"
                                          value={currentHospital.phone}
                                          onChange={(e) =>
                                            setCurrentHospital({ ...currentHospital, phone: e.target.value })
                                          }
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-email">Email</Label>
                                        <Input
                                          id="edit-email"
                                          type="email"
                                          value={currentHospital.email}
                                          onChange={(e) =>
                                            setCurrentHospital({ ...currentHospital, email: e.target.value })
                                          }
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Services Offered</Label>
                                      <div className="grid grid-cols-2 gap-2">
                                        {[
                                          "Emergency",
                                          "Surgery",
                                          "Radiology",
                                          "Laboratory",
                                          "Blood Tests",
                                          "X-Ray",
                                          "MRI",
                                          "CT Scan",
                                          "Ultrasound",
                                          "Pathology",
                                          "Cardiology",
                                          "ECG",
                                        ].map((service) => (
                                          <div key={service} className="flex items-center space-x-2">
                                            <input
                                              type="checkbox"
                                              id={`edit-service-${service}`}
                                              className="h-4 w-4 rounded border-gray-300"
                                              checked={currentHospital.services?.includes(service) || false}
                                              onChange={(e) => handleServiceSelection(service, e.target.checked)}
                                            />
                                            <label htmlFor={`edit-service-${service}`} className="text-sm">
                                              {service}
                                            </label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-status">Status</Label>
                                      <Select
                                        defaultValue={currentHospital.status}
                                        onValueChange={(value) => setCurrentHospital({ ...currentHospital, status: value })}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Active">Active</SelectItem>
                                          <SelectItem value="Inactive">Inactive</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                      Cancel
                                    </Button>
                                    <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleEditHospital}>
                                      Save Changes
                                    </Button>
                                  </DialogFooter>
                                </>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Dialog
                            open={isDeleteDialogOpen && currentHospital?._id === hospital._id}
                            onOpenChange={(open) => {
                              setIsDeleteDialogOpen(open)
                              if (!open) setCurrentHospital(null)
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setCurrentHospital(hospital)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              {currentHospital && (
                                <>
                                  <DialogHeader>
                                    <DialogTitle>Delete Facility</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to delete {currentHospital.name}? This action cannot be undone.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter className="mt-4">
                                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                      Cancel
                                    </Button>
                                    <Button variant="destructive" onClick={handleDeleteHospital}>
                                      Delete
                                    </Button>
                                  </DialogFooter>
                                </>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">1</span> to{" "}
          <span className="font-medium">{filteredHospitals.length}</span> of{" "}
          <span className="font-medium">{filteredHospitals.length}</span> results
        </div>
        <Button variant="outline" size="sm">
          Previous
        </Button>
        <Button variant="outline" size="sm">
          Next
        </Button>
      </div>
    </div>
  )
}