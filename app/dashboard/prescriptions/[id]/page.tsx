"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Download } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
}

interface Prescription {
  id: string
  patientId: string
  patientName: string
  doctor: string
  date: string
  medications: Medication[]
  notes: string
  status: 'Active' | 'Expired' | 'Cancelled'
}

export default function ViewPrescriptionPage() {
  const params = useParams()
  const router = useRouter()
  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [loading, setLoading] = useState(true)

  const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '')

  useEffect(() => {
    if (params.id) {
      fetchPrescription()
    }
  }, [params.id])

  const fetchPrescription = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/api/prescriptions/${params.id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch prescription')
      }

      const data = await response.json()
      setPrescription(data)
    } catch (error) {
      console.error('Error fetching prescription:', error)
      toast({
        title: "Error",
        description: "Failed to fetch prescription details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadPrescription = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/prescriptions/${params.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) {
        throw new Error('Failed to download prescription')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prescription-${params.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading prescription:', error)
      toast({
        title: "Error",
        description: "Failed to download prescription PDF",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center py-12">Loading...</div>
  }

  if (!prescription) {
    return <div className="flex justify-center items-center py-12">Prescription not found</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <Toaster />
      
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={downloadPrescription}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/prescriptions/${prescription.id}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{prescription.patientName}</h2>
              <p className="text-gray-500">Patient ID: {prescription.patientId}</p>
            </div>
            <Badge
              variant={prescription.status === "Active" ? "default" : "secondary"}
              className={prescription.status === "Active" ? "bg-green-500" : ""}
            >
              {prescription.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700">Date</h3>
              <p>{new Date(prescription.date).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Doctor</h3>
              <p>{prescription.doctor}</p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">Medications</h3>
            <div className="space-y-4">
              {prescription.medications.map((medication, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700">Medicine</h4>
                      <p>{medication.name}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Dosage</h4>
                      <p>{medication.dosage}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Frequency</h4>
                      <p>{medication.frequency}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Duration</h4>
                      <p>{medication.duration}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {prescription.notes && (
            <div>
              <h3 className="font-bold text-lg mb-2">Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{prescription.notes}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}