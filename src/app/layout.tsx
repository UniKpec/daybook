import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const sans = Geist({ variable: "--font-sans", subsets: ["latin", "latin-ext"] })
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "latin-ext"] })

export const metadata: Metadata = {
  title: "Günlük",
  description: "Günlük çalışma raporları, yapılacaklar ve notlar için sade bir defter",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          {children}
          <Toaster position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
