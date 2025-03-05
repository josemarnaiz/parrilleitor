import mongoose from 'mongoose';

const activityLevels = [
  'sedentario',           // Poco o ningún ejercicio
  'ligeramente_activo',   // Ejercicio ligero 1-3 días/semana
  'moderadamente_activo', // Ejercicio moderado 3-5 días/semana
  'muy_activo',           // Ejercicio intenso 6-7 días/semana
  'extremadamente_activo' // Ejercicio muy intenso y trabajo físico
];

const dietaryPreferences = [
  'omnivoro',    // Come de todo
  'vegetariano', // No come carne pero sí huevos y lácteos
  'vegano',      // No consume productos de origen animal
  'pescetariano' // Vegetariano que come pescado
];

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Datos físicos
  peso: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'kg' },
    history: [{
      value: Number,
      date: { type: Date, default: Date.now }
    }]
  },
  altura: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'cm' }
  },
  // Nivel de actividad física
  nivelActividad: {
    type: String,
    enum: activityLevels,
    required: true
  },
  // Preferencias alimentarias
  dietaPreferencia: {
    type: String,
    enum: dietaryPreferences,
    required: true
  },
  // Alergias e intolerancias
  alergias: [{
    type: String,
    trim: true
  }],
  // Objetivos
  objetivos: {
    principal: {
      type: String,
      enum: ['perdida_peso', 'ganancia_muscular', 'mantenimiento', 'rendimiento_deportivo', 'salud_general'],
      required: true
    },
    detalles: String
  },
  // Restricciones médicas o condiciones especiales
  restriccionesMedicas: [{
    condicion: String,
    detalles: String
  }],
  // Preferencias de entrenamiento
  preferenciaEntrenamiento: [{
    tipo: String, // e.g., 'cardio', 'pesas', 'yoga', etc.
    nivel: {
      type: String,
      enum: ['principiante', 'intermedio', 'avanzado']
    }
  }],
  // Horarios preferidos
  horariosPreferidos: {
    entrenamientos: [{
      dia: { type: String, enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] },
      hora: String
    }],
    comidas: [{
      nombre: String,
      hora: String
    }]
  },
  // Métricas calculadas
  metricas: {
    imc: Number,
    tmb: Number, // Tasa Metabólica Basal
    caloriasObjetivo: Number
  }
}, {
  timestamps: true
});

// Middleware para calcular métricas antes de guardar
userProfileSchema.pre('save', function(next) {
  // Calcular IMC
  const pesoKg = this.peso.unit === 'kg' ? this.peso.value : this.peso.value * 0.453592;
  const alturaMt = this.altura.unit === 'cm' ? this.altura.value / 100 : this.altura.value / 39.3701;
  this.metricas.imc = pesoKg / (alturaMt * alturaMt);
  
  // Calcular TMB usando la fórmula de Harris-Benedict
  // Nota: Esta es una aproximación básica, en producción podrías usar fórmulas más precisas
  const edad = 30; // En producción, calcular desde el perfil del usuario
  const genero = 'masculino'; // En producción, obtener del perfil del usuario
  
  if (genero === 'masculino') {
    this.metricas.tmb = 88.362 + (13.397 * pesoKg) + (4.799 * this.altura.value) - (5.677 * edad);
  } else {
    this.metricas.tmb = 447.593 + (9.247 * pesoKg) + (3.098 * this.altura.value) - (4.330 * edad);
  }
  
  // Calcular calorías objetivo basado en nivel de actividad y objetivo
  const factoresActividad = {
    sedentario: 1.2,
    ligeramente_activo: 1.375,
    moderadamente_activo: 1.55,
    muy_activo: 1.725,
    extremadamente_activo: 1.9
  };
  
  const caloriasBase = this.metricas.tmb * factoresActividad[this.nivelActividad];
  
  // Ajustar según objetivo
  switch (this.objetivos.principal) {
    case 'perdida_peso':
      this.metricas.caloriasObjetivo = caloriasBase - 500; // Déficit de 500 calorías
      break;
    case 'ganancia_muscular':
      this.metricas.caloriasObjetivo = caloriasBase + 300; // Superávit de 300 calorías
      break;
    default:
      this.metricas.caloriasObjetivo = caloriasBase;
  }
  
  next();
});

// Método para obtener un resumen del perfil para el prompt
userProfileSchema.methods.getProfileSummary = function() {
  return `
PERFIL DEL USUARIO:
- Datos físicos: ${this.peso.value}${this.peso.unit}, ${this.altura.value}${this.altura.unit} (IMC: ${this.metricas.imc.toFixed(1)})
- Nivel de actividad: ${this.nivelActividad}
- Preferencia dietética: ${this.dietaPreferencia}
${this.alergias.length ? `- Alergias: ${this.alergias.join(', ')}` : ''}
- Objetivo principal: ${this.objetivos.principal}${this.objetivos.detalles ? ` (${this.objetivos.detalles})` : ''}
- Calorías diarias objetivo: ${Math.round(this.metricas.caloriasObjetivo)} kcal
${this.restriccionesMedicas.length ? `- Restricciones médicas: ${this.restriccionesMedicas.map(r => r.condicion).join(', ')}` : ''}
- Preferencias de entrenamiento: ${this.preferenciaEntrenamiento.map(p => `${p.tipo} (${p.nivel})`).join(', ')}`;
};

const UserProfile = mongoose.models.UserProfile || mongoose.model('UserProfile', userProfileSchema);
export default UserProfile; 