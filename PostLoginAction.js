exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com';
  
  // Añadir los roles al token como lo hacemos actualmente
  if (event.authorization?.roles) {
    api.idToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
    api.accessToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
    
    // ID del rol premium
    const PREMIUM_ROLE_ID = 'rol_vWDGREdcQo4ulVhS';
    
    // Verificar si el usuario tiene el rol premium
    const hasPremiumRole = event.authorization.roles.includes(PREMIUM_ROLE_ID);
    
    // Añadir un claim explícito para el estado premium
    api.idToken.setCustomClaim(`${namespace}/isPremium`, hasPremiumRole);
    api.accessToken.setCustomClaim(`${namespace}/isPremium`, hasPremiumRole);
    
    // También podemos añadir un claim adicional con el timestamp de verificación
    const verificationTimestamp = new Date().toISOString();
    api.idToken.setCustomClaim(`${namespace}/premiumVerifiedAt`, verificationTimestamp);
    api.accessToken.setCustomClaim(`${namespace}/premiumVerifiedAt`, verificationTimestamp);
    
    // Log para depuración
    console.log(`User ${event.user.email} has premium role: ${hasPremiumRole}`);
  } else {
    // Si no hay roles, establecer explícitamente que no es premium
    api.idToken.setCustomClaim(`${namespace}/isPremium`, false);
    api.accessToken.setCustomClaim(`${namespace}/isPremium`, false);
  }
}; 