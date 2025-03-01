import { MongoClient, ServerApiVersion } from 'mongodb';

// Configuración de conexión a MongoDB
// Asegurarse de que la URI siempre tenga el formato correcto
const DEFAULT_URI = "mongodb+srv://jmam:jmamadmin@cluster0.pogiz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const MONGODB_URI = process.env.MONGODB_URI && process.env.MONGODB_URI.startsWith('mongodb') 
  ? process.env.MONGODB_URI 
  : DEFAULT_URI;

console.log("URI de MongoDB configurada:", MONGODB_URI.replace(/mongodb(\+srv)?:\/\/[^:]+:[^@]+@/, 'mongodb$1://****:****@'));

const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'parrilleitor';

// Opciones del cliente MongoDB con configuración mejorada para mayor tolerancia a fallos
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10,
  minPoolSize: 5,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4,
  retryWrites: true,
  retryReads: true,
  w: 'majority',
  keepAlive: true,
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
    }
    
    throw error;
  }
}

// Clase para interactuar con MongoDB
class MongoDBClient {
  constructor() {
    this.database = MONGODB_DATABASE;
    this.connection = null;
  }

  // Método para obtener la conexión
  async getConnection() {
    if (!this.connection) {
      this.connection = await connectToDatabase();
    }
    return this.connection;
  }

  // Método para buscar documentos
  async find(collection, filter = {}, options = {}) {
    try {
      console.log(`Buscando documentos en colección ${collection}:`, {
        filter,
        options,
        timestamp: new Date().toISOString()
      });

      const { db } = await this.getConnection();
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
    } catch (error) {
      console.error('Error en MongoDB find:', {
        error: error.message,
        collection,
        filter,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  // Método para buscar un documento
  async findOne(collection, filter = {}) {
    try {
      console.log(`Buscando un documento en colección ${collection}:`, {
        filter,
        timestamp: new Date().toISOString()
      });

      const { db } = await this.getConnection();
      return await db.collection(collection).findOne(filter);
    } catch (error) {
      console.error('Error en MongoDB findOne:', {
        error: error.message,
        collection,
        filter,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  // Método para insertar un documento
  async insertOne(collection, document) {
    try {
      console.log(`Insertando documento en colección ${collection}:`, {
        timestamp: new Date().toISOString()
      });

      const { db } = await this.getConnection();
      const result = await db.collection(collection).insertOne(document);
      
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
      throw error;
    }
  }

  // Método para actualizar un documento
  async updateOne(collection, filter, update) {
    try {
      console.log(`Actualizando documento en colección ${collection}:`, {
        filter,
        timestamp: new Date().toISOString()
      });

      const { db } = await this.getConnection();
      const result = await db.collection(collection).updateOne(filter, update);
      
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
      throw error;
    }
  }

  // Método para reemplazar un documento
  async replaceOne(collection, filter, replacement) {
    try {
      console.log(`Reemplazando documento en colección ${collection}:`, {
        filter,
        timestamp: new Date().toISOString()
      });

      const { db } = await this.getConnection();
      const result = await db.collection(collection).replaceOne(filter, replacement);
      
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
      throw error;
    }
  }

  // Método para eliminar un documento
  async deleteOne(collection, filter) {
    try {
      console.log(`Eliminando documento en colección ${collection}:`, {
        filter,
        timestamp: new Date().toISOString()
      });

      const { db } = await this.getConnection();
      const result = await db.collection(collection).deleteOne(filter);
      
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
      throw error;
    }
  }

  // Método para verificar la conexión
  async ping() {
    try {
      const { client } = await this.getConnection();
      await client.db("admin").command({ ping: 1 });
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