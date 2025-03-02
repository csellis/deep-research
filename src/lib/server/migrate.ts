import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { migrationClient } from './db';

const db = drizzle(migrationClient);

async function main() {
	console.log('Running migrations...');

	await migrate(db, {
		migrationsFolder: 'drizzle'
	});

	console.log('Migrations complete!');
	process.exit(0);
}

main().catch((err) => {
	console.error('Migration failed!', err);
	process.exit(1);
});
