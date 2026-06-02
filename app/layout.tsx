import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bolão da Barbearia Capitão',
  description: 'Sistema de Bolão da Barbearia Capitão da Chácara',
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
