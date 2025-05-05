import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle, Shield, Database, FileText } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-teal-600" />
            <span className="text-xl font-bold">SehatNama</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-medium hover:underline underline-offset-4">
              Home
            </Link>
            <Link href="#features" className="text-sm font-medium hover:underline underline-offset-4">
              Features
            </Link>
            <Link href="#about" className="text-sm font-medium hover:underline underline-offset-4">
              About
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-teal-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Your Complete Medical History in One Place
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    SehatNama stores and manages patient information, medical history, prescriptions, and lab reports in
                    a secure digital environment.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/register">
                    <Button size="lg" className="bg-teal-600 hover:bg-teal-700">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button size="lg" variant="outline">
                      View Demo
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[500px] aspect-video rounded-xl bg-teal-100 border border-teal-200 shadow-lg flex items-center justify-center">
                  <Database className="h-16 w-16 text-teal-600" />
                  <FileText className="h-12 w-12 text-teal-500 absolute top-1/4 right-1/4" />
                  <Shield className="h-12 w-12 text-teal-500 absolute bottom-1/4 left-1/4" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Key Features</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  SehatNama provides a comprehensive solution for healthcare data management
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
              {[
                {
                  title: "Patient Profiles",
                  description: "Maintain detailed patient profiles and treatment history in one secure location",
                  icon: <CheckCircle className="h-10 w-10 text-teal-600" />,
                },
                {
                  title: "Prescription Management",
                  description: "Store and track prescriptions with automatic warnings for risky medicine combinations",
                  icon: <FileText className="h-10 w-10 text-teal-600" />,
                },
                {
                  title: "Lab Reports",
                  description: "Store and access lab reports digitally, including scanned documents",
                  icon: <Database className="h-10 w-10 text-teal-600" />,
                },
                {
                  title: "Appointment Tracking",
                  description: "Schedule and manage doctor appointments with reminders",
                  icon: <CheckCircle className="h-10 w-10 text-teal-600" />,
                },
                {
                  title: "Role-Based Access",
                  description: "Different access levels for doctors, admins, and patients",
                  icon: <Shield className="h-10 w-10 text-teal-600" />,
                },
                {
                  title: "Fast Searches",
                  description: "Quick access to patient records using advanced indexing techniques",
                  icon: <Database className="h-10 w-10 text-teal-600" />,
                },
              ].map((feature, index) => (
                <div key={index} className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                  {feature.icon}
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t bg-gray-50">
        <div className="container flex flex-col gap-4 py-10 md:flex-row md:gap-8 md:py-12 px-4 md:px-6">
          <div className="flex flex-col gap-2 md:gap-4 md:flex-1">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-teal-600" />
              <span className="text-xl font-bold">SehatNama</span>
            </div>
            <p className="text-sm text-gray-500">A digital healthcare database system for Pakistan and beyond.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:flex-1">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Product</h3>
              <ul className="flex flex-col gap-2 text-sm text-gray-500">
                <li>
                  <Link href="#" className="hover:underline">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Security
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Company</h3>
              <ul className="flex flex-col gap-2 text-sm text-gray-500">
                <li>
                  <Link href="#" className="hover:underline">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Legal</h3>
              <ul className="flex flex-col gap-2 text-sm text-gray-500">
                <li>
                  <Link href="#" className="hover:underline">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t py-6 text-center text-sm text-gray-500">
          <p>© 2024 SehatNama. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
