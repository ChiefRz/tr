import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Tolong masukkan MONGODB_URI di .env.local");
}

// Gunakan variabel global agar koneksi tidak dibuat ulang saat Next.js melakukan hot-reload
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectMongoDB = async () => {
  if (cached.conn) {
    return cached.conn; // Langsung gunakan koneksi yang sudah ada (SUPER CEPAT)
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("🔥 Terhubung ke MongoDB (Cached)");
      return mongoose;
    });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
};

export default connectMongoDB;