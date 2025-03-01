import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';

// Configuración de conexión a MongoDB
// Asegurarse de que la URI siempre tenga el formato correcto
const DEFAULT_URI = "mongodb+srv://jmam:jmamadmin@cluster0.pogiz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const MONGODB_URI = process.env.MONGODB_URI && process.env.MONGODB_URI.startsWith('mongodb') 
  ? process.env.MONGODB_URI 
  : DEFAULT_URI;

console.log("URI de MongoDB configurada:", MONGODB_URI.replace(/mongodb(\+srv)?:\/\/[^:]+:[^@]+@/, 'mongodb$1://****:****@'));

const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'parrilleitor';

// Opciones del cliente MongoDB optimizadas para entornos serverless
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 5,           // Reducido para entornos serverless
  minPoolSize: 1,           // Reducido para entornos serverless
  connectTimeoutMS: 15000,  // Reducido a 15 segundos
  socketTimeoutMS: 30000,   // Reducido a 30 segundos
  serverSelectionTimeoutMS: 15000, // Timeout para selección de servidor
  waitQueueTimeoutMS: 10000, // Timeout para la cola de espera
  family: 4,
  retryWrites: true,
  retryReads: true,
  w: 'majority',
  wtimeoutMS: 10000,        // Timeout para operaciones de escritura
};

// Variable para almacenar la conexión
let client;
let clientPromise;

// Función para conectar a MongoDB
async function connectToDatabase() {
  try {
    if (!client) {
      console.log("Iniciando conexión a MongoDB...");
      
      // Verificar que la URI tenga el formato correcto
      if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
        throw new Error('URI de MongoDB inválida. Debe comenzar con "mongodb://" o "mongodb+srv://"');
      }
      
      client = new MongoClient(MONGODB_URI, options);
      await client.connect();
      console.log("Conexión a MongoDB establecida correctamente");
      
      // Verificar la conexión con un ping
      await client.db("admin").command({ ping: 1 });
      console.log("MongoDB respondió al ping correctamente");
    }
    return { client, db: client.db(MONGODB_DATABASE) };
  } catch (error) {
    console.error("Error al conectar a MongoDB:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Proporcionar información útil sobre posibles problemas de conexión
    if (error.message.includes('Invalid scheme') || error.message.includes('URI de MongoDB inválida')) {
      console.error("La URI de MongoDB no tiene el formato correcto. Asegúrate de que comience con 'mongodb://' o 'mongodb+srv://'");
      console.error("URI actual (ofuscada):", MONGODB_URI.replace(/mongodb(\+srv)?:\/\/[^:]+:[^@]+@/, 'mongodb$1://****:****@'));
    } else if (error.message.includes('connection timed out') || error.message.includes('no server found')) {
      console.error("Posible problema de whitelist de IPs. Asegúrate de que la IP de tu servidor esté permitida en MongoDB Atlas Network Access.");
      console.error("Recomendación: Añade 0.0.0.0/0 a la lista de IPs permitidas en MongoDB Atlas para permitir conexiones desde cualquier IP.");
    } else if (error.message.includes('buffering timed out')) {
      console.error("Timeout en operación de MongoDB. Esto puede ocurrir si la conexión es lenta o si hay problemas de red.");
      console.error("Recomendación: Verifica la conectividad de red y considera aumentar los timeouts en la configuración.");
    }
    
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

export default getMongoDBClient; 