// context/AuthContext.js
"use client"

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// API base URL - make it configurable
const API_URL = 'http://localhost:5000/api/users';

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // Start with loading true
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
    }
    
    setInitialized(true)
    setLoading(false) // Set loading to false after initialization
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        const userData = {
          id: data._id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: data.role,
          patientId: data.patientId,
          specialty: data.specialty, // Include specialty if available
        };
        
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)

        setLoading(false)
        return {
          success: true,
          user: userData
        }
      } else {
        setLoading(false)
        return {
          success: false,
          error: data.message || "Invalid credentials"
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setLoading(false)
      return {
        success: false,
        error: "An error occurred during login. Please try again later."
      }
    }
  }

  const register = async (userData) => {
    setLoading(true)
    
    try {
      console.log("Sending registration data:", userData);
      console.log("To URL:", `${API_URL}/register`);
      
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()
      console.log("Registration response:", data);

      if (response.ok) {
        const newUser = {
          id: data._id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: data.role,
          patientId: data.patientId,
          specialty: data.specialty, // Include specialty if available
        };
        
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(newUser))
        setUser(newUser)

        setLoading(false)
        return {
          success: true,
          user: newUser
        }
      } else {
        setLoading(false)
        return {
          success: false,
          error: data.message || "Registration failed"
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      setLoading(false)
      return {
        success: false,
        error: "An error occurred during registration. Please try again later."
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    router.push('/login')
  }
  
  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  }
  
  // Check if user is a doctor
  const isDoctor = () => {
    return user?.role === 'doctor';
  }
  
  // Check if user is an admin
  const isAdmin = () => {
    return user?.role === 'admin';
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        register, 
        logout, 
        loading, 
        initialized,
        isAuthenticated,
        isDoctor,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)