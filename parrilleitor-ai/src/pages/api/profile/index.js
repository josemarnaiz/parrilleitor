import { getSession } from '@auth0/nextjs-auth0';
import UserProfile from '@/models/UserProfile';
import mongoose from 'mongoose';

// Conectar a MongoDB si no está conectado
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

export default async function handler(req, res) {
  try {
    const session = await getSession(req, res);
    
    if (!session?.user) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    await connectDB();

    switch (req.method) {
      case 'GET':
        // Obtener perfil del usuario
        const profile = await UserProfile.findOne({ userId: session.user.sub });
        if (!profile) {
          return res.status(404).json({ error: 'Perfil no encontrado' });
        }
        return res.status(200).json(profile);

      case 'POST':
        // Crear o actualizar perfil
        const data = req.body;
        
        // Validar datos requeridos
        const requiredFields = ['peso', 'altura', 'nivelActividad', 'dietaPreferencia', 'objetivos'];
        const missingFields = requiredFields.filter(field => !data[field]);
        
        if (missingFields.length > 0) {
          return res.status(400).json({
            error: 'Faltan campos requeridos',
            missingFields
          });
        }

        // Validar rangos de valores
        if (data.peso.value <= 0 || data.peso.value > 300) {
          return res.status(400).json({ error: 'Peso fuera de rango válido' });
        }
        if (data.altura.value <= 0 || data.altura.value > 300) {
          return res.status(400).json({ error: 'Altura fuera de rango válido' });
        }

        // Buscar perfil existente o crear uno nuevo
        let userProfile = await UserProfile.findOne({ userId: session.user.sub });
        
        if (userProfile) {
          // Si existe, actualizar y guardar historial de peso si cambió
          if (userProfile.peso.value !== data.peso.value) {
            userProfile.peso.history.push({
              value: userProfile.peso.value,
              date: new Date()
            });
          }
          
          // Actualizar todos los campos
          Object.assign(userProfile, {
            ...data,
            userId: session.user.sub
          });
        } else {
          // Si no existe, crear nuevo perfil
          userProfile = new UserProfile({
            ...data,
            userId: session.user.sub
          });
        }

        // Guardar perfil
        await userProfile.save();
        return res.status(200).json(userProfile);

      case 'PUT':
        // Actualizar campos específicos del perfil
        const updateData = req.body;
        const existingProfile = await UserProfile.findOne({ userId: session.user.sub });
        
        if (!existingProfile) {
          return res.status(404).json({ error: 'Perfil no encontrado' });
        }

        // Si se actualiza el peso, guardar en historial
        if (updateData.peso && updateData.peso.value !== existingProfile.peso.value) {
          existingProfile.peso.history.push({
            value: existingProfile.peso.value,
            date: new Date()
          });
        }

        // Actualizar campos proporcionados
        Object.entries(updateData).forEach(([key, value]) => {
          if (key in existingProfile) {
            existingProfile[key] = value;
          }
        });

        await existingProfile.save();
        return res.status(200).json(existingProfile);

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({ error: `Método ${req.method} no permitido` });
    }
  } catch (error) {
    console.error('Error en API de perfil:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
} 