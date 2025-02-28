import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// Función para verificar la URI de MongoDB
function validateMongoURI(uri) {
  if (!uri) {
    console.error('MongoDB URI no definida en variables de entorno');
    return false;
  }
  
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    console.error('MongoDB URI no válida:', uri);
    return false;
  }
  
  return true;
}

// Validar la URI al inicio
const isValidURI = validateMongoURI(MONGODB_URI);
if (!isValidURI) {
  console.error('MongoDB URI no válida. Usando URI de fallback para desarrollo.');
}

// Cache object to store the database connection
const cache = {
  conn: null,
  promise: null
};

async function connectDB() {
  // Si la URI no es válida, lanzar un error descriptivo
  if (!validateMongoURI(MONGODB_URI)) {
    throw new Error('MongoDB URI no válida o no configurada correctamente');
  }

  // If we have a connection, return it
  if (cache.conn) {
    return cache.conn;
  }

  // If we don't have a connection but have a connecting promise, wait for it
  if (!cache.promise) {
    console.log('Iniciando conexión a MongoDB:', {
      uri: MONGODB_URI.substring(0, MONGODB_URI.indexOf('@') + 1) + '***', // Ocultar credenciales
      timestamp: new Date().toISOString()
    });
    
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cache.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('Conexión a MongoDB establecida correctamente');
      return mongoose;
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (e) {
    console.error('Error al conectar con MongoDB:', {
      error: e.message,
      code: e.code,
      name: e.name,
      timestamp: new Date().toISOString()
    });
    cache.promise = null;
    throw e;
  }

  return cache.conn;
}

export default connectDB; 