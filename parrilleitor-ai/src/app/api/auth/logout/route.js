import { handleLogout } from '@auth0/nextjs-auth0/edge'
import { NextResponse } from 'next/server'
import { getAuth0Config } from '@/config/auth0Config'

// Configuración de Auth0
const config = getAuth0Config()

// Manejador para GET requests (redirección directa)
export async function GET(req) {
  try {
    // Usar el manejador de Auth0 para el logout
    return await handleLogout(req, {
      returnTo: config.logoutReturnTo,
      // Usar logout local para evitar CORS
      ...config.logoutOptions
    })
  } catch (error) {
    console.error('Error en el logout (GET):', error)
    // Devolver una respuesta de error
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
}

// Manejador para POST requests (desde el botón de logout)
export async function POST(req) {
  try {
    // Usar el manejador de Auth0 para el logout
    return await handleLogout(req, {
      returnTo: config.logoutReturnTo,
      // Usar logout local para evitar CORS
      ...config.logoutOptions
    })
  } catch (error) {
    console.error('Error en el logout (POST):', error)
    // Devolver una respuesta de error
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
}

export const runtime = 'edge' 