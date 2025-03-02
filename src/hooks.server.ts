import type { Handle } from '@sveltejs/kit';
import * as auth from '$lib/server/auth.js';
import { addMetadataToReports } from '$lib/server/db/migrations/add_metadata_to_reports';

// Run migrations when the server starts
(async () => {
	try {
		console.log('Running database migrations...');
		await addMetadataToReports();
		console.log('Database migrations completed.');
	} catch (error) {
		console.error('Error running migrations:', error);
	}
})();

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);
	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await auth.validateSessionToken(sessionToken);
	if (session) {
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
	} else {
		auth.deleteSessionTokenCookie(event);
	}

	event.locals.user = user;
	event.locals.session = session;

	return resolve(event);
};

export const handle: Handle = handleAuth;
