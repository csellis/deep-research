import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { reports } from './schema';

// Load environment variables
dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// For migrations
export const migrationClient = postgres(DATABASE_URL, { max: 1 });

// For queries
const queryClient = postgres(DATABASE_URL);

// Create the database instance
export const db = drizzle(queryClient, {
  schema: { reports }
}); 