// /config/db.js
import mongoose from 'mongoose';

const connectDB = async (uri) => {
  try {
    // The main server file will pass the URI obtained from process.env
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ Red Ranger's Database Connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    // Exit process with failure
    process.exit(1); 
  }
};

export default connectDB;