import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ytmusic';
    console.log(`Connecting to MongoDB at: ${connUri}`);
    await mongoose.connect(connUri);
    console.log('MongoDB Connected Successfully.');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
