import { Suspense } from 'react'
import Auth0Diagnostics from '@/components/Auth0Diagnostics'

export const metadata = {
  title: 'Diagnóstico de Auth0 | Parrilleitor AI',
  description: 'Herramienta de diagnóstico para problemas de autenticación con Auth0',
}

export default function DiagnosticsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Suspense fallback={
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
            <p className="ml-4 text-gray-600">Cargando herramienta de diagnóstico...</p>
          </div>
        }>
          <Auth0Diagnostics />
        </Suspense>
      </div>
    </main>
  )
} 