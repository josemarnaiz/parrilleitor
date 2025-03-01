export default function handler(req, res) {
  // Obtener la IP del cliente
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
  
  // Obtener todas las cabeceras para análisis
  const headers = req.headers;
  
  // Registrar la información en los logs
  console.log('Información de IP y cabeceras:', {
    ip,
    forwarded,
    headers,
    timestamp: new Date().toISOString()
  });
  
  // Devolver la información
  res.status(200).json({
    ip,
    forwarded,
    headers,
    message: 'Esta información puede ayudarte a identificar las IPs de Vercel'
  });
} 