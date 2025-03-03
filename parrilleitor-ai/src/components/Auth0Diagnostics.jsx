'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Códigos de error conocidos de Auth0 y sus soluciones
const AUTH0_ERROR_CODES = {
  '4000': 'Error de configuración: URL de callback no válida. Asegúrese de que la URL de callback esté registrada en la configuración de Auth0.',
  '4001': 'Error de configuración: Dominio Auth0 no válido o solicitud a un tenant inexistente.',
  '4002': 'Error de configuración: Client ID no válido o no corresponde al tenant.',
  '4004': 'Error de configuración: Método Auth0 no válido para este tenant.',
  'consent_required': 'Se requiere consentimiento del usuario para acceder a los recursos solicitados.',
};

export default function Auth0Diagnostics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);
  const [connectivity, setConnectivity] = useState(null);
  
  useEffect(() => {
    // Extraer parámetros de error de la URL
    const searchParams = new URLSearchParams(window.location.search);
    const errorParam = searchParams.get('error');
    const errorDescriptionParam = searchParams.get('error_description');
    
    if (errorParam) {
      const errorInfo = {
        code: errorParam,
        description: errorDescriptionParam || 'No description available',
        diagnosis: AUTH0_ERROR_CODES[errorParam] || 'Error no reconocido de Auth0'
      };
      
      setError(errorInfo);
      console.error('Auth0 Error Detected:', errorInfo);
      
      // Enviar el error a nuestro endpoint de logs
      fetch('/api/debug/auth0', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: errorInfo,
          source: 'client',
          url: window.location.href
        })
      }).catch(e => console.error('Error logging Auth0 error:', e));
    }
    
    // Realizar diagnóstico de Auth0
    performDiagnostics();
  }, []);
  
  // Función para realizar diagnóstico del entorno Auth0
  const performDiagnostics = async () => {
    try {
      setLoading(true);
      
      // Obtener el diagnóstico desde el API
      const healthCheckResponse = await fetch('/api/debug/auth0', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      });
      
      if (healthCheckResponse.ok) {
        const healthData = await healthCheckResponse.json();
        setDiagnostics(healthData);
        setConnectivity(healthData.connectivity || false);
      } else {
        throw new Error('No se pudo obtener el diagnóstico de Auth0');
      }
    } catch (err) {
      console.error('Error durante el diagnóstico:', err);
      setDiagnostics({
        error: err.message,
        clientInfo: {
          userAgent: navigator.userAgent,
          isSecureContext: window.isSecureContext,
          protocol: window.location.protocol,
          host: window.location.host
        }
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Función para reintentar el login con parámetros corregidos
  const retryLogin = () => {
    window.location.href = '/api/auth/login';
  };
  
  // Función para el login sin redirección
  const loginWithoutRedirect = () => {
    window.location.href = '/api/auth/login?directRedirect=false';
  };
  
  return (
    <div className="max-w-3xl mx-auto p-4 bg-white rounded-lg shadow-lg my-8">
      <h1 className="text-2xl font-bold text-red-600 mb-4">
        {error ? '⚠️ Error de Autenticación Auth0' : 'Diagnóstico de Auth0'}
      </h1>
      
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="ml-4 text-gray-600">Realizando diagnóstico...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <h2 className="text-lg font-semibold text-red-800">Error detectado</h2>
          <div className="mt-2">
            <p className="text-gray-700"><strong>Código:</strong> {error.code}</p>
            <p className="text-gray-700"><strong>Descripción:</strong> {error.description}</p>
            
            {error.diagnosis && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-100 rounded">
                <p className="text-gray-800"><strong>Diagnóstico:</strong> {error.diagnosis}</p>
              </div>
            )}
            
            {error.code === '4000' && (
              <div className="mt-4 bg-blue-50 p-3 rounded border border-blue-100">
                <h3 className="font-medium text-blue-800">Solución para Error 4000:</h3>
                <p className="mt-1 text-gray-700">
                  Este error indica que la URL de callback no está registrada en Auth0. 
                  Verifique que la URL <code className="bg-blue-100 px-1 rounded">{window.location.origin}/api/auth/callback</code> esté 
                  registrada en la configuración de Auth0.
                </p>
                <div className="mt-3">
                  <h4 className="font-medium text-gray-700">Pasos para solucionarlo:</h4>
                  <ol className="list-decimal list-inside mt-1 text-gray-600">
                    <li>Acceda al panel de control de Auth0</li>
                    <li>Vaya a Applications &gt; Applications</li>
                    <li>Seleccione su aplicación</li>
                    <li>En la sección "Allowed Callback URLs", añada: <code className="bg-blue-100 px-1 rounded">{window.location.origin}/api/auth/callback</code></li>
                    <li>En la sección "Allowed Logout URLs", añada: <code className="bg-blue-100 px-1 rounded">{window.location.origin}</code></li>
                    <li>En la sección "Allowed Web Origins", añada: <code className="bg-blue-100 px-1 rounded">{window.location.origin}</code></li>
                    <li>Guarde los cambios</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex space-x-3">
            <button 
              onClick={retryLogin} 
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded transition-colors"
            >
              Reintentar Login
            </button>
            <button 
              onClick={loginWithoutRedirect} 
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded transition-colors"
            >
              Login sin Redirección
            </button>
            <button 
              onClick={() => router.push('/')} 
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded hover:bg-gray-50 transition-colors"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      )}
      
      {!loading && diagnostics && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Diagnóstico del Entorno</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <h3 className="font-medium text-gray-700 mb-2">Información del Entorno</h3>
              <ul className="space-y-1 text-sm">
                <li><strong>Modo:</strong> {process.env.NODE_ENV}</li>
                <li><strong>Protocolo:</strong> {window.location.protocol}</li>
                <li><strong>Host:</strong> {window.location.host}</li>
                <li><strong>Contexto Seguro:</strong> {window.isSecureContext ? 'Sí' : 'No'}</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <h3 className="font-medium text-gray-700 mb-2">Estado de Auth0</h3>
              {connectivity !== null ? (
                <div className={`flex items-center ${connectivity ? 'text-green-600' : 'text-red-600'}`}>
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${connectivity ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {connectivity ? 'Conectado' : 'No conectado'}
                </div>
              ) : (
                <p className="text-gray-500">Estado desconocido</p>
              )}
            </div>
          </div>
          
          {diagnostics.issues && diagnostics.issues.length > 0 && (
            <div className="mt-4 bg-yellow-50 p-4 rounded border border-yellow-200">
              <h3 className="font-medium text-yellow-800 mb-2">Problemas Detectados</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {diagnostics.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          
          {diagnostics.recommendations && (
            <div className="mt-4 bg-blue-50 p-4 rounded border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2">Recomendaciones</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {diagnostics.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Si continúa experimentando problemas, contacte al soporte técnico o verifique los logs del servidor.
        </p>
      </div>
    </div>
  );
} 