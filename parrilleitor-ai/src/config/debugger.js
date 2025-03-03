/**
 * Utilidades de depuración para Auth0 y sesiones
 */

// Variable para habilitar/deshabilitar la depuración
export const DEBUG_MODE = true;

/**
 * Función de depuración para pausar y examinar datos de sesión de Auth0
 * @param {Object} sessionData - Datos de la sesión o token para examinar
 * @param {string} location - Ubicación en el código donde se llama
 * @param {Object} additionalInfo - Información adicional para mostrar
 */
export function debugAuth0Session(sessionData, location, additionalInfo = {}) {
  if (!DEBUG_MODE) return;

  // Crear una pausa artificial usando el depurador
  debugger; // Este punto se activará cuando se ejecute con el depurador

  // Mostrar información detallada en la consola
  console.group(`=== 🔍 DEBUG AUTH0 SESSION [${location}] ===`);
  console.log('Timestamp:', new Date().toISOString());
  console.log('Location:', location);
  
  if (sessionData) {
    console.log('Session Data:', sessionData);
    console.log('User:', sessionData.user || 'No user data');
    
    if (sessionData.user) {
      // Analizar y mostrar datos específicos de interés
      console.group('User Details:');
      console.log('Email:', sessionData.user.email);
      console.log('Name:', sessionData.user.name);
      console.log('Sub:', sessionData.user.sub);
      
      // Buscar información de roles
      console.group('Roles and Permissions:');
      const userKeys = Object.keys(sessionData.user);
      
      // Buscar propiedades relacionadas con Auth0
      const auth0Keys = userKeys.filter(k => 
        k.includes('auth0') || 
        k.includes('role') || 
        k.includes('premium') ||
        k.includes('https://'));
      
      if (auth0Keys.length > 0) {
        console.log('Auth0 related properties:');
        auth0Keys.forEach(key => {
          console.log(`- ${key}:`, sessionData.user[key]);
        });
      }
      
      // Buscar arrays que podrían contener roles
      const arrayProps = userKeys.filter(k => Array.isArray(sessionData.user[k]));
      if (arrayProps.length > 0) {
        console.log('Array properties that might contain roles:');
        arrayProps.forEach(key => {
          console.log(`- ${key}:`, sessionData.user[key]);
        });
      }
      
      console.groupEnd(); // Roles group
      console.groupEnd(); // User details group
    }
  } else {
    console.log('⚠️ No session data provided');
  }
  
  // Mostrar información adicional si se proporciona
  if (Object.keys(additionalInfo).length > 0) {
    console.group('Additional Information:');
    Object.entries(additionalInfo).forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
    console.groupEnd();
  }
  
  console.groupEnd(); // Main debug group
}

/**
 * Versión simplificada que no usa debugger pero muestra información más completa
 */
export function logAuth0Data(sessionData, location, additionalInfo = {}) {
  console.group(`🔍 AUTH0 DATA [${location}]`);
  
  if (sessionData?.user) {
    // Mostrar todas las propiedades del usuario para depuración
    console.log('User keys:', Object.keys(sessionData.user));
    
    // Mostrar propiedades específicas que nos interesan
    const baseNamespace = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com';
    
    console.group('Important Auth0 Claims:');
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
    
    console.groupEnd(); // Important claims
  } else {
    console.log('No user data in session');
  }
  
  // Mostrar información adicional
  if (additionalInfo && Object.keys(additionalInfo).length > 0) {
    console.log('Additional info:', additionalInfo);
  }
  
  console.groupEnd(); // Main group
} 