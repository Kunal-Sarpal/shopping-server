import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from server directory
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '.env') });

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fashion_erp';
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`\n❌ MongoDB Connection Error: ${error.message}`);
    if (error.message.includes('Could not connect to any servers') || error.message.includes('whitelisted')) {
      console.error(`
👉 ACTION REQUIRED: MongoDB Atlas Access Denied
1. Go to your MongoDB Atlas dashboard: https://cloud.mongodb.com
2. Select your project & cluster.
3. In the left sidebar, click "Network Access" under Security.
4. Click "+ Add IP Address".
5. Click "Add Current IP Address" (or "Allow Access from Anywhere" - 0.0.0.0/0 for dev).
6. Click "Confirm" and wait ~1 minute for changes to take effect.
`);
    }
    process.exit(1);
  }
};

export default connectDB;
