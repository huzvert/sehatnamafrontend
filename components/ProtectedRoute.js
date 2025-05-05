// components/ProtectedRoute.js
"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../app/context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Check if the user is not authenticated and the loading has finished
    if (!loading && !isAuthenticated()) {
      router.push('/login')
      return
    }

    // Check for role-based access if roles are specified
    if (!loading && isAuthenticated() && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role)) {
        // Redirect based on role if unauthorized
        if (user.role === 'patient') {
          router.push(`/patient-portal/${user.patientId}`)
        } else if (user.role === 'doctor' || user.role === 'admin') {
          router.push('/dashboard')
        } else {
          router.push('/')
        }
      }
    }
  }, [loading, isAuthenticated, user, router, allowedRoles])

  // Show loading state or render children when ready
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authorized, return null (the redirect will happen in the useEffect)
  if (!isAuthenticated() || (allowedRoles.length > 0 && !allowedRoles.includes(user?.role))) {
    return null
  }

  // If authorized, render the children
  return children
}