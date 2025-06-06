"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/app/context/AuthContext"

export default function CreateLabReportPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState([])
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

  const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '')

  useEffect(() => {
    fetchPatients()
  }, [])

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
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

      router.push('/dashboard/lab-reports')
    } catch (error) {
      console.error('Error creating lab report:', error)
      toast({
        title: "Error",
        description: "Failed to create lab report",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Toaster />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Create Lab Report</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Lab Report Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Patient</Label>
                <Select name="patientId" value={formData.patientId} onValueChange={(value) => handleInputChange({ target: { name: 'patientId', value } })}>
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
                <Label htmlFor="type">Test Type</Label>
                <Input
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  placeholder="e.g., Blood Work, X-Ray"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lab">Laboratory</Label>
                <Input
                  id="lab"
                  name="lab"
                  value={formData.lab}
                  onChange={handleInputChange}
                  placeholder="e.g., City Lab"
                  required
                />
              </div>

              <div className="space-y-2">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            {results.map((result, index) => (
              <div key={index} className="grid grid-cols-6 gap-4 mb-4">
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
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Lab Report'}
          </Button>
        </div>
      </form>
    </div>
  )
}