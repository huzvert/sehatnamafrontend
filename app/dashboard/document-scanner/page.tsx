"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Badge } from "@/components/ui/badge"
import { Camera, FileText, Check, X, Loader2, PlusCircle, RefreshCw, Upload, FileImage, PillIcon } from "lucide-react"

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Medicine data interface
interface Medicine {
  _id?: string;
  name: string;
  dosage: string;
  frequency?: string;
  duration?: string;
  isConfirmed?: boolean;
}

// Patient interface
interface Patient {
  patientId: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

export default function DocumentScannerPage() {
  const [activeTab, setActiveTab] = useState("camera")
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [extractedData, setExtractedData] = useState<any>(null)
  const [selectedPatient, setSelectedPatient] = useState("")
  const [documentType, setDocumentType] = useState("prescription")
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split("T")[0])
  const [detectedMedicines, setDetectedMedicines] = useState<Medicine[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [availableMedicines, setAvailableMedicines] = useState<Medicine[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [doctorNote, setDoctorNote] = useState("")
  const [appointmentDetails, setAppointmentDetails] = useState({
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    duration: "30",
    reason: ""
  })

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Fetch patients and medicines when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true)
        
        // Get the auth token
        const token = localStorage.getItem('token')
        console.log('Token available:', !!token)
        
        // Fetch patients
        const patientsResponse = await fetch(`${API_BASE_URL}/patients`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        console.log('Patients response status:', patientsResponse.status)
        
        if (patientsResponse.ok) {
          const patientsData = await patientsResponse.json()
          console.log('Patients fetched:', patientsData)
          setPatients(patientsData)
        } else {
          const error = await patientsResponse.json()
          console.error('Patients error:', error)
          toast({
            title: "Error loading patients",
            description: error.message || "Failed to load patients",
            variant: "destructive"
          })
        }

        // Fetch medicines (without auth for now since your endpoint doesn't require it)
        try {
          const medicinesResponse = await fetch(`${API_BASE_URL}/medicines`)
          console.log('Medicines response status:', medicinesResponse.status)
          
          if (medicinesResponse.ok) {
            const medicinesData = await medicinesResponse.json()
            setAvailableMedicines(medicinesData)
          }
        } catch (medError) {
          console.error('Error fetching medicines:', medError)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: "Error",
          description: "Failed to load initial data",
          variant: "destructive"
        })
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [])

  // Start camera when component mounts and tab is "camera"
  useEffect(() => {
    if (activeTab === "camera") {
      startCamera()
    } else {
      stopCamera()
    }

    // Cleanup function to stop camera when component unmounts
    return () => {
      stopCamera()
    }
  }, [activeTab])

  // Start the camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraStream(stream)
    } catch (error) {
      console.error("Error accessing camera:", error)
      toast({
        title: "Camera Error",
        description: "Could not access the camera. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  // Stop the camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
    }
  }

  // Capture image from camera
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageDataUrl = canvas.toDataURL("image/png")
        setCapturedImage(imageDataUrl)
        setActiveTab("review")
      }
    }
  }

  // Discard captured image and return to camera
  const discardImage = () => {
    setCapturedImage(null)
    setActiveTab("camera")
  }

  // Process the captured image with OCR
  const processImage = async () => {
    if (!capturedImage) return

    setIsProcessing(true)
    setProcessingProgress(0)

    try {
      // Convert base64 to blob
      const base64Response = await fetch(capturedImage)
      const blob = await base64Response.blob()
      
      // Create FormData
      const formData = new FormData()
      formData.append('document', blob, 'document.png')
      formData.append('type', documentType)
      
      const token = localStorage.getItem('token')

      // Simulate progress for demonstration
      const interval = setInterval(() => {
        setProcessingProgress((prev) => {
          const newProgress = prev + 10
          if (newProgress >= 90) {
            clearInterval(interval)
            return 90
          }
          return newProgress
        })
      }, 300)

      // Call OCR processing endpoint
      const ocrResponse = await fetch(`${API_BASE_URL}/documents/process-ocr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      clearInterval(interval)
      setProcessingProgress(100)

      if (!ocrResponse.ok) {
        throw new Error('Failed to process document')
      }

      const ocrResult = await ocrResponse.json()
      
      // Process OCR results based on document type
      if (documentType === "prescription") {
        const extractedMeds = ocrResult.medications || []
        
        // Map extracted medicines to our interface
        const detectedMeds = extractedMeds.map((med: any) => ({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency || "Once daily",
          duration: med.duration || "7 days",
          isConfirmed: true
        }))
        
        setDetectedMedicines(detectedMeds)
      }

      setExtractedData({
        documentType: documentType,
        date: documentDate,
        notes: ocrResult.notes || "",
      })

      setIsProcessing(false)
      setActiveTab("results")
    } catch (error) {
      console.error('Error processing image:', error)
      toast({
        title: "Processing Error",
        description: "Failed to process the document. Please try again.",
        variant: "destructive"
      })
      setIsProcessing(false)
    }
  }

  // Toggle medicine confirmation
  const toggleMedicineConfirmation = (index: number) => {
    const updatedMedicines = [...detectedMedicines]
    updatedMedicines[index].isConfirmed = !updatedMedicines[index].isConfirmed
    setDetectedMedicines(updatedMedicines)
  }

  // Save the processed document and extracted data
  const saveDocument = async () => {
    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "Please select a patient",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const confirmedMedicines = detectedMedicines.filter((med) => med.isConfirmed)
      const token = localStorage.getItem('token')

      if (!token) {
        throw new Error('No authentication token found. Please log in.')
      }

      console.log('=== SAVE DEBUG ===')
      console.log('Document Type:', documentType)
      console.log('Patient ID:', selectedPatient)
      console.log('Has token:', !!token)

      if (documentType === "prescription") {
        const medicationsForPrescription = confirmedMedicines.map(med => ({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration
        }))

        const requestBody = {
          patientId: selectedPatient,
          medications: medicationsForPrescription,
          notes: doctorNote || extractedData?.notes || ""
        }

        console.log('Prescription Request Body:', JSON.stringify(requestBody, null, 2))

        const prescriptionResponse = await fetch(`${API_BASE_URL}/prescriptions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })

        console.log('Prescription Response Status:', prescriptionResponse.status)
        console.log('Prescription Response Headers:', Object.fromEntries(prescriptionResponse.headers.entries()))

        // Try to read the response text first
        const responseText = await prescriptionResponse.text()
        console.log('Prescription Raw Response:', responseText)

        let responseData
        try {
          responseData = JSON.parse(responseText)
        } catch (e) {
          throw new Error(`Invalid JSON response: ${responseText}`)
        }

        if (!prescriptionResponse.ok) {
          throw new Error(responseData.message || responseText || 'Failed to create prescription')
        }

        console.log('Prescription Success:', responseData)

      } else if (documentType === "lab-report") {
        // Lab report endpoint is protected, requires login
        const labReportRequest = {
          patientId: selectedPatient,
          type: extractedData?.notes || doctorNote || "General Lab Report",
          lab: "Scanned Document",
          results: confirmedMedicines.map(med => ({
            test: med.name,
            value: med.dosage,
            normalRange: med.frequency,
            status: "Normal"
          })),
          notes: doctorNote || extractedData?.notes || ""
        }

        console.log('Lab Report Request:', JSON.stringify(labReportRequest, null, 2))

        const labReportResponse = await fetch(`${API_BASE_URL}/lab-reports`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(labReportRequest)
        })

        const labResponseText = await labReportResponse.text()
        console.log('Lab Report Raw Response:', labResponseText)

        let labResponseData
        try {
          labResponseData = JSON.parse(labResponseText)
        } catch (e) {
          throw new Error(`Invalid JSON response: ${labResponseText}`)
        }

        if (!labReportResponse.ok) {
          throw new Error(labResponseData.message || 'Failed to create lab report')
        }

      } else if (documentType === "appointment") {
        // Appointment endpoint is protected, requires login and specific data
        const appointmentDateTime = new Date(`${appointmentDetails.date}T${appointmentDetails.time}`)
        const endDateTime = new Date(appointmentDateTime.getTime() + parseInt(appointmentDetails.duration) * 60000)
        
        const appointmentRequest = {
          patientId: selectedPatient,
          doctor: localStorage.getItem('userId'), // Assuming you store userId
          date: appointmentDateTime,
          startTime: appointmentDateTime.toTimeString().slice(0, 5),
          endTime: endDateTime.toTimeString().slice(0, 5),
          reason: appointmentDetails.reason || extractedData?.notes || "Follow-up consultation",
          status: "scheduled"
        }

        console.log('Appointment Request:', JSON.stringify(appointmentRequest, null, 2))

        const appointmentResponse = await fetch(`${API_BASE_URL}/appointments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(appointmentRequest)
        })

        const appointmentResponseText = await appointmentResponse.text()
        console.log('Appointment Raw Response:', appointmentResponseText)

        let appointmentResponseData
        try {
          appointmentResponseData = JSON.parse(appointmentResponseText)
        } catch (e) {
          throw new Error(`Invalid JSON response: ${appointmentResponseText}`)
        }

        if (!appointmentResponse.ok) {
          throw new Error(appointmentResponseData.message || 'Failed to create appointment')
        }
      }

      toast({
        title: "Success!",
        description: `${documentType.charAt(0).toUpperCase() + documentType.slice(1).replace("-", " ")} successfully saved.`,
      })

      // Reset the form
      setCapturedImage(null)
      setExtractedData(null)
      setDetectedMedicines([])
      setSelectedPatient("")
      setDocumentType("prescription")
      setDoctorNote("")
      setDocumentDate(new Date().toISOString().split("T")[0])
      setAppointmentDetails({
        date: new Date().toISOString().split("T")[0],
        time: "09:00",
        duration: "30",
        reason: ""
      })
      setActiveTab("camera")
    } catch (error) {
      console.error('Error saving document:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to save document. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Toaster />
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Document Scanner</h1>
        <p className="text-gray-500">Scan medical documents and extract information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scan Document</CardTitle>
          <CardDescription>
            Use your camera to scan prescriptions, lab reports, or other medical documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingData ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading patients and medicines...</span>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="camera" disabled={isProcessing}>
                  <Camera className="mr-2 h-4 w-4" />
                  Camera
                </TabsTrigger>
                <TabsTrigger value="review" disabled={!capturedImage || isProcessing}>
                  <FileImage className="mr-2 h-4 w-4" />
                  Review
                </TabsTrigger>
                <TabsTrigger value="results" disabled={!extractedData || isProcessing}>
                  <FileText className="mr-2 h-4 w-4" />
                  Results
                </TabsTrigger>
              </TabsList>

              <TabsContent value="camera" className="mt-4">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="patient">Patient</Label>
                      <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((patient) => (
                            <SelectItem key={patient.patientId} value={patient.patientId}>
                              {patient.user?.firstName} {patient.user?.lastName} ({patient.patientId})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="document-type">Document Type</Label>
                      <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="prescription">Prescription</SelectItem>
                          <SelectItem value="lab-report">Lab Report</SelectItem>
                          <SelectItem value="appointment">Appointment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document-date">Document Date</Label>
                    <Input
                      id="document-date"
                      type="date"
                      value={documentDate}
                      onChange={(e) => setDocumentDate(e.target.value)}
                    />
                  </div>

                  <div className="relative aspect-video overflow-hidden rounded-lg border bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover"></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                  </div>

                  <div className="flex justify-center">
                    <Button onClick={captureImage} className="bg-teal-600 hover:bg-teal-700">
                      <Camera className="mr-2 h-4 w-4" />
                      Capture Document
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="review" className="mt-4">
                <div className="space-y-4">
                  <div className="relative aspect-video overflow-hidden rounded-lg border">
                    {capturedImage && (
                      <img
                        src={capturedImage}
                        alt="Captured document"
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>

                  <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={discardImage}>
                      <X className="mr-2 h-4 w-4" />
                      Discard
                    </Button>
                    <Button onClick={processImage} className="bg-teal-600 hover:bg-teal-700">
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing... {processingProgress}%
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Process Document
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="results" className="mt-4">
                {extractedData && (
                  <div className="space-y-6">
                    <div className="rounded-lg border p-4">
                      <h3 className="text-lg font-medium mb-2">Document Information</h3>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Type:</span>
                          <span className="capitalize">{extractedData.documentType.replace("-", " ")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Date:</span>
                          <span>{new Date(extractedData.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Patient:</span>
                          <span>
                            {selectedPatient
                              ? patients.find((p) => p.patientId === selectedPatient)?.user?.firstName + ' ' + 
                                patients.find((p) => p.patientId === selectedPatient)?.user?.lastName
                              : "Not selected"}
                          </span>
                        </div>
                      </div>
                      {extractedData.notes && (
                        <div className="mt-2 pt-2 border-t">
                          <span className="text-sm font-medium text-gray-500">Notes:</span>
                          <p className="text-sm mt-1">{extractedData.notes}</p>
                        </div>
                      )}
                    </div>

                    {documentType === "appointment" && (
                      <div className="rounded-lg border p-4">
                        <h3 className="text-lg font-medium mb-4">Appointment Details</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="appointment-date">Date</Label>
                            <Input
                              id="appointment-date"
                              type="date"
                              value={appointmentDetails.date}
                              onChange={(e) => setAppointmentDetails({...appointmentDetails, date: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="appointment-time">Time</Label>
                            <Input
                              id="appointment-time"
                              type="time"
                              value={appointmentDetails.time}
                              onChange={(e) => setAppointmentDetails({...appointmentDetails, time: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="appointment-duration">Duration (minutes)</Label>
                            <Select 
                              value={appointmentDetails.duration} 
                              onValueChange={(value) => setAppointmentDetails({...appointmentDetails, duration: value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select duration" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="15">15 minutes</SelectItem>
                                <SelectItem value="30">30 minutes</SelectItem>
                                <SelectItem value="45">45 minutes</SelectItem>
                                <SelectItem value="60">1 hour</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="appointment-reason">Reason for Visit</Label>
                            <Input
                              id="appointment-reason"
                              value={appointmentDetails.reason}
                              onChange={(e) => setAppointmentDetails({...appointmentDetails, reason: e.target.value})}
                              placeholder="Enter reason for appointment"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {documentType !== "appointment" && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-medium">Detected Medications</h3>
                          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                            {detectedMedicines.filter((med) => med.isConfirmed).length} of {detectedMedicines.length}{" "}
                            selected
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {detectedMedicines.map((medicine, index) => (
                            <div
                              key={index}
                              className={`flex items-center justify-between p-3 rounded-md border ${
                                medicine.isConfirmed ? "bg-teal-50 border-teal-200" : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <PillIcon
                                  className={`h-5 w-5 ${medicine.isConfirmed ? "text-teal-600" : "text-gray-400"}`}
                                />
                                <div>
                                  <div className="font-medium">
                                    {medicine.name} ({medicine.dosage})
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {medicine.frequency} for {medicine.duration}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant={medicine.isConfirmed ? "default" : "outline"}
                                size="sm"
                                className={medicine.isConfirmed ? "bg-teal-600 hover:bg-teal-700" : ""}
                                onClick={() => toggleMedicineConfirmation(index)}
                              >
                                {medicine.isConfirmed ? (
                                  <>
                                    <Check className="mr-1 h-4 w-4" /> Confirmed
                                  </>
                                ) : (
                                  <>
                                    <PlusCircle className="mr-1 h-4 w-4" /> Confirm
                                  </>
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="rounded-lg border p-4">
                      <Label htmlFor="doctor-note" className="text-sm font-medium mb-2 block">
                        Additional Notes
                      </Label>
                      <textarea
                        id="doctor-note"
                        className="w-full p-2 text-sm border rounded-md h-24 resize-none"
                        value={doctorNote}
                        onChange={(e) => setDoctorNote(e.target.value)}
                        placeholder="Add additional notes here..."
                      />
                    </div>

                    <div className="flex justify-end gap-4">
                      <Button variant="outline" onClick={() => setActiveTab("camera")}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Scan Another
                      </Button>
                      <Button onClick={saveDocument} className="bg-teal-600 hover:bg-teal-700" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Save to {documentType.charAt(0).toUpperCase() + documentType.slice(1)}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}