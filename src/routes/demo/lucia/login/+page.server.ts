import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { createSession } from '$lib/server/auth';
import { webcrypto } from 'node:crypto';

function generateUserId() {
	const buffer = new Uint8Array(15);
	webcrypto.getRandomValues(buffer);
	return Buffer.from(buffer).toString('hex');
}

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		return redirect(302, '/');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get('username');

		if (!username) {
			return fail(400, {
				message: 'Username is required'
			});
		}

		if (typeof username !== 'string') {
			return fail(400, {
				message: 'Invalid username'
			});
		}

		// Check if user exists
		const existingUser = await db.query.user.findFirst({
			where: eq(user.username, username)
		});

		if (!existingUser) {
			// Create new user
			const [newUser] = await db.insert(user).values({
				id: generateUserId(),
				username,
				passwordHash: '' // We're not using passwords in this simplified version
			}).returning();

			// Create session
			const session = await createSession(newUser.id);
			cookies.set('auth-session', session.id, {
				path: '/',
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				maxAge: 60 * 60 * 24 * 30 // 30 days
			});

			throw redirect(302, '/');
		}

		// Create session for existing user
		const session = await createSession(existingUser.id);
		cookies.set('auth-session', session.id, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});

		throw redirect(302, '/');
	}
};

function validateUsername(username: unknown): username is string {
	return (
		typeof username === 'string' &&
		username.length >= 3 &&
		username.length <= 31 &&
		/^[a-z0-9_-]+$/.test(username)
	);
}

function validatePassword(password: unknown): password is string {
	return typeof password === 'string' && password.length >= 6 && password.length <= 255;
}
