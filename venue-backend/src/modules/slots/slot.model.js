const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
    // Polymorphic parent reference
    parentType: {
      type: String,
      required: true,
      enum: ['Event', 'Movie']
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'parentType'
    },
    // Keep these for backward compatibility if needed, or remove. 
    // Plan suggests refactoring. I will keep them but make them optional and derivative if possible, 
    // or just rely on parentId/parentType. 
    // Let's rely on parentId/parentType for the new system.

    capacity: {
      type: Number,
      required: true,
      min: 1
    },
    availableSeats: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (v) {
          return v <= this.capacity;
        },
        message: 'Available seats cannot exceed capacity'
      }
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    // remainingCapacity removed in favor of availableSeats
    status: {
      type: String,
      enum: ['AVAILABLE', 'FULL'],
      default: 'AVAILABLE',
    },
  },
  { timestamps: true }
);

// Validation: Ensure slot date is in the future
// Validation: Ensure slot date is in the future
slotSchema.pre('save', async function () {
  // Only validate date for new slots
  if (this.isNew) {
    const slotDate = new Date(this.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    if (slotDate < today) {
      throw new Error('Slot date must be in the future or today');
    }
  }
});

// Indexes
slotSchema.index({ parentId: 1, parentType: 1 }); // Fetch slots for parent
slotSchema.index({ date: 1, startTime: 1 }); // Sorting/Filtering
slotSchema.index({ availableSeats: 1 }); // Availability check

module.exports = mongoose.model('Slot', slotSchema);
