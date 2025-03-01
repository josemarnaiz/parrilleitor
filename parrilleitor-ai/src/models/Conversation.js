import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'error'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  userEmail: {
    type: String,
    required: true
  },
  messages: [messageSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create compound index for efficient queries
conversationSchema.index({ userId: 1, lastUpdated: -1 });

// Método optimizado para añadir un mensaje con timeout
conversationSchema.methods.addMessage = async function(role, content) {
  this.messages.push({ role, content });
  this.lastUpdated = new Date();
  
  try {
    // Establecer un timeout para la operación de guardado
    const savePromise = this.save();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout al guardar mensaje')), 8000);
    });
    
    // Usar Promise.race para implementar el timeout
    return await Promise.race([savePromise, timeoutPromise]);
  } catch (error) {
    console.warn('Error al guardar mensaje en conversación:', error.message);
    // Devolver this para permitir encadenamiento incluso si falla el guardado
    return this;
  }
};

// Método para añadir múltiples mensajes a la vez (más eficiente)
conversationSchema.methods.addMessages = async function(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return this;
  }
  
  // Añadir todos los mensajes al array
  messages.forEach(msg => {
    if (msg.role && msg.content) {
      this.messages.push({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || new Date()
      });
    }
  });
  
  this.lastUpdated = new Date();
  
  try {
    // Establecer un timeout para la operación de guardado
    const savePromise = this.save();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout al guardar mensajes')), 8000);
    });
    
    // Usar Promise.race para implementar el timeout
    return await Promise.race([savePromise, timeoutPromise]);
  } catch (error) {
    console.warn('Error al guardar mensajes en conversación:', error.message);
    // Devolver this para permitir encadenamiento incluso si falla el guardado
    return this;
  }
};

// Create the model
const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

export default Conversation; 