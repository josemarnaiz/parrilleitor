// Lista adicional de usuarios con acceso premium
export const ADDITIONAL_ALLOWED_USERS = [
  'josem.arnaizmartin@gmail.com',
  // Añade más emails aquí
]

// Función helper para verificar si un usuario está en la lista adicional
export function isInAllowedList(email) {
  return ADDITIONAL_ALLOWED_USERS.includes(email?.toLowerCase())
} 