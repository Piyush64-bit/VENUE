const mongoose = require('mongoose');

const connectDB = async (retries = 5) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected successfully');

    // Connection event listeners
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting reconnect...');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

  } catch (error) {
    console.error('MongoDB connection error:', error.message);

    if (retries > 0) {
      console.log(`Retrying connection... (${retries} attempts left)`);
      await new Promise(res => setTimeout(res, 5000));
      return connectDB(retries - 1);
    }

    console.error('Failed to connect to MongoDB after multiple attempts');
    process.exit(1);
  }
};

module.exports = connectDB;
