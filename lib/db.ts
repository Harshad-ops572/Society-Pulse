import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === '') {
    // If MONGODB_URI is not set, log friendly message once and return null.
    // The model store will fallback to persistent local store so the app works seamlessly!
    if (process.env.NODE_ENV !== 'production' && !global.__mongodb_warned) {
      console.warn(
        '⚠️ MONGODB_URI not set. Using high-performance memory/local persistence fallback. To use MongoDB Atlas, set MONGODB_URI in .env.local.'
      );
      global.__mongodb_warned = true;
    }
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log('✅ Connected to MongoDB Atlas');
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ MongoDB connection error:', e);
    // Return null on connection error so fallback store keeps application running
    return null;
  }

  return cached.conn;
}

declare global {
  // eslint-disable-next-line no-var
  var __mongodb_warned: boolean | undefined;
}
