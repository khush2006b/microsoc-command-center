// /config/db.js
import mongoose from 'mongoose';

const connectDB = async (uri) => {
  try {
    await mongoose.connect(uri);
    console.log("✅ Red Ranger's Database Connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    // Exit process with failure
    process.exit(1); 
  }
};

export default connectDB;