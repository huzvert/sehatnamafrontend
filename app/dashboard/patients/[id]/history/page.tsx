"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, FileText, FlaskRoundIcon as Flask, AlertCircle } from "lucide-react"
import { useAuth } from "@/app/context/AuthContext"
import { toast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"

export default function PatientHistoryPage() {
  const { user } = useAuth()
  const params = useParams()
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [patientData, setPatientData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Use consistent API URL
  const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '')

  // Fetch patient history from API
  useEffect(() => {
    const fetchPatientHistory = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/api/patients/${params.patientId}/history`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const data = await response.json()
        setPatientData(data)
        setError(null)
      } catch (error) {
        console.error('Error fetching patient history:', error)
        setError('Failed to load patient history. Please try again later.')
        toast({
          title: "Error",
          description: "Could not load patient history. Please try again.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.patientId) {
      fetchPatientHistory()
    } else {
      setLoading(false)
      setError('No patient ID provided')
    }
  }, [params.patientId, API_URL])

  // Handle if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <AlertCircle className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-bold mb-2">Error Loading History</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Handle loading state
  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/patients/${params.patientId}`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Patient History</h1>
        </div>
        <Card>
          <CardContent className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading patient history...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If no patient data is available
  if (!patientData || !patientData.history) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/patients/${params.patientId}`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Patient History</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto" />
            <h2 className="text-xl font-bold mt-2 mb-1">No History Available</h2>
            <p className="text-gray-600">This patient has no recorded medical history.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Filter history items based on type and search term
  const filteredHistory = patientData.history.filter((item) => {
    const matchesFilter = filter === "all" || item.type === filter
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.doctor.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Group history items by date
  const groupedHistory = filteredHistory.reduce((groups, item) => {
    const date = item.date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(item)
    return groups
  }, {})

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedHistory).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  // Get icon for history item type
  const getItemIcon = (type) => {
    switch (type) {
      case "appointment":
        return <Calendar className="h-5 w-5" />
      case "prescription":
        return <FileText className="h-5 w-5" />
      case "lab":
        return <Flask className="h-5 w-5" />
      case "note":
        return <FileText className="h-5 w-5" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

  // Get color for history item type
  const getItemColor = (type) => {
    switch (type) {
      case "appointment":
        return "bg-blue-100 text-blue-600"
      case "prescription":
        return "bg-green-100 text-green-600"
      case "lab":
        return "bg-purple-100 text-purple-600"
      case "note":
        return "bg-yellow-100 text-yellow-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
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
        <h1 className="text-3xl font-bold tracking-tight">Patient History</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{patientData.name}'s Medical Timeline</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              className={filter === "all" ? "bg-teal-600 hover:bg-teal-700" : ""}
            >
              All
            </Button>
            <Button
              variant={filter === "appointment" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("appointment")}
              className={filter === "appointment" ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              Appointments
            </Button>
            <Button
              variant={filter === "prescription" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("prescription")}
              className={filter === "prescription" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              Prescriptions
            </Button>
            <Button
              variant={filter === "lab" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("lab")}
              className={filter === "lab" ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              Lab Reports
            </Button>
            <Button
              variant={filter === "note" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("note")}
              className={filter === "note" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
            >
              Notes
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Input
              type="text"
              placeholder="Search in patient history..."
              className="w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredHistory.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">No matching records found</h3>
              <p className="text-sm text-gray-500">
                {searchTerm || filter !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "No medical history records available"}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {sortedDates.map((date) => (
                <div key={date} className="relative">
                  <div className="sticky top-0 bg-white z-10 py-2">
                    <h3 className="text-lg font-semibold">
                      {new Date(date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </h3>
                  </div>
                  <div className="ml-4 mt-2 border-l-2 border-gray-200 pl-6 space-y-6">
                    {groupedHistory[date]
                      .sort(
                        (a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime(),
                      )
                      .map((item) => (
                        <div key={item.id} className="relative">
                          <div className="absolute -left-[34px] mt-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-white">
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full ${getItemColor(item.type)}`}
                            >
                              {getItemIcon(item.type)}
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-gray-500">{item.time}</span>
                              <Badge
                                variant="outline"
                                className={
                                  item.type === "appointment"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : item.type === "prescription"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : item.type === "lab"
                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                        : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                }
                              >
                                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                              </Badge>
                              {item.status !== "N/A" && (
                                <Badge
                                  variant={
                                    item.status === "Completed" || item.status === "Active" ? "default" : "secondary"
                                  }
                                  className={
                                    item.status === "Completed"
                                      ? "bg-green-500"
                                      : item.status === "Active"
                                        ? "bg-blue-500"
                                        : ""
                                  }
                                >
                                  {item.status}
                                </Badge>
                              )}
                            </div>
                            <h4 className="text-base font-medium">{item.title}</h4>
                            <p className="text-sm text-gray-600">{item.details}</p>
                            <p className="text-sm text-gray-500">By {item.doctor}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}