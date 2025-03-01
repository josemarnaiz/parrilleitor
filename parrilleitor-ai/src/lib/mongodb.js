import mongoose from 'mongoose';

// URI de MongoDB hardcodeada directamente
const MONGODB_URI = 'mongodb+srv://jmam:jmamadmin@cluster0.pogiz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Cache object to store the database connection
const cache = {
  conn: null,
  promise: null
};

async function connectDB() {
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