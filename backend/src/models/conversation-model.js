import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['private', 'group'],
    required: true
  },
  participants: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      joinedAt: { type: Date, default: Date.now },
      unreadCount: { type: Number, default: 0 },  
      unreadMessages: [
        {
          messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
          sendAt: { type: Date, default: null }
        }
      ]
    }
  ],
 friendId:{
    type: mongoose.Schema.Types.ObjectId,  
    ref: 'User',
     required: function() { 
      return this.type === 'private';
    }
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: function() {
      return this.type === 'group'; 
  }
},
  
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,  
    default: Date.now
  }
});
 const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;