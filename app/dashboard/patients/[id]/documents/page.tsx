"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, Search, Download, Eye, Calendar, Upload, Trash2, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/app/context/AuthContext"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function PatientDocumentsPage() {
  const { user } = useAuth()
  const params = useParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [documentType, setDocumentType] = useState("all")
  const [sortOrder, setSortOrder] = useState("newest")
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadFormData, setUploadFormData] = useState({
    title: "",
    type: "other",
    tags: "",
    file: null
  })
  const [uploading, setUploading] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Use consistent API URL
  const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '')

  // Fetch documents from API
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/api/patients/${params.patientId}/documents`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const data = await response.json()
        setDocuments(data)
        setError(null)
      } catch (error) {
        console.error('Error fetching documents:', error)
        setError('Failed to load documents. Please try again later.')
        toast({
          title: "Error",
          description: "Could not load patient documents. Please try again.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.patientId) {
      fetchDocuments()
    } else {
      setLoading(false)
      setError('No patient ID provided')
    }
  }, [params.patientId, API_URL])

  // Filter documents based on search term and document type
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.tags && doc.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    const matchesType = documentType === "all" || doc.type === documentType
    return matchesSearch && matchesType
  })

  // Sort documents based on sort order
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB
  })

  // Handle file input change
  const handleFileChange = (e) => {
    setUploadFormData({
      ...uploadFormData,
      file: e.target.files[0]
    })
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setUploadFormData({
      ...uploadFormData,
      [name]: value
    })
  }

  // Handle document upload
  const handleUploadDocument = async (e) => {
    e.preventDefault()
    
    if (!uploadFormData.file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive"
      })
      return
    }

    try {
      setUploading(true)
      const token = localStorage.getItem('token')
      
      const formData = new FormData()
      formData.append('document', uploadFormData.file)
      formData.append('title', uploadFormData.title || uploadFormData.file.name)
      formData.append('type', uploadFormData.type)
      formData.append('tags', uploadFormData.tags)
      formData.append('processed', false)

      const response = await fetch(`${API_URL}/api/patients/${params.patientId}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      
      // Add the new document to the list
      setDocuments([data.document, ...documents])
      
      // Reset form and close dialog
      setUploadFormData({
        title: "",
        type: "other",
        tags: "",
        file: null
      })
      setIsUploadDialogOpen(false)
      
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      })
    } catch (error) {
      console.error('Error uploading document:', error)
      toast({
        title: "Error",
        description: "Failed to upload document. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  // Handle document deletion confirmation
  const handleConfirmDelete = (document) => {
    setDocumentToDelete(document)
    setIsDeleteDialogOpen(true)
  }

  // Handle document deletion
  const handleDeleteDocument = async () => {
    if (!documentToDelete) return
    
    try {
      setDeleting(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(
        `${API_URL}/api/patients/${params.patientId}/documents/${documentToDelete.id}`, 
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      // Remove the deleted document from the list
      setDocuments(documents.filter(doc => doc.id !== documentToDelete.id))
      
      setIsDeleteDialogOpen(false)
      setDocumentToDelete(null)
      
      toast({
        title: "Success",
        description: "Document deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting document:', error)
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
    }
  }

  // Get icon for document type
  const getDocumentIcon = (type) => {
    switch (type) {
      case "prescription":
        return <FileText className="h-5 w-5" />
      case "lab-report":
        return <FileText className="h-5 w-5" />
      case "doctor-note":
        return <FileText className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  // Get color for document type
  const getDocumentColor = (type) => {
    switch (type) {
      case "prescription":
        return "bg-green-100 text-green-600"
      case "lab-report":
        return "bg-purple-100 text-purple-600"
      case "doctor-note":
        return "bg-yellow-100 text-yellow-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  // Format document type name
  const formatDocumentType = (type) => {
    return type.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())
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
            <h2 className="text-xl font-bold mb-2">Error Loading Documents</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/patients/${params.patientId}`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Patient Documents</h1>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            type="search"
            placeholder="Search documents..."
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
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Document Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Documents</SelectItem>
              <SelectItem value="prescription">Prescriptions</SelectItem>
              <SelectItem value="lab-report">Lab Reports</SelectItem>
              <SelectItem value="doctor-note">Doctor Notes</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-teal-600 hover:bg-teal-700" size="sm" onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documents & Scanned Reports</CardTitle>
          <CardDescription>View and manage patient documents</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading documents...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedDocuments.length > 0 ? (
                sortedDocuments.map((document) => (
                  <Card key={document.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div
                        className={`flex items-center justify-center p-4 md:p-6 ${
                          document.type === "prescription"
                            ? "bg-green-50"
                            : document.type === "lab-report"
                              ? "bg-purple-50"
                              : document.type === "doctor-note"
                                ? "bg-yellow-50"
                                : "bg-gray-50"
                        }`}
                      >
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full ${getDocumentColor(
                            document.type,
                          )}`}
                        >
                          {getDocumentIcon(document.type)}
                        </div>
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={
                                  document.type === "prescription"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : document.type === "lab-report"
                                      ? "bg-purple-50 text-purple-700 border-purple-200"
                                      : document.type === "doctor-note"
                                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                        : "bg-gray-50 text-gray-700 border-gray-200"
                                }
                              >
                                {formatDocumentType(document.type)}
                              </Badge>
                              <h3 className="font-medium">{document.title}</h3>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                {new Date(document.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {document.tags && document.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => window.open(document.url, '_blank')}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = document.url;
                                link.download = document.title;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleConfirmDelete(document)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>
                            {document.fileType.toUpperCase()} • {document.fileSize}
                          </span>
                          <span>Uploaded by: {document.uploadedBy}</span>
                          {document.processed && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              Processed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium">No documents found</h3>
                  <p className="text-sm text-gray-500">
                    {searchTerm || documentType !== "all"
                      ? "Try adjusting your search or filters"
                      : "Upload a document to get started"}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Document Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Upload a document for this patient's record</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadDocument}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter document title"
                  value={uploadFormData.title}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Document Type</Label>
                <Select name="type" value={uploadFormData.type} onValueChange={(value) => setUploadFormData({...uploadFormData, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prescription">Prescription</SelectItem>
                    <SelectItem value="lab-report">Lab Report</SelectItem>
                    <SelectItem value="doctor-note">Doctor Note</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  name="tags"
                  placeholder="e.g. hypertension, medication"
                  value={uploadFormData.tags}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">Document File</Label>
                <Input
                  id="file"
                  name="file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <p className="text-xs text-gray-500">
                  Supported formats: PDF, DOC, DOCX, JPG, PNG (max 10MB)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsUploadDialogOpen(false)
                  setUploadFormData({
                    title: "",
                    type: "other",
                    tags: "",
                    file: null
                  })
                }}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-teal-600 hover:bg-teal-700" 
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <div className="mr-2 h-4 w-4 rounded-full border-2 border-t-teal-100 border-teal-200 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Document'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {documentToDelete && (
              <p className="text-sm font-medium">
                "{documentToDelete.title}" ({formatDocumentType(documentToDelete.type)})
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setDocumentToDelete(null)
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteDocument}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <div className="mr-2 h-4 w-4 rounded-full border-2 border-t-red-100 border-red-200 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Document'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}