import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL environment variable is required');
}

export default defineConfig({
	schema: './src/lib/server/schema.ts',
	out: './drizzle',
	driver: 'pg',
	dbCredentials: {
		connectionString: process.env.DATABASE_URL,
	},
});
