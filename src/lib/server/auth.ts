import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { session, user } from '$lib/server/db/schema';
import { webcrypto } from 'node:crypto';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = 'auth-session';

export async function generateSessionToken() {
  const buffer = new Uint8Array(32);
  webcrypto.getRandomValues(buffer);
  const hashBuffer = await webcrypto.subtle.digest('SHA-256', buffer);
  return Buffer.from(new Uint8Array(hashBuffer)).toString('hex');
}

export async function createSession(userId: string) {
  const sessionId = await generateSessionToken();

  const newSession = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + DAY_IN_MS * 30)
  };
  await db.insert(session).values(newSession);
  return newSession;
}

export async function getSession(sessionId: string) {
  const result = await db
    .select({
      user: { id: user.id, username: user.username },
      session: session
    })
    .from(session)
    .innerJoin(user, eq(session.userId, user.id))
    .where(eq(session.id, sessionId))
    .limit(1);

  if (!result || !result[0]) {
    return { session: null, user: null };
  }

  const { session: foundSession, user: foundUser } = result[0];

  const sessionExpired = Date.now() >= foundSession.expiresAt.getTime();
  if (sessionExpired) {
    await db.delete(session).where(eq(session.id, foundSession.id));
    return { session: null, user: null };
  }

  // Extend session expiry if it's close to expiring
  const sessionNearingExpiry =
    Date.now() + DAY_IN_MS >= foundSession.expiresAt.getTime();
  if (sessionNearingExpiry) {
    foundSession.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
    await db
      .update(session)
      .set({ expiresAt: foundSession.expiresAt })
      .where(eq(session.id, foundSession.id));
  }

  return { session: foundSession, user: foundUser };
}

export async function invalidateSession(sessionId: string) {
  await db.delete(session).where(eq(session.id, sessionId));
}
