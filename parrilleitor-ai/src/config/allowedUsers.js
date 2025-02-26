// Lista adicional de usuarios con acceso premium
export const ADDITIONAL_ALLOWED_USERS = [
  'josem.arnaizmartin@gmail.com',
  'cesar.carlos.parrilla@gmail.com',
  'testparrilleitor2025@yopmail.com'
  // Añade más emails aquí
]

// Función helper para verificar si un usuario está en la lista adicional
export function isInAllowedList(email) {
  if (!email) return false
  const normalizedEmail = email.toLowerCase().trim()
  const normalizedList = ADDITIONAL_ALLOWED_USERS.map(e => e.toLowerCase().trim())
  return normalizedList.includes(normalizedEmail)
} 