/**
 * Utilidades de depuración para Auth0 y sesiones
 */

// Variable para habilitar/deshabilitar la depuración
export const DEBUG_MODE = true;

/**
 * Función de depuración para Auth0
 */
export function debugAuth0Session(sessionData, location, additionalInfo = {}) {
  console.log(`🔍 AUTH0 DEBUG [${location}] - START`);
  
  if (sessionData?.user) {
    // Mostrar información básica del usuario
    console.log('Basic user info:', {
      email: sessionData.user.email,
      name: sessionData.user.name,
      sub: sessionData.user.sub
    });
    
    // Mostrar propiedades específicas que nos interesan
    const baseNamespace = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com';
    
    console.log('Auth0 Claims:');
    // Verificar isPremium en distintas ubicaciones
    console.log(`isPremium (direct): ${sessionData.user[`${baseNamespace}/isPremium`]}`);
    console.log(`premiumVerifiedAt: ${sessionData.user[`${baseNamespace}/premiumVerifiedAt`]}`);
    
    // Verificar si el namespace base existe
    if (sessionData.user[baseNamespace]) {
      console.log(`Namespace object:`, sessionData.user[baseNamespace]);
    } else {
      console.log(`Namespace object not found`);
    }
    
    // Verificar roles
    const rolesPath = `${baseNamespace}/roles`;
    if (sessionData.user[rolesPath]) {
      console.log(`Roles:`, sessionData.user[rolesPath]);
    } else {
      console.log(`Roles not found at ${rolesPath}`);
    }
    
    // Buscar cualquier propiedad con "premium" o "rol_"
    const userObj = sessionData.user;
    const premiumProps = Object.keys(userObj).filter(k => 
      (typeof userObj[k] === 'string' && (userObj[k].includes('premium') || userObj[k].includes('rol_'))) ||
      (Array.isArray(userObj[k]) && userObj[k].some(v => typeof v === 'string' && (v.includes('premium') || v.includes('rol_'))))
    );
    
    if (premiumProps.length > 0) {
      console.log('Properties related to premium status:');
      premiumProps.forEach(key => {
        console.log(`- ${key}:`, userObj[key]);
      });
    }
    
    console.log('Auth0 Claims - END');
  } else {
    console.log('No user data in session');
  }
  
  // Mostrar información adicional
  if (additionalInfo && Object.keys(additionalInfo).length > 0) {
    console.log('Additional info:', additionalInfo);
  }
  
  console.log(`🔍 AUTH0 DEBUG [${location}] - END`);
}

/**
 * Versión simplificada que no usa debugger pero muestra información más completa
 */
export function logAuth0Data(sessionData, location, additionalInfo = {}) {
  console.log(`🔍 AUTH0 DATA [${location}] - START`);
  
  if (sessionData?.user) {
    // Mostrar todas las propiedades del usuario para depuración
    console.log('User keys:', Object.keys(sessionData.user));
    
    // Mostrar propiedades específicas que nos interesan
    const baseNamespace = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com';
    
    console.log('Important Auth0 Claims:');
    // Verificar isPremium en distintas ubicaciones
    console.log(`isPremium (direct): ${sessionData.user[`${baseNamespace}/isPremium`]}`);
    console.log(`premiumVerifiedAt: ${sessionData.user[`${baseNamespace}/premiumVerifiedAt`]}`);
    
    // Verificar si el namespace base existe
    if (sessionData.user[baseNamespace]) {
      console.log(`Namespace object:`, sessionData.user[baseNamespace]);
    } else {
      console.log(`Namespace object not found`);
    }
    
    // Verificar roles
    const rolesPath = `${baseNamespace}/roles`;
    if (sessionData.user[rolesPath]) {
      console.log(`Roles:`, sessionData.user[rolesPath]);
    } else {
      console.log(`Roles not found at ${rolesPath}`);
    }
    
    // Buscar cualquier propiedad con "premium" o "rol_"
    const userObj = sessionData.user;
    const premiumProps = Object.keys(userObj).filter(k => 
      (typeof userObj[k] === 'string' && (userObj[k].includes('premium') || userObj[k].includes('rol_'))) ||
      (Array.isArray(userObj[k]) && userObj[k].some(v => typeof v === 'string' && (v.includes('premium') || v.includes('rol_'))))
    );
    
    if (premiumProps.length > 0) {
      console.log('Properties related to premium status:');
      premiumProps.forEach(key => {
        console.log(`- ${key}:`, userObj[key]);
      });
    }
    
    console.log('Important Auth0 Claims - END');
  } else {
    console.log('No user data in session');
  }
  
  // Mostrar información adicional
  if (additionalInfo && Object.keys(additionalInfo).length > 0) {
    console.log('Additional info:', additionalInfo);
  }
  
  console.log(`🔍 AUTH0 DATA [${location}] - END`);
} 