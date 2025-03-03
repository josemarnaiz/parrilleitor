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
    scope: process.env.AUTH0_SCOPE || 'openid profile email read:roles'
  },
  
  // Configuración de roles y claims de Auth0
  rolePaths: [
    'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles',  // Namespace estándar de Auth0
    'roles',                                            // Propiedad roles directa
    'https://dev-zwbfqql3rcbh67rv.us.auth0.com.roles',  // Formato alternativo
    'https://dev-zwbfqql3rcbh67rv.us.auth0.com/user_authorization.roles',  // Otro formato común
    'https://dev-zwbfqql3rcbh67rv.us.auth0.com/role',   // Singular en lugar de plural
    'https://dev-zwbfqql3rcbh67rv.us.auth0.com',        // Namespace base completo
    'app_metadata.roles',                               // App metadata
    'user_metadata.roles'                               // User metadata
  ],
  
  // ID del rol premium
  premiumRoleId: 'rol_vWDGREdcQo4ulVhS'
}

// Función para obtener la configuración de Auth0
export function getAuth0Config() {
  return auth0Config
}

// Función auxiliar para detectar rol premium en un objeto de usuario Auth0
export function hasPremiumAccess(user) {
  if (!user) return false;
  
  // Debug log
  console.log('Verificando acceso premium para:', user.email || 'usuario desconocido')
  
  // 1. Verificar en todas las rutas de roles configuradas
  for (const rolePath of auth0Config.rolePaths) {
    // Manejar rutas anidadas con punto (ej: 'app_metadata.roles')
    if (rolePath.includes('.')) {
      const parts = rolePath.split('.');
      let current = user;
      let pathExists = true;
      
      // Navegar por el objeto para llegar a la propiedad anidada
      for (const part of parts) {
        if (!current || typeof current !== 'object') {
          pathExists = false;
          break;
        }
        current = current[part];
      }
      
      // Si encontramos la ruta y contiene roles
      if (pathExists && Array.isArray(current)) {
        // Verificar por ID exacto
        if (current.includes(auth0Config.premiumRoleId)) {
          console.log(`Rol premium encontrado en ruta anidada: ${rolePath}`)
          return true;
        }
        // Verificar por coincidencia parcial
        if (current.some(r => typeof r === 'string' && (
          r.toLowerCase().includes('premium') || 
          r.startsWith('rol_')
        ))) {
          console.log(`Rol premium encontrado por nombre en ruta anidada: ${rolePath}`)
          return true;
        }
      }
    } 
    // Ruta directa
    else {
      const roles = user[rolePath];
      if (Array.isArray(roles)) {
        // Verificar por ID exacto
        if (roles.includes(auth0Config.premiumRoleId)) {
          console.log(`Rol premium encontrado en ruta: ${rolePath}`)
          return true;
        }
        // Verificar por coincidencia parcial
        if (roles.some(r => typeof r === 'string' && (
          r.toLowerCase().includes('premium') || 
          r.startsWith('rol_')
        ))) {
          console.log(`Rol premium encontrado por nombre en ruta: ${rolePath}`)
          return true;
        }
      }
      
      // También verificar si el valor es un objeto que podría contener roles
      if (roles && typeof roles === 'object' && !Array.isArray(roles)) {
        // Buscar cualquier propiedad que pueda contener roles
        for (const key in roles) {
          if (Array.isArray(roles[key])) {
            // Verificar por ID exacto
            if (roles[key].includes(auth0Config.premiumRoleId)) {
              console.log(`Rol premium encontrado en ruta anidada: ${rolePath}.${key}`)
              return true;
            }
            // Verificar por coincidencia parcial
            if (roles[key].some(r => typeof r === 'string' && (
              r.toLowerCase().includes('premium') || 
              r.startsWith('rol_')
            ))) {
              console.log(`Rol premium encontrado por nombre en ruta anidada: ${rolePath}.${key}`)
              return true;
            }
          }
        }
      }
    }
  }
  
  // 2. Buscar en objetos anidados (espacios de nombres)
  const authNamespace = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com';
  if (user[authNamespace]) {
    const namespaceObj = user[authNamespace];
    // Verificar si es un objeto
    if (typeof namespaceObj === 'object') {
      // Buscar en propiedades que podrían contener roles
      for (const key in namespaceObj) {
        if (Array.isArray(namespaceObj[key])) {
          // Verificar por ID exacto
          if (namespaceObj[key].includes(auth0Config.premiumRoleId)) {
            console.log(`Rol premium encontrado en namespace: ${authNamespace}.${key}`)
            return true;
          }
          // Verificar por coincidencia parcial
          if (namespaceObj[key].some(r => typeof r === 'string' && (
            r.toLowerCase().includes('premium') || 
            r.startsWith('rol_')
          ))) {
            console.log(`Rol premium encontrado por nombre en namespace: ${authNamespace}.${key}`)
            return true;
          }
        }
      }
    }
    // Si el propio objeto del namespace es un array (poco común pero posible)
    else if (Array.isArray(namespaceObj)) {
      // Verificar por ID exacto
      if (namespaceObj.includes(auth0Config.premiumRoleId)) {
        console.log(`Rol premium encontrado en namespace array`)
        return true;
      }
      // Verificar por coincidencia parcial
      if (namespaceObj.some(r => typeof r === 'string' && (
        r.toLowerCase().includes('premium') || 
        r.startsWith('rol_')
      ))) {
        console.log(`Rol premium encontrado por nombre en namespace array`)
        return true;
      }
    }
  }
  
  // 3. Buscar por nombre en cualquier array dentro del objeto de usuario
  for (const key in user) {
    // Verificar arrays directos
    if (Array.isArray(user[key])) {
      const hasNameMatch = user[key].some(item => 
        typeof item === 'string' && 
        (item === auth0Config.premiumRoleId || 
         item.toLowerCase().includes('premium') || 
         item.startsWith('rol_'))
      );
      if (hasNameMatch) {
        console.log(`Rol premium encontrado en propiedad: ${key}`)
        return true;
      }
    }
    
    // Verificar objetos que podrían contener arrays
    if (user[key] && typeof user[key] === 'object' && !Array.isArray(user[key])) {
      for (const subKey in user[key]) {
        if (Array.isArray(user[key][subKey])) {
          const hasNameMatch = user[key][subKey].some(item => 
            typeof item === 'string' && 
            (item === auth0Config.premiumRoleId || 
             item.toLowerCase().includes('premium') || 
             item.startsWith('rol_'))
          );
          if (hasNameMatch) {
            console.log(`Rol premium encontrado en propiedad anidada: ${key}.${subKey}`)
            return true;
          }
        }
      }
    }
  }
  
  // 4. Verificar si hay alguna propiedad booleana que indique premium
  for (const key in user) {
    // Propiedades directas
    if (typeof user[key] === 'boolean' && 
        key.toLowerCase().includes('premium') && 
        user[key] === true) {
      console.log(`Estado premium encontrado en propiedad booleana: ${key}`)
      return true;
    }
    
    // Propiedades anidadas
    if (user[key] && typeof user[key] === 'object') {
      for (const subKey in user[key]) {
        if (typeof user[key][subKey] === 'boolean' && 
            subKey.toLowerCase().includes('premium') && 
            user[key][subKey] === true) {
          console.log(`Estado premium encontrado en propiedad booleana anidada: ${key}.${subKey}`)
          return true;
        }
      }
    }
  }
  
  console.log('No se encontró acceso premium para este usuario')
  return false;
} 