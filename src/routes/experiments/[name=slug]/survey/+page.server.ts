import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { schema } from './schema.js';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { LibsqlError } from '@libsql/client';
import { and } from 'drizzle-orm';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, cookies, locals }) => {
	const experiments = await db
		.select()
		.from(table.experiment)
		.where(eq(table.experiment.name, params.name))
		.limit(1);

	if (experiments.length !== 1) {
		return error(404, { message: 'Experiment not found.' });
	}

	const [experiment] = experiments;

	const surveys = await db
		.select({ id: table.survey.id })
		.from(table.survey)
		.where(
			and(
				eq(table.survey.experimentId, experiment.id),
				eq(table.survey.participantId, locals.participantId)
			)
		)
		.limit(1);

	if (surveys.length > 0) {
		return redirect('/experiments', { type: 'error', message: 'Survey already taken.' }, cookies);
	}

	const form = await superValidate(zod(schema));
	return { form };
};

export const actions = {
	default: async ({ request, params, cookies, locals }) => {
		const form = await superValidate(request, zod(schema));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Invalid form data.' }, cookies);
			return fail(400, { form });
		}

		const [{ experimentId }] = await db
			.select({ experimentId: table.experiment.id })
			.from(table.experiment)
			.where(eq(table.experiment.name, params.name));

		try {
			await db
				.insert(table.survey)
				.values({ experimentId, participantId: locals.participantId, ...form.data });
		} catch (e) {
			if (e instanceof LibsqlError) {
				setFlash({ type: 'error', message: `Database error: ${e.message}` }, cookies);
			} else {
				setFlash({ type: 'error', message: `Unknown error: ${JSON.stringify(e)}` }, cookies);
			}
			return fail(400, { form });
		}

		return redirect('/experiments', { type: 'success', message: 'Survey saved.' }, cookies);
	}
} satisfies Actions;
