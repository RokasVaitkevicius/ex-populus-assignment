import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ReactNode } from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Lawn Area Estimator",
  description: "Estimate lawn areas for landscaping quotes",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="container mx-auto py-6 min-h-screen">
          <header className="mb-10">
            <h1 className="text-3xl font-bold text-center text-green-600">
              Lawn Area Estimator
            </h1>
            <p className="text-center text-gray-600 mt-2">
              Get quick estimates for landscaping quotes
            </p>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
