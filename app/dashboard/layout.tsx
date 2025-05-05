import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Shield,
  Home,
  Users,
  Calendar,
  FileText,
  FlaskRoundIcon as Flask,
  Settings,
  LogOut,
  Menu,
  X,
  PillIcon,
  Building2,
  Camera,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-4 md:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 sm:max-w-none">
            <div className="flex h-full flex-col">
              <div className="flex h-14 items-center border-b px-4">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                  <Shield className="h-6 w-6 text-teal-600" />
                  <span className="text-lg font-bold">SehatNama</span>
                </Link>
                <Button variant="ghost" size="icon" className="ml-auto">
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
              <nav className="grid gap-2 px-2 py-4">
                <Link href="/dashboard">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Home className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/dashboard/patients">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Users className="h-4 w-4" />
                    Patients
                  </Button>
                </Link>
                <Link href="/dashboard/appointments">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Calendar className="h-4 w-4" />
                    Appointments
                  </Button>
                </Link>
                <Link href="/dashboard/prescriptions">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <FileText className="h-4 w-4" />
                    Prescriptions
                  </Button>
                </Link>
                <Link href="/dashboard/lab-reports">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Flask className="h-4 w-4" />
                    Lab Reports
                  </Button>
                </Link>
                <Link href="/dashboard/medicines">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <PillIcon className="h-4 w-4" />
                    Medicines
                  </Button>
                </Link>
                <Link href="/dashboard/hospitals">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Building2 className="h-4 w-4" />
                    Hospitals & Labs
                  </Button>
                </Link>
                <Link href="/dashboard/document-scanner">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Camera className="h-4 w-4" />
                    Document Scanner
                  </Button>
                </Link>
                <Link href="/dashboard/settings">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                </Link>
              </nav>
              <div className="mt-auto border-t p-4">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-teal-600" />
          <span className="text-lg font-bold hidden md:inline-flex">SehatNama</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Avatar>
            <AvatarImage src="/placeholder-user.jpg" alt="User" />
            <AvatarFallback>DR</AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <div className="text-sm font-medium">Dr. Rashid</div>
            <div className="text-xs text-gray-500">Cardiologist</div>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-64 border-r bg-gray-50/40 md:block">
          <nav className="grid gap-2 p-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/patients">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Users className="h-4 w-4" />
                Patients
              </Button>
            </Link>
            <Link href="/dashboard/appointments">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Calendar className="h-4 w-4" />
                Appointments
              </Button>
            </Link>
            <Link href="/dashboard/prescriptions">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <FileText className="h-4 w-4" />
                Prescriptions
              </Button>
            </Link>
            <Link href="/dashboard/lab-reports">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Flask className="h-4 w-4" />
                Lab Reports
              </Button>
            </Link>
            <Link href="/dashboard/medicines">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <PillIcon className="h-4 w-4" />
                Medicines
              </Button>
            </Link>
            <Link href="/dashboard/hospitals">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Building2 className="h-4 w-4" />
                Hospitals & Labs
              </Button>
            </Link>
            <Link href="/dashboard/document-scanner">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Camera className="h-4 w-4" />
                Document Scanner
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
          </nav>
        </aside>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
