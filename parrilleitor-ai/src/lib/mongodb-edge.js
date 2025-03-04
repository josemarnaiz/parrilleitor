/**
 * Versión ligera de las funciones de MongoDB para Edge Runtime
 * Este archivo proporciona implementaciones simuladas para las rutas API que
 * usan Edge Runtime y no pueden acceder a MongoDB directamente.
 */

// Simulacro de conexión a la base de datos para Edge Runtime
export async function connectToDatabase() {
  console.log("Edge Runtime: Simulando conexión a MongoDB");
  return {
    client: null,
    db: {
      collection: (collectionName) => ({
        insertOne: async (doc) => {
          console.log(`Edge Runtime: Simulando inserción en colección ${collectionName}`, doc);
          return { acknowledged: true, insertedId: 'edge-runtime-id' };
        },
        find: () => ({
          sort: () => ({
            limit: () => ({
              toArray: async () => []
            })
          })
        }),
        findOne: async () => null,
        updateOne: async () => ({ acknowledged: true }),
        deleteOne: async () => ({ acknowledged: true }),
        command: async () => ({ ok: 1 })
      }),
      command: async () => ({ ok: 1 })
    }
  };
}

// Funciones adicionales exportadas
export async function getMongoDb() {
  const { db } = await connectToDatabase();
  return db;
}

export async function closeMongoDb() {
  console.log("Edge Runtime: Simulando cierre de conexión MongoDB");
}

// Clase simulada para mantener compatibilidad
export class MongoDBClient {
  constructor() {
    this.database = 'edge-runtime-db';
  }

  async connect() {
    console.log("Edge Runtime: MongoDBClient simulando conexión");
    return this;
  }

  collection(name) {
    return {
      insertOne: async () => ({ acknowledged: true }),
      find: () => ({
        sort: () => ({
          limit: () => ({
            toArray: async () => []
          })
        })
      }),
      findOne: async () => null
    };
  }
} 