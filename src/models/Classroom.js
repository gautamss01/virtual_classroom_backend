const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['NOT_STARTED', 'ONGOING', 'ENDED'],
    default: 'NOT_STARTED'
  },
  events: [
    {
      type: {
        type: String,
        enum: ['ENTER', 'EXIT', 'START_CLASS', 'END_CLASS'],
        required: true
      },
      userId: String,
      role: {
        type: String,
        enum: ['STUDENT', 'TEACHER'],
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Classroom', classroomSchema); 