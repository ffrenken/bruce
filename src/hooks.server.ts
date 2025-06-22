import { error, type Handle, type ServerInit } from '@sveltejs/kit';
import * as auth from '$lib/server/auth.js';
import * as table from '$lib/server/db/schema.js';
import { db } from '$lib/server/db';
import { env } from '$env/dynamic/private';
import { hash } from '@node-rs/argon2';
import { sql } from 'drizzle-orm';

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);

	if (sessionToken === undefined) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await auth.validateSessionToken(sessionToken);

	if (session === null) {
		auth.deleteSessionTokenCookie(event.cookies);
	} else {
		auth.setSessionTokenCookie(event.cookies, sessionToken, session.expiresAt);
	}

	event.locals.user = user;
	event.locals.session = session;
	return resolve(event);
};

export const handle: Handle = handleAuth;

export const init: ServerInit = async () => {
	// create admin user if it does not exist
	if (env.ADMIN_USERNAME.length === 0) {
		return error(500, { message: 'Admin username may not be empty.' });
	}

	const query = sql`
	select exists (select 1 from ${table.user} where
	${table.user.username} = ${env.ADMIN_USERNAME})
	as hasAdminUser
	`;

	if ((await db.get<{ hasAdminUser: boolean }>(query)).hasAdminUser) {
		return;
	}

	if (env.ADMIN_PASSWORD.length < 8) {
		return error(500, { message: 'Admin password must be at least 8 characters.' });
	}

	const userId = auth.generateUserId();
	const passwordHash = await hash(env.ADMIN_PASSWORD, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});

	await db.insert(table.user).values({ id: userId, username: env.ADMIN_USERNAME, passwordHash });
};
