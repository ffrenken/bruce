import { verify } from '@node-rs/argon2';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import * as auth from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { schema } from './schema.js';

export const load: PageServerLoad = async ({ locals }) => {
    if (locals.user) {
        return redirect(303, '/');
    }
    const form = await superValidate(zod(schema));
    return { form };
};

export const actions = {
    default: async ({ request, cookies }) => {
        const form = await superValidate(request, zod(schema));

        if (!form.valid) {
            return fail(400, { form });
        }

        const queryset = await db
            .select()
            .from(table.user)
            .where(eq(table.user.username, form.data.username));

        if (queryset.length === 0) {
            return fail(400, { form });
        }

        const [user] = queryset;

        const isPasswordCorrect = await verify(user.passwordHash, form.data.password, {
            memoryCost: 19456,
            timeCost: 2,
            outputLen: 32,
            parallelism: 1
        });

        if (!isPasswordCorrect) {
            return fail(400, { form });
        }

        const sessionToken = auth.generateSessionToken();
        const session = await auth.createSession(sessionToken, user.id);
        auth.setSessionTokenCookie(cookies, sessionToken, session.expiresAt);

        return redirect(302, '/');
    }
} satisfies Actions;
