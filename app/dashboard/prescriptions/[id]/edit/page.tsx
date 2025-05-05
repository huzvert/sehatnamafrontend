"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  medications: Medication[]
  notes: string
  status: 'Active' | 'Expired' | 'Cancelled'
}

export default function EditPrescriptionPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [medications, setMedications] = useState<Medication[]>([])
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState<'Active' | 'Expired' | 'Cancelled'>('Active')
  const [patientName, setPatientName] = useState("")

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

      const data: Prescription = await response.json()
      setMedications(data.medications)
      setNotes(data.notes)
      setStatus(data.status)
      setPatientName(data.patientName)
    } catch (error) {
      console.error('Error fetching prescription:', error)
      toast({
        title: "Error",
        description: "Failed to fetch prescription details",
        variant: "destructive"
      })
      router.push('/dashboard/prescriptions')
    } finally {
      setLoading(false)
    }
  }

  const handleMedicationChange = (index: number, field: keyof Medication, value: string) => {
    const updatedMedications = [...medications]
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value
    }
    setMedications(updatedMedications)
  }

  const addMedication = () => {
    setMedications([
      ...medications,
      {
        name: "",
        dosage: "",
        frequency: "",
        duration: ""
      }
    ])
  }

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      const updatedMedications = medications.filter((_, i) => i !== index)
      setMedications(updatedMedications)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const validMedications = medications.filter(med => 
        med.name.trim() && med.dosage.trim() && med.frequency.trim() && med.duration.trim()
      )

      if (validMedications.length === 0) {
        throw new Error("At least one medication is required")
      }

      const token = localStorage.getItem('token')
      const prescriptionData = {
        medications: validMedications,
        notes: notes.trim(),
        status: status
      }

      const response = await fetch(`${API_URL}/api/prescriptions/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(prescriptionData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update prescription')
      }

      toast({
        title: "Success",
        description: "Prescription updated successfully",
      })

      router.push('/dashboard/prescriptions')
    } catch (error) {
      console.error('Error updating prescription:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update prescription",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center py-12">Loading...</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <Toaster />
      
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Prescription</h1>
      </div>

      <Card className="w-full max-w-2xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Name - Read Only */}
          <div className="space-y-2">
            <Label htmlFor="patientName">Patient Name</Label>
            <Input
              id="patientName"
              value={patientName}
              disabled
              className="bg-gray-100"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value: 'Active' | 'Expired' | 'Cancelled') => setStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Medications Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Medications</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMedication}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Medication
              </Button>
            </div>

            {medications.map((medication, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Medication {index + 1}</h3>
                  {medications.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMedication(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`medicine-${index}`}>Medicine Name</Label>
                    <Input
                      id={`medicine-${index}`}
                      value={medication.name}
                      onChange={(e) => handleMedicationChange(index, "name", e.target.value)}
                      placeholder="Enter medicine name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`dosage-${index}`}>Dosage</Label>
                    <Input
                      id={`dosage-${index}`}
                      value={medication.dosage}
                      onChange={(e) => handleMedicationChange(index, "dosage", e.target.value)}
                      placeholder="e.g., 500mg"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`frequency-${index}`}>Frequency</Label>
                    <Input
                      id={`frequency-${index}`}
                      value={medication.frequency}
                      onChange={(e) => handleMedicationChange(index, "frequency", e.target.value)}
                      placeholder="e.g., Twice daily"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`duration-${index}`}>Duration</Label>
                    <Input
                      id={`duration-${index}`}
                      value={medication.duration}
                      onChange={(e) => handleMedicationChange(index, "duration", e.target.value)}
                      placeholder="e.g., 7 days"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any additional instructions or notes"
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 rounded-full border-2 border-t-teal-100 border-teal-200 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Prescription'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}