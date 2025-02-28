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

// Add method to add a message to the conversation
conversationSchema.methods.addMessage = function(role, content) {
  this.messages.push({ role, content });
  this.lastUpdated = new Date();
  return this.save();
};

// Create the model
const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

export default Conversation; 