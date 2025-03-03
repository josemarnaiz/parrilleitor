// Lista adicional de usuarios con acceso premium
export const ADDITIONAL_ALLOWED_USERS = [
  // Lista vaciada - ahora el acceso premium se basa únicamente en los roles de Auth0
]

// Función helper para verificar si un usuario está en la lista adicional
export function isInAllowedList(email) {
  if (!email) return false
  
  // Normalizar el email a verificar
  const normalizedEmail = email.toLowerCase().trim()
  console.log('Verificando email en lista permitida:', {
    originalEmail: email,
    normalizedEmail,
    allowedList: ADDITIONAL_ALLOWED_USERS
  })
  
  // Verificar contra la lista normalizada
  const normalizedList = ADDITIONAL_ALLOWED_USERS.map(e => e.toLowerCase().trim())
  const isAllowed = normalizedList.includes(normalizedEmail)
  
  console.log('Resultado de verificación:', {
    email: normalizedEmail,
    isAllowed,
    matchedWith: isAllowed ? ADDITIONAL_ALLOWED_USERS.find(e => e.toLowerCase().trim() === normalizedEmail) : null
  })
  
  return isAllowed
} 