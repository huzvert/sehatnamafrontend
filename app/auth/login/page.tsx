"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Connect to the backend API
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store user data and token in localStorage
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify({
          id: data._id,
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          role: data.role,
          patientId: data.patientId
        }))

        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.firstName} ${data.lastName}!`,
        })

        // Redirect based on user role
        if (data.role === "doctor" || data.role === "admin") {
          router.push("/dashboard")
        } else if (data.role === "patient") {
          router.push(`/patient-portal/${data.patientId}`)
        }
      } else {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid email or password. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: "Error",
        description: "An error occurred during login. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <Toaster />
      <Link href="/" className="absolute left-8 top-8 flex items-center gap-2">
        <Shield className="h-6 w-6 text-teal-600" />
        <span className="text-xl font-bold">SehatNama</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/forgot-password" className="text-sm text-teal-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 rounded border-gray-300"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember" className="text-sm text-gray-500">
                Remember me
              </label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full bg-teal-600 hover:bg-teal-700" type="submit" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-teal-600 hover:underline">
                Register
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* Demo accounts section - you may want to remove this in production */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Demo Accounts:</p>
        <p>Doctor: doctor@example.com / password123</p>
        <p>Admin: admin@example.com / password123</p>
        <p>Patient: patient@example.com / password123</p>
      </div>
    </div>
  )
}