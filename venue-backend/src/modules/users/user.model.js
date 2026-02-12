const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'itemType'
  },
  itemType: {
    type: String,
    required: true,
    enum: ['Event', 'Movie']
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'ORGANIZER', 'USER'],
      default: 'USER',
    },
    favorites: [favoriteSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
