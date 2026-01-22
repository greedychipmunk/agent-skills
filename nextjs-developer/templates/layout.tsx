/**
 * Layout Template
 *
 * This template demonstrates a complete layout with:
 * - Root layout structure
 * - Metadata configuration
 * - Font optimization
 * - Theme provider setup
 * - Navigation components
 * - Footer components
 * - Error boundary integration
 *
 * Usage:
 * 1. Copy to app/layout.tsx (root) or app/[route]/layout.tsx (nested)
 * 2. Customize the navigation and footer
 * 3. Add your providers
 *
 * Location: app/layout.tsx or app/[route]/layout.tsx
 */

import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import Link from "next/link"
import "./globals.css"

// ============================================================================
// FONTS
// ============================================================================

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
})

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: {
    default: "My Application",
    template: "%s | My Application",
  },
  description: "A modern web application built with Next.js",
  keywords: ["Next.js", "React", "TypeScript"],
  authors: [{ name: "Your Name" }],
  creator: "Your Name",
  publisher: "Your Company",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://example.com",
    siteName: "My Application",
    title: "My Application",
    description: "A modern web application built with Next.js",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "My Application",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "My Application",
    description: "A modern web application built with Next.js",
    images: ["/og-image.png"],
    creator: "@yourusername",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
}

// ============================================================================
// NAVIGATION COMPONENT
// ============================================================================

interface NavLink {
  href: string
  label: string
}

const navLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
]

function Navigation() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <nav className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Logo</span>
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Sign up
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}

// ============================================================================
// FOOTER COMPONENT
// ============================================================================

const footerLinks = {
  product: [
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/docs", label: "Documentation" },
  ],
  company: [
    { href: "/about", label: "About" },
    { href: "/blog", label: "Blog" },
    { href: "/careers", label: "Careers" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
}

function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-bold">
              Logo
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Building the future of web applications.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold">Product</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold">Company</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold">Legal</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t pt-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} My Application. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

// ============================================================================
// PROVIDERS (Client Component wrapper)
// ============================================================================

// Create a separate providers.tsx file with "use client"
// import { Providers } from "./providers"

// ============================================================================
// ROOT LAYOUT
// ============================================================================

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        {/* Wrap with providers if needed */}
        {/* <Providers> */}
        <div className="relative flex min-h-screen flex-col">
          <Navigation />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        {/* </Providers> */}
      </body>
    </html>
  )
}

// ============================================================================
// NESTED LAYOUT EXAMPLE
// ============================================================================

/**
 * Example nested layout for dashboard routes
 * Location: app/dashboard/layout.tsx
 */
export function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r bg-muted/50 md:block">
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link
                href="/dashboard"
                className="block rounded-lg px-4 py-2 hover:bg-muted"
              >
                Overview
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/analytics"
                className="block rounded-lg px-4 py-2 hover:bg-muted"
              >
                Analytics
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/settings"
                className="block rounded-lg px-4 py-2 hover:bg-muted"
              >
                Settings
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
