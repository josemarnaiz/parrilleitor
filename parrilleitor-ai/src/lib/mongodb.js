import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import mongoose from 'mongoose';

// Configuración de conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jmam:jmamadmin@cluster0.pogiz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'parrilleitor';

console.log("URI de MongoDB configurada:", MONGODB_URI.replace(/mongodb(\+srv)?:\/\/[^:]+:[^@]+@/, 'mongodb$1://****:****@'));

// Opciones del cliente MongoDB optimizadas para entornos serverless
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10,           // Aumentado para manejar más conexiones
  minPoolSize: 1,
  connectTimeoutMS: 60000,   // Aumentado a 60 segundos
  socketTimeoutMS: 60000,    // Aumentado a 60 segundos
  serverSelectionTimeoutMS: 60000, // Aumentado a 60 segundos
  waitQueueTimeoutMS: 30000, // Aumentado a 30 segundos
  family: 4,
  retryWrites: true,
  retryReads: true,
  w: 'majority',
  wtimeoutMS: 30000,        // Aumentado a 30 segundos
  keepAlive: true,          // Mantener la conexión viva
  autoReconnect: true,      // Reconectar automáticamente
  reconnectTries: 30,       // Intentar reconectar 30 veces
  reconnectInterval: 1000,  // Intervalo de 1 segundo entre intentos
};

// Variable para almacenar la conexión
let client = null;
let clientPromise = null;
let lastConnectionTime = null;
const CONNECTION_TIMEOUT = 5 * 60 * 1000; // 5 minutos

// Función para verificar si la conexión está viva
async function isConnectionAlive() {
  if (!client) return false;
  try {
    await client.db("admin").command({ ping: 1 });
    return true;
  } catch (error) {
    console.log("La conexión no está viva:", error.message);
    return false;
  }
}

// Función para conectar a MongoDB
async function connectToDatabase() {
  try {
    // Verificar si la conexión existente está viva y no ha expirado
    if (client && lastConnectionTime && (Date.now() - lastConnectionTime < CONNECTION_TIMEOUT)) {
      const isAlive = await isConnectionAlive();
      if (isAlive) {
        console.log("Reutilizando conexión existente a MongoDB");
        return { client, db: client.db(MONGODB_DATABASE) };
      }
    }

    // Si llegamos aquí, necesitamos una nueva conexión
    console.log("Iniciando nueva conexión a MongoDB...");
    
    // Cerrar la conexión anterior si existe
    if (client) {
      try {
        await client.close();
        console.log("Conexión anterior cerrada correctamente");
      } catch (closeError) {
        console.warn("Error al cerrar la conexión anterior:", closeError.message);
      }
      client = null;
    }
    
    // Verificar que la URI tenga el formato correcto
    if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
      throw new Error('URI de MongoDB inválida. Debe comenzar con "mongodb://" o "mongodb+srv://"');
    }
    
    client = new MongoClient(MONGODB_URI, options);
    
    // Conectar con retry
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        await client.connect();
        console.log("Conexión inicial establecida");
        
        // Verificar la conexión
        const db = client.db(MONGODB_DATABASE);
        await db.command({ ping: 1 });
        console.log("Conexión verificada con ping exitoso");
        
        lastConnectionTime = Date.now();
        return { client, db };
      } catch (error) {
        retryCount++;
        if (retryCount === maxRetries) {
          throw error;
        }
        console.log(`Intento ${retryCount} de ${maxRetries} fallido, reintentando...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
  } catch (error) {
    console.error("Error al conectar a MongoDB:", {
      message: error.message,
      code: error.code,
      codeName: error.codeName,
      timestamp: new Date().toISOString()
    });

    // Limpiar la conexión fallida
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.error("Error al cerrar la conexión fallida:", closeError);
      }
      client = null;
      lastConnectionTime = null;
    }

    throw error;
  }
}

// Función para obtener una conexión
export async function getMongoDb() {
  try {
    const { db } = await connectToDatabase();
    return db;
  } catch (error) {
    console.error("Error al obtener la conexión MongoDB:", error);
    throw error;
  }
}

// Función para cerrar la conexión
export async function closeMongoDb() {
  if (client) {
    try {
      await client.close();
      client = null;
      console.log("Conexión a MongoDB cerrada correctamente");
    } catch (error) {
      console.error("Error al cerrar la conexión MongoDB:", error);
      throw error;
    }
  }
}

// Exportar las funciones necesarias
export { connectToDatabase };

// Función para conectar Mongoose a MongoDB
// Esta función es más confiable para operaciones de Mongoose como deleteMany
async function connectMongoose() {
  try {
    if (mongoose.connection.readyState === 1) {
      // Si ya está conectado, devuelve la conexión existente
      console.log("Reutilizando conexión Mongoose existente");
      return mongoose.connection;
    }

    // Verificar que la URI tenga el formato correcto
    if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
      throw new Error('URI de MongoDB inválida. Debe comenzar con "mongodb://" o "mongodb+srv://"');
    }
    
    // Para evitar advertencias de deprecación
    mongoose.set('strictQuery', false);
    
    // Configurar event listeners para debugging
    mongoose.connection.on('error', err => {
      console.error('Mongoose connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected');
    });
    
    // Conexión con timeout
    console.log("Iniciando conexión Mongoose a MongoDB...");
    
    const connectPromise = mongoose.connect(MONGODB_URI, mongooseOptions);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Tiempo de conexión Mongoose agotado')), 20000);
    });
    
    // Esperar a que se conecte o timeout
    await Promise.race([connectPromise, timeoutPromise]);
    
    console.log("Conexión Mongoose establecida correctamente");
    mongooseConnection = mongoose.connection;
    return mongooseConnection;
  } catch (error) {
    console.error("Error al conectar Mongoose a MongoDB:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Proporcionar información útil sobre posibles problemas de conexión
    if (error.message.includes('Invalid scheme') || error.message.includes('URI de MongoDB inválida')) {
      console.error("La URI de MongoDB no tiene el formato correcto. Asegúrate de que comience con 'mongodb://' o 'mongodb+srv://'");
    } else if (error.message.includes('connection timed out') || error.message.includes('no server found')) {
      console.error("Posible problema de whitelist de IPs. Asegúrate de que la IP de tu servidor esté permitida en MongoDB Atlas Network Access.");
    } else if (error.message.includes('buffering timed out')) {
      console.error("Timeout en operación de MongoDB. Esto puede ocurrir si la conexión es lenta o si hay problemas de red.");
    }
    
    throw error;
  }
}

// Función principal para conectar a la base de datos
// Esta es la que exportamos por defecto y la que usan los API endpoints
async function connectDB() {
  try {
    console.log("Conectando a MongoDB con Mongoose...");
    await connectMongoose();
    return mongoose.connection;
  } catch (error) {
    console.error("Error en connectDB:", error);
    throw error;
  }
}

// Clase para interactuar con MongoDB
class MongoDBClient {
  constructor() {
    this.database = MONGODB_DATABASE;
    this.connection = null;
    this.lastConnectionTime = null;
    this.ObjectId = ObjectId;
  }

  // Helper method for creating an ObjectId safely
  createObjectId(id) {
    try {
      return new this.ObjectId(id);
    } catch (error) {
      console.error('Error creating ObjectId:', error);
      throw new Error(`Invalid ObjectId format: ${error.message}`);
    }
  }

  // Método para obtener la conexión
  async getConnection() {
    try {
      // Si no hay conexión o han pasado más de 30 minutos desde la última conexión, reconectar
      const now = Date.now();
      if (!this.connection || !this.lastConnectionTime || (now - this.lastConnectionTime > 30 * 60 * 1000)) {
        console.log("Obteniendo nueva conexión a MongoDB...");
        this.connection = await connectToDatabase();
        this.lastConnectionTime = now;
      }
      return this.connection;
    } catch (error) {
      console.error("Error al obtener conexión:", error);
      throw error;
    }
  }

  // Método para buscar documentos con timeout
  async find(collection, filter = {}, options = {}) {
    try {
      console.log(`Buscando documentos en colección ${collection}:`, {
        filter,
        options,
        timestamp: new Date().toISOString()
      });

      const { db } = await this.getConnection();
      
      // Crear un timeout para la operación
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operación find() excedió el tiempo de espera')), 8000);
      });
      
      // Ejecutar la consulta con timeout
      const queryPromise = async () => {
        const cursor = db.collection(collection).find(filter);
        
        if (options.sort) {
          cursor.sort(options.sort);
        }
        
        if (options.limit) {
          cursor.limit(options.limit);
        }
        
        if (options.skip) {
          cursor.skip(options.skip);
        }
        
        return await cursor.toArray();
      };
      
      // Ejecutar con timeout
      return await Promise.race([queryPromise(), timeoutPromise]);
    } catch (error) {
      console.error('Error en MongoDB find:', {
        error: error.message,
        collection,
        filter,
        timestamp: new Date().toISOString()
      });
      
      // Si es un error de timeout, devolver un array vacío en lugar de fallar
      if (error.message.includes('tiempo de espera') || error.message.includes('timed out')) {
        console.warn('Devolviendo resultado vacío debido a timeout');
        return [];
      }
      
      throw error;
    }
  }

  // Método para buscar un documento con timeout
  async findOne(collection, filter = {}) {
    try {
      console.log(`Buscando un documento en colección ${collection}:`, {
        filter,
        timestamp: new Date().toISOString()
      });

      const { db } = await this.getConnection();
      
      // Crear un timeout para la operación
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operación findOne() excedió el tiempo de espera')), 8000);
      });
      
      // Ejecutar la consulta con timeout
      const queryPromise = db.collection(collection).findOne(filter);
      
      // Ejecutar con timeout
      return await Promise.race([queryPromise, timeoutPromise]);
    } catch (error) {
      console.error('Error en MongoDB findOne:', {
        error: error.message,
        collection,
        filter,
        timestamp: new Date().toISOString()
      });
      
      // Si es un error de timeout, devolver null en lugar de fallar
      if (error.message.includes('tiempo de espera') || error.message.includes('timed out')) {
        console.warn('Devolviendo null debido a timeout');
        return null;
      }
      
      throw error;
    }
  }

  // Método para insertar un documento con timeout
  async insertOne(collection, document) {
    try {
      console.log(`Insertando documento en colección ${collection}:`, {
        timestamp: new Date().toISOString()
      });

      const { db } = await this.getConnection();
      
      // Crear un timeout para la operación
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operación insertOne() excedió el tiempo de espera')), 8000);
      });
      
      // Ejecutar la inserción con timeout
      const insertPromise = db.collection(collection).insertOne(document, { wtimeout: 5000 });
      
      // Ejecutar con timeout
      const result = await Promise.race([insertPromise, timeoutPromise]);
      
      return {
        insertedId: result.insertedId,
        acknowledged: result.acknowledged
      };
    } catch (error) {
      console.error('Error en MongoDB insertOne:', {
        error: error.message,
        collection,
        timestamp: new Date().toISOString()
      });
      
      // Si es un error de timeout, devolver un resultado simulado
      if (error.message.includes('tiempo de espera') || error.message.includes('timed out')) {
        console.warn('Devolviendo resultado simulado debido a timeout');
        return {
          insertedId: null,
          acknowledged: false,
          error: 'timeout'
        };
      }
      
      throw error;
    }
  }

  // Método para actualizar un documento con timeout
  async updateOne(collection, filter, update) {
    try {
      console.log(`Actualizando documento en colección ${collection}:`, {
        filter,
        timestamp: new Date().toISOString()
      });

      const { db } = await this.getConnection();
      
      // Crear un timeout para la operación
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operación updateOne() excedió el tiempo de espera')), 8000);
      });
      
      // Ejecutar la actualización con timeout
      const updatePromise = db.collection(collection).updateOne(filter, update, { wtimeout: 5000 });
      
      // Ejecutar con timeout
      const result = await Promise.race([updatePromise, timeoutPromise]);
      
      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        acknowledged: result.acknowledged
      };
    } catch (error) {
      console.error('Error en MongoDB updateOne:', {
        error: error.message,
        collection,
        filter,
        timestamp: new Date().toISOString()
      });
      
      // Si es un error de timeout, devolver un resultado simulado
      if (error.message.includes('tiempo de espera') || error.message.includes('timed out')) {
        console.warn('Devolviendo resultado simulado debido a timeout');
        return {
          matchedCount: 0,
          modifiedCount: 0,
          acknowledged: false,
          error: 'timeout'
        };
      }
      
      throw error;
    }
  }

  // Método para reemplazar un documento con timeout
  async replaceOne(collection, filter, replacement) {
    try {
      console.log(`Reemplazando documento en colección ${collection}:`, {
        filter,
        timestamp: new Date().toISOString()
      });

      const { db } = await this.getConnection();
      
      // Crear un timeout para la operación
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operación replaceOne() excedió el tiempo de espera')), 8000);
      });
      
      // Ejecutar el reemplazo con timeout
      const replacePromise = db.collection(collection).replaceOne(filter, replacement, { wtimeout: 5000 });
      
      // Ejecutar con timeout
      const result = await Promise.race([replacePromise, timeoutPromise]);
      
      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        acknowledged: result.acknowledged
      };
    } catch (error) {
      console.error('Error en MongoDB replaceOne:', {
        error: error.message,
        collection,
        filter,
        timestamp: new Date().toISOString()
      });
      
      // Si es un error de timeout, devolver un resultado simulado
      if (error.message.includes('tiempo de espera') || error.message.includes('timed out')) {
        console.warn('Devolviendo resultado simulado debido a timeout');
        return {
          matchedCount: 0,
          modifiedCount: 0,
          acknowledged: false,
          error: 'timeout'
        };
      }
      
      throw error;
    }
  }

  // Método para eliminar un documento con timeout
  async deleteOne(collection, filter) {
    try {
      console.log(`Eliminando documento en colección ${collection}:`, {
        filter,
        timestamp: new Date().toISOString()
      });

      const { db } = await this.getConnection();
      
      // Crear un timeout para la operación
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operación deleteOne() excedió el tiempo de espera')), 8000);
      });
      
      // Ejecutar la eliminación con timeout
      const deletePromise = db.collection(collection).deleteOne(filter, { wtimeout: 5000 });
      
      // Ejecutar con timeout
      const result = await Promise.race([deletePromise, timeoutPromise]);
      
      return {
        deletedCount: result.deletedCount,
        acknowledged: result.acknowledged
      };
    } catch (error) {
      console.error('Error en MongoDB deleteOne:', {
        error: error.message,
        collection,
        filter,
        timestamp: new Date().toISOString()
      });
      
      // Si es un error de timeout, devolver un resultado simulado
      if (error.message.includes('tiempo de espera') || error.message.includes('timed out')) {
        console.warn('Devolviendo resultado simulado debido a timeout');
        return {
          deletedCount: 0,
          acknowledged: false,
          error: 'timeout'
        };
      }
      
      throw error;
    }
  }

  // Método para verificar la conexión
  async ping() {
    try {
      const { client } = await this.getConnection();
      
      // Crear un timeout para la operación
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operación ping() excedió el tiempo de espera')), 5000);
      });
      
      // Ejecutar el ping con timeout
      const pingPromise = client.db("admin").command({ ping: 1 });
      
      // Ejecutar con timeout
      await Promise.race([pingPromise, timeoutPromise]);
      
      console.log("Ping a MongoDB exitoso");
      return true;
    } catch (error) {
      console.error("Error al hacer ping a MongoDB:", {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  }
}

// Instancia singleton del cliente de MongoDB
let mongoClient = null;

// Función para obtener la instancia del cliente
function getMongoDBClient() {
  if (!mongoClient) {
    mongoClient = new MongoDBClient();
    console.log('Cliente de MongoDB inicializado');
  }
  return mongoClient;
}

export { getMongoDBClient };
export default connectDB; 