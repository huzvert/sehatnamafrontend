"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Filter, Edit, Trash2 } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import axios from "axios"

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentMedicine, setCurrentMedicine] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newMedicine, setNewMedicine] = useState({
    name: "",
    category: "",
    manufacturer: "",
    dosage: "",
    form: "",
    stock: 0,
  })

  // Fetch medicines on component mount
  useEffect(() => {
    fetchMedicines()
  }, [])

  // Fetch all medicines from API
  const fetchMedicines = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/medicines`)
      setMedicines(response.data)
      setError(null)
    } catch (err) {
      console.error("Error fetching medicines:", err)
      setError("Failed to load medicines. Please try again later.")
      toast({
        title: "Error",
        description: "Failed to load medicines. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter medicines based on search term
  const filteredMedicines = medicines.filter(
    (medicine) =>
      medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Handle adding a new medicine
  const handleAddMedicine = async () => {
    try {
      // Calculate status based on stock
      const status = newMedicine.stock === 0 ? "Out of Stock" : newMedicine.stock < 20 ? "Low Stock" : "In Stock"
      
      const medicineToAdd = {
        ...newMedicine,
        status,
      }

      const response = await axios.post(`${API_BASE_URL}/medicines`, medicineToAdd)
      
      // Update state with new medicine from server (includes MongoDB _id)
      setMedicines([...medicines, response.data])
      setIsAddDialogOpen(false)
      
      // Reset form
      setNewMedicine({
        name: "",
        category: "",
        manufacturer: "",
        dosage: "",
        form: "",
        stock: 0,
      })

      toast({
        title: "Medicine Added",
        description: `${response.data.name} has been added to the inventory.`,
      })
    } catch (err) {
      console.error("Error adding medicine:", err)
      toast({
        title: "Error",
        description: "Failed to add medicine. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle editing a medicine
  const handleEditMedicine = async () => {
    try {
      // Calculate status based on stock
      const status = currentMedicine.stock === 0 ? "Out of Stock" : currentMedicine.stock < 20 ? "Low Stock" : "In Stock"
      const updatedMedicine = { ...currentMedicine, status }
      
      await axios.put(`${API_BASE_URL}/medicines/${currentMedicine._id}`, updatedMedicine)
      
      // Update local state
      const updatedMedicines = medicines.map((medicine) =>
        medicine._id === currentMedicine._id ? updatedMedicine : medicine,
      )

      setMedicines(updatedMedicines)
      setIsEditDialogOpen(false)

      toast({
        title: "Medicine Updated",
        description: `${currentMedicine.name} has been updated.`,
      })
    } catch (err) {
      console.error("Error updating medicine:", err)
      toast({
        title: "Error",
        description: "Failed to update medicine. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle deleting a medicine
  const handleDeleteMedicine = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/medicines/${currentMedicine._id}`)
      
      // Update local state
      const updatedMedicines = medicines.filter((medicine) => medicine._id !== currentMedicine._id)
      setMedicines(updatedMedicines)
      setIsDeleteDialogOpen(false)

      toast({
        title: "Medicine Deleted",
        description: `${currentMedicine.name} has been removed from the inventory.`,
      })
    } catch (err) {
      console.error("Error deleting medicine:", err)
      toast({
        title: "Error",
        description: "Failed to delete medicine. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Toaster />
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Medicines</h1>
        <p className="text-gray-500">Manage medicine inventory and information</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            type="search"
            placeholder="Search medicines..."
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
                Add Medicine
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Medicine</DialogTitle>
                <DialogDescription>Enter the details of the new medicine to add to the inventory.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Medicine Name</Label>
                    <Input
                      id="name"
                      value={newMedicine.name}
                      onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                      placeholder="Enter medicine name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select onValueChange={(value) => setNewMedicine({ ...newMedicine, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cardiovascular">Cardiovascular</SelectItem>
                        <SelectItem value="Diabetes">Diabetes</SelectItem>
                        <SelectItem value="Respiratory">Respiratory</SelectItem>
                        <SelectItem value="Pain Relief">Pain Relief</SelectItem>
                        <SelectItem value="Antibiotic">Antibiotic</SelectItem>
                        <SelectItem value="Thyroid">Thyroid</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      value={newMedicine.manufacturer}
                      onChange={(e) => setNewMedicine({ ...newMedicine, manufacturer: e.target.value })}
                      placeholder="Enter manufacturer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dosage">Dosage</Label>
                    <Input
                      id="dosage"
                      value={newMedicine.dosage}
                      onChange={(e) => setNewMedicine({ ...newMedicine, dosage: e.target.value })}
                      placeholder="e.g., 10mg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="form">Form</Label>
                    <Select onValueChange={(value) => setNewMedicine({ ...newMedicine, form: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select form" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tablet">Tablet</SelectItem>
                        <SelectItem value="Capsule">Capsule</SelectItem>
                        <SelectItem value="Syrup">Syrup</SelectItem>
                        <SelectItem value="Injection">Injection</SelectItem>
                        <SelectItem value="Inhaler">Inhaler</SelectItem>
                        <SelectItem value="Cream">Cream</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={newMedicine.stock}
                      onChange={(e) => setNewMedicine({ ...newMedicine, stock: Number.parseInt(e.target.value) || 0 })}
                      placeholder="Enter quantity"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleAddMedicine}>
                  Add Medicine
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading medicines...</div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-500">{error}</div>
        </div>
      ) : (
        <Card>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedicines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      No medicines found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMedicines.map((medicine) => (
                    <TableRow key={medicine._id}>
                      <TableCell className="font-medium">{medicine.medicineId || medicine._id.slice(-6)}</TableCell>
                      <TableCell>{medicine.name}</TableCell>
                      <TableCell>{medicine.category}</TableCell>
                      <TableCell>{medicine.manufacturer}</TableCell>
                      <TableCell>{medicine.dosage}</TableCell>
                      <TableCell>{medicine.form}</TableCell>
                      <TableCell>{medicine.stock}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            medicine.status === "In Stock"
                              ? "default"
                              : medicine.status === "Low Stock"
                                ? "secondary"
                                : "destructive"
                          }
                          className={
                            medicine.status === "In Stock"
                              ? "bg-green-500"
                              : medicine.status === "Low Stock"
                                ? "bg-yellow-500"
                                : ""
                          }
                        >
                          {medicine.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog
                            open={isEditDialogOpen && currentMedicine?._id === medicine._id}
                            onOpenChange={(open) => {
                              setIsEditDialogOpen(open)
                              if (!open) setCurrentMedicine(null)
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setCurrentMedicine(medicine)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              {currentMedicine && (
                                <>
                                  <DialogHeader>
                                    <DialogTitle>Edit Medicine</DialogTitle>
                                    <DialogDescription>Update the details of this medicine.</DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-name">Medicine Name</Label>
                                        <Input
                                          id="edit-name"
                                          value={currentMedicine.name}
                                          onChange={(e) => setCurrentMedicine({ ...currentMedicine, name: e.target.value })}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-category">Category</Label>
                                        <Select
                                          defaultValue={currentMedicine.category}
                                          onValueChange={(value) =>
                                            setCurrentMedicine({ ...currentMedicine, category: value })
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Cardiovascular">Cardiovascular</SelectItem>
                                            <SelectItem value="Diabetes">Diabetes</SelectItem>
                                            <SelectItem value="Respiratory">Respiratory</SelectItem>
                                            <SelectItem value="Pain Relief">Pain Relief</SelectItem>
                                            <SelectItem value="Antibiotic">Antibiotic</SelectItem>
                                            <SelectItem value="Thyroid">Thyroid</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-manufacturer">Manufacturer</Label>
                                        <Input
                                          id="edit-manufacturer"
                                          value={currentMedicine.manufacturer}
                                          onChange={(e) =>
                                            setCurrentMedicine({ ...currentMedicine, manufacturer: e.target.value })
                                          }
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-dosage">Dosage</Label>
                                        <Input
                                          id="edit-dosage"
                                          value={currentMedicine.dosage}
                                          onChange={(e) =>
                                            setCurrentMedicine({ ...currentMedicine, dosage: e.target.value })
                                          }
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-form">Form</Label>
                                        <Select
                                          defaultValue={currentMedicine.form}
                                          onValueChange={(value) => setCurrentMedicine({ ...currentMedicine, form: value })}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select form" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Tablet">Tablet</SelectItem>
                                            <SelectItem value="Capsule">Capsule</SelectItem>
                                            <SelectItem value="Syrup">Syrup</SelectItem>
                                            <SelectItem value="Injection">Injection</SelectItem>
                                            <SelectItem value="Inhaler">Inhaler</SelectItem>
                                            <SelectItem value="Cream">Cream</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-stock">Stock Quantity</Label>
                                        <Input
                                          id="edit-stock"
                                          type="number"
                                          value={currentMedicine.stock}
                                          onChange={(e) =>
                                            setCurrentMedicine({
                                              ...currentMedicine,
                                              stock: Number.parseInt(e.target.value) || 0,
                                            })
                                          }
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                      Cancel
                                    </Button>
                                    <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleEditMedicine}>
                                      Save Changes
                                    </Button>
                                  </DialogFooter>
                                </>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Dialog
                            open={isDeleteDialogOpen && currentMedicine?._id === medicine._id}
                            onOpenChange={(open) => {
                              setIsDeleteDialogOpen(open)
                              if (!open) setCurrentMedicine(null)
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setCurrentMedicine(medicine)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              {currentMedicine && (
                                <>
                                  <DialogHeader>
                                    <DialogTitle>Delete Medicine</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to delete {currentMedicine.name}? This action cannot be undone.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter className="mt-4">
                                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                      Cancel
                                    </Button>
                                    <Button variant="destructive" onClick={handleDeleteMedicine}>
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
        </Card>
      )}

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">1</span> to{" "}
          <span className="font-medium">{filteredMedicines.length}</span> of{" "}
          <span className="font-medium">{filteredMedicines.length}</span> results
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