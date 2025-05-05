
"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
}

interface Prescription {
  patientId: string
  patientName: string
  date: string
  notes: string
  medications: Medication[]
}

export default function NewPrescriptionPage() {
  const [prescription, setPrescription] = useState<Prescription>({
    patientId: "",
    patientName: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    medications: [{ name: "", dosage: "", frequency: "", duration: "" }],
  })

  const [loading, setLoading] = useState(false)

  const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '')

  const addMedication = () => {
    setPrescription({
      ...prescription,
      medications: [...prescription.medications, { name: "", dosage: "", frequency: "", duration: "" }],
    })
  }

  const removeMedication = (index: number) => {
    const updatedMedications = [...prescription.medications]
    updatedMedications.splice(index, 1)
    setPrescription({
      ...prescription,
      medications: updatedMedications,
    })
  }

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updatedMedications = [...prescription.medications]
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value,
    }

    setPrescription({
      ...prescription,
      medications: updatedMedications,
    })
  }

  const savePrescription = async () => {
    if (!prescription.patientId) {
      toast({
        title: "Error",
        description: "Please enter patient ID",
        variant: "destructive",
      })
      return
    }

    if (prescription.medications.some((med) => !med.name || !med.dosage || !med.frequency || !med.duration)) {
      toast({
        title: "Error",
        description: "Please fill all medication details",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: prescription.patientId,
          medications: prescription.medications,
          notes: prescription.notes,
          date: prescription.date
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: `Prescription created successfully.`,
        })
        // Navigate to prescriptions list after delay
        setTimeout(() => {
          window.location.href = '/dashboard/prescriptions'
        }, 1500)
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.error('Error saving prescription:', error)
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to save prescription",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Toaster />
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/prescriptions">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">New Prescription</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prescription Details</CardTitle>
          <CardDescription>Create a new prescription for a patient</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="patientId">Patient ID</Label>
              <Input
                id="patientId"
                placeholder="Enter patient ID (e.g., P-1234)"
                value={prescription.patientId}
                onChange={(e) => setPrescription({ ...prescription, patientId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={prescription.date}
                onChange={(e) => setPrescription({ ...prescription, date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Medications</Label>
              <Button type="button" variant="outline" size="sm" onClick={addMedication}>
                <Plus className="mr-2 h-4 w-4" />
                Add Medication
              </Button>
            </div>

            {prescription.medications.map((medication, index) => (
              <Card key={index} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Medication {index + 1}</h3>
                    {index > 0 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeMedication(index)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`medicine-${index}`}>Medicine Name</Label>
                      <Input
                        id={`medicine-${index}`}
                        placeholder="Enter medicine name"
                        value={medication.name}
                        onChange={(e) => updateMedication(index, "name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`dosage-${index}`}>Dosage</Label>
                      <Input
                        id={`dosage-${index}`}
                        placeholder="e.g., 10mg"
                        value={medication.dosage}
                        onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor={`frequency-${index}`}>Frequency</Label>
                      <Input
                        id={`frequency-${index}`}
                        placeholder="e.g., Once daily"
                        value={medication.frequency}
                        onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`duration-${index}`}>Duration</Label>
                      <Input
                        id={`duration-${index}`}
                        placeholder="e.g., 30 days"
                        value={medication.duration}
                        onChange={(e) => updateMedication(index, "duration", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional instructions or notes"
              value={prescription.notes}
              onChange={(e) => setPrescription({ ...prescription, notes: e.target.value })}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard/prescriptions">Cancel</Link>
            </Button>
            <Button 
              className="bg-teal-600 hover:bg-teal-700" 
              onClick={savePrescription}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Prescription"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}