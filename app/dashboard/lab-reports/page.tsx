"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, MoreHorizontal } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/app/context/AuthContext"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
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

interface LabReport {
  id: string
  patientId: string
  patientName: string
  testType: string
  date: string
  lab: string
  requestedBy: string
  status: 'Completed' | 'Pending' | 'In Progress' | 'Cancelled'
  results?: Array<{
    test: string
    value: string
    unit: string
    normalRange: string
    status: 'Normal' | 'Abnormal' | 'Critical'
  }>
  notes?: string
}

interface Patient {
  id: string
  name: string
}

export default function LabReportsPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState<LabReport[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // Selected items
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null)
  const [reportToDelete, setReportToDelete] = useState<LabReport | null>(null)
  
  // Form states
  const [formData, setFormData] = useState({
    patientId: "",
    type: "",
    lab: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
    status: "Pending"
  })
  const [results, setResults] = useState([
    { test: "", value: "", unit: "", normalRange: "", status: "Normal" }
  ])
  
  // Loading states
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '')
  const reportsPerPage = 10

  useEffect(() => {
    fetchReports()
    fetchPatients()
  }, [currentPage])

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/patients`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setPatients(data)
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }

  const fetchReports = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please login to view lab reports",
          variant: "destructive"
        })
        window.location.href = '/login'
        return
      }

      const response = await fetch(`${API_URL}/api/lab-reports?page=${currentPage}&limit=${reportsPerPage}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setReports(data.reports || data)
      setTotalPages(data.totalPages || Math.ceil((data.total || data.length) / reportsPerPage))
    } catch (error) {
      console.error('Error fetching lab reports:', error)
      toast({
        title: "Error",
        description: "Failed to fetch lab reports. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredReports = reports.filter(report =>
    report.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.testType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const resetForm = () => {
    setFormData({
      patientId: "",
      type: "",
      lab: "",
      date: new Date().toISOString().slice(0, 10),
      notes: "",
      status: "Pending"
    })
    setResults([
      { test: "", value: "", unit: "", normalRange: "", status: "Normal" }
    ])
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleResultChange = (index, field, value) => {
    const updatedResults = [...results]
    updatedResults[index][field] = value
    setResults(updatedResults)
  }

  const addResult = () => {
    setResults([...results, { test: "", value: "", unit: "", normalRange: "", status: "Normal" }])
  }

  const removeResult = (index) => {
    const updatedResults = results.filter((_, i) => i !== index)
    setResults(updatedResults)
  }

  const handleCreate = async () => {
    try {
      setCreating(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/api/lab-reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          results
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create lab report')
      }

      toast({
        title: "Success",
        description: "Lab report created successfully",
      })

      setIsCreateModalOpen(false)
      resetForm()
      fetchReports()
    } catch (error) {
      console.error('Error creating lab report:', error)
      toast({
        title: "Error",
        description: "Failed to create lab report",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedReport) return

    try {
      setEditing(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/api/lab-reports/${selectedReport.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          results
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update lab report')
      }

      toast({
        title: "Success",
        description: "Lab report updated successfully",
      })

      setIsEditModalOpen(false)
      fetchReports()
    } catch (error) {
      console.error('Error updating lab report:', error)
      toast({
        title: "Error",
        description: "Failed to update lab report",
        variant: "destructive"
      })
    } finally {
      setEditing(false)
    }
  }

  const handleDelete = async () => {
    if (!reportToDelete) return

    try {
      setDeleting(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/api/lab-reports/${reportToDelete.id}`, {
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete report')
      }

      toast({
        title: "Success",
        description: "Lab report deleted successfully",
      })

      fetchReports()
      setIsDeleteDialogOpen(false)
      setReportToDelete(null)
    } catch (error) {
      console.error('Error deleting report:', error)
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
    }
  }

  const downloadReport = async (reportId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/lab-reports/${reportId}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) {
        throw new Error('Failed to download report')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lab-report-${reportId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading report:', error)
      toast({
        title: "Error",
        description: "Failed to download report",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (report: LabReport) => {
    setSelectedReport(report)
    setFormData({
      patientId: report.patientId,
      type: report.testType,
      lab: report.lab,
      date: report.date.slice(0, 10),
      notes: report.notes || "",
      status: report.status
    })
    setResults(report.results || [])
    setIsEditModalOpen(true)
  }

  const handleView = (report: LabReport) => {
    setSelectedReport(report)
    setIsViewModalOpen(true)
  }

  const handleDeleteClick = (report: LabReport) => {
    setReportToDelete(report)
    setIsDeleteDialogOpen(true)
  }

  const handleCreateClick = () => {
    resetForm()
    setIsCreateModalOpen(true)
  }

  const startIndex = (currentPage - 1) * reportsPerPage
  const endIndex = Math.min(startIndex + reportsPerPage, filteredReports.length)
  const currentReports = filteredReports.slice(startIndex, endIndex)

  return (
    <div className="flex flex-col gap-6">
      <Toaster />
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Lab Reports</h1>
        <p className="text-gray-500">View and manage patient lab reports</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input 
            type="search" 
            placeholder="Search lab reports..." 
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
          <Button className="bg-teal-600 hover:bg-teal-700" size="sm" onClick={handleCreateClick}>
            <Plus className="mr-2 h-4 w-4" />
            Create Report
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
                <TableHead>Test Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Lab</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">
                    Loading lab reports...
                  </TableCell>
                </TableRow>
              ) : currentReports.length > 0 ? (
                currentReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.id}</TableCell>
                    <TableCell>{report.patientName}</TableCell>
                    <TableCell>{report.testType}</TableCell>
                    <TableCell>{report.date ? new Date(report.date).toLocaleDateString() : ''}</TableCell>
                    <TableCell>{report.lab}</TableCell>
                    <TableCell>{report.requestedBy}</TableCell>
                    <TableCell>
                      <Badge
                        variant={report.status === "Completed" ? "default" : "secondary"}
                        className={
                          report.status === "Completed" ? "bg-green-500" : 
                          report.status === "Pending" ? "bg-yellow-500" :
                          report.status === "In Progress" ? "bg-blue-500" : ""
                        }
                      >
                        {report.status}
                      </Badge>
                    </TableCell>
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
                          <DropdownMenuItem onClick={() => handleView(report)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(report)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadReport(report.id)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteClick(report)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">
                    No lab reports found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">{filteredReports.length > 0 ? startIndex + 1 : 0}</span> to{" "}
          <span className="font-medium">{endIndex}</span> of{" "}
          <span className="font-medium">{filteredReports.length}</span> results
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Next
        </Button>
      </div>

      {/* Create Lab Report Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Lab Report</DialogTitle>
            <DialogDescription>
              Enter the details for the new lab report.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-patient">Patient</Label>
                <Select 
                  value={formData.patientId} 
                  onValueChange={(value) => handleInputChange({ target: { name: 'patientId', value } })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-type">Test Type</Label>
                <Input
                  id="create-type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  placeholder="e.g., Blood Work, X-Ray"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-lab">Laboratory</Label>
                <Input
                  id="create-lab"
                  name="lab"
                  value={formData.lab}
                  onChange={handleInputChange}
                  placeholder="e.g., City Lab"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-date">Date</Label>
                <Input
                  id="create-date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-notes">Notes</Label>
              <Textarea
                id="create-notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes"
              />
            </div>
            <div className="space-y-4">
              <Label>Test Results</Label>
              {results.map((result, index) => (
                <div key={index} className="grid grid-cols-6 gap-4">
                  <div className="space-y-2">
                    <Label>Test Name</Label>
                    <Input
                      value={result.test}
                      onChange={(e) => handleResultChange(index, 'test', e.target.value)}
                      placeholder="e.g., Hemoglobin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Input
                      value={result.value}
                      onChange={(e) => handleResultChange(index, 'value', e.target.value)}
                      placeholder="e.g., 13.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input
                      value={result.unit}
                      onChange={(e) => handleResultChange(index, 'unit', e.target.value)}
                      placeholder="e.g., g/dL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Normal Range</Label>
                    <Input
                      value={result.normalRange}
                      onChange={(e) => handleResultChange(index, 'normalRange', e.target.value)}
                      placeholder="e.g., 12-16"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={result.status} 
                      onValueChange={(value) => handleResultChange(index, 'status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="Abnormal">Abnormal</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>&nbsp;</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => removeResult(index)}
                      disabled={results.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" onClick={addResult} variant="outline">
                Add Test Result
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Lab Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Lab Report Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lab Report</DialogTitle>
            <DialogDescription>
              Update the lab report details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Test Type</Label>
                <Input
                  id="edit-type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lab">Laboratory</Label>
                <Input
                  id="edit-lab"
                  name="lab"
                  value={formData.lab}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange({ target: { name: 'status', value } })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-4">
              <Label>Test Results</Label>
              {results.map((result, index) => (
                <div key={index} className="grid grid-cols-6 gap-4">
                  <div className="space-y-2">
                    <Label>Test Name</Label>
                    <Input
                      value={result.test}
                      onChange={(e) => handleResultChange(index, 'test', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Input
                      value={result.value}
                      onChange={(e) => handleResultChange(index, 'value', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input
                      value={result.unit}
                      onChange={(e) => handleResultChange(index, 'unit', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Normal Range</Label>
                    <Input
                      value={result.normalRange}
                      onChange={(e) => handleResultChange(index, 'normalRange', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={result.status} 
                      onValueChange={(value) => handleResultChange(index, 'status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="Abnormal">Abnormal</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>&nbsp;</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => removeResult(index)}
                      disabled={results.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" onClick={addResult} variant="outline">
                Add Test Result
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={editing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={editing}
            >
              {editing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Lab Report Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lab Report Details</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="grid gap-6 py-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Patient</p>
                    <p className="font-medium">{selectedReport.patientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Patient ID</p>
                    <p className="font-medium">{selectedReport.patientId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Test Type</p>
                    <p className="font-medium">{selectedReport.testType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Laboratory</p>
                    <p className="font-medium">{selectedReport.lab}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{new Date(selectedReport.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge
                      variant={selectedReport.status === "Completed" ? "default" : "secondary"}
                      className={
                        selectedReport.status === "Completed" ? "bg-green-500" : 
                        selectedReport.status === "Pending" ? "bg-yellow-500" :
                        selectedReport.status === "In Progress" ? "bg-blue-500" : ""
                      }
                    >
                      {selectedReport.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {selectedReport.results && selectedReport.results.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Test Results</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Test</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Normal Range</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedReport.results.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell>{result.test}</TableCell>
                          <TableCell>{result.value} {result.unit}</TableCell>
                          <TableCell>{result.normalRange} {result.unit}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={result.status === "Normal" ? "default" : "destructive"}
                              className={
                                result.status === "Normal" ? "bg-green-500" : 
                                result.status === "Abnormal" ? "bg-orange-500" :
                                result.status === "Critical" ? "bg-red-500" : ""
                              }
                            >
                              {result.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {selectedReport.notes && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Notes</h3>
                  <p className="whitespace-pre-wrap">{selectedReport.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewModalOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsViewModalOpen(false)
                if (selectedReport) {
                  handleEdit(selectedReport)
                }
              }}
            >
              Edit
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
              Are you sure you want to delete this lab report? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {reportToDelete && (
              <p className="text-sm font-medium">
                {reportToDelete.testType} for {reportToDelete.patientName}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <div className="mr-2 h-4 w-4 rounded-full border-2 border-t-red-100 border-red-200 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Report'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}