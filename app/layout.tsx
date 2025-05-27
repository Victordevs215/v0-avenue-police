import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Avenue Police - Sistema Penal",
  description: "Sistema de Gestão Penal - Avenue City",
  generator: "Avenue City Government",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
      {
        url: "/avenue-logo.gif",
        sizes: "32x32",
        type: "image/gif",
      },
    ],
    shortcut: "/favicon.ico",
    apple: "/avenue-logo.gif",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/avenue-logo.gif" type="image/gif" />
        <link rel="apple-touch-icon" href="/avenue-logo.gif" />
        <meta name="theme-color" content="#26C6DA" />
        <meta name="msapplication-TileColor" content="#26C6DA" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body>{children}</body>
    </html>
  )
}
