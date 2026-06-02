import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bolão Entrego Sumarezinho',
  description: 'Sistema de Bolão da Copa do Mundo 2026',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <main className="main-container">
          {children}
        </main>
      </body>
    </html>
  )
}
