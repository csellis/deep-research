import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';

export async function addMetadataToReports() {
	try {
		console.log('Running migration: Adding metadata column to reports table');

		// Check if the column already exists
		const checkColumnExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'reports' AND column_name = 'metadata'
    `);

		// Check if any rows were returned
		const hasColumn = checkColumnExists.length > 0;

		if (!hasColumn) {
			// Add the metadata column
			await db.execute(sql`
        ALTER TABLE reports
        ADD COLUMN metadata TEXT
      `);
			console.log('Migration successful: Added metadata column to reports table');
		} else {
			console.log('Migration skipped: metadata column already exists in reports table');
		}

		return { success: true };
	} catch (error) {
		console.error('Migration failed:', error);
		return { success: false, error };
	}
}
