// Configuración de Auth0 para la aplicación
export const auth0Config = {
  // Duración de la sesión en segundos (90 días)
  sessionDuration: 90 * 24 * 60 * 60,
  
  // URL de retorno después del login
  returnTo: '/',
  
  // URL de retorno después del logout
  logoutReturnTo: process.env.AUTH0_BASE_URL || 'https://parrilleitorai.vercel.app',
  
  // Opciones para evitar problemas de CORS
  useFormData: true, // Usar form data en lugar de fetch API
  useRefreshTokens: true, // Usar refresh tokens para mantener la sesión
  
  // Configuración específica para el logout
  logoutOptions: {
    // No usar el logout global de Auth0 para evitar CORS
    // Esto hace que el logout sea solo local (en la aplicación)
    localOnly: true
  },
  
  authorizationParams: {
    // Parámetros adicionales para la autorización
    audience: process.env.AUTH0_AUDIENCE || 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/api/v2/',
    scope: process.env.AUTH0_SCOPE || 'openid profile email'
  }
}

// Función para obtener la configuración de Auth0
export function getAuth0Config() {
  return auth0Config
} 