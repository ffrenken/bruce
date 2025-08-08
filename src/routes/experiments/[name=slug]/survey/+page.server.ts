import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { schema } from './schema.js';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { LibsqlError } from '@libsql/client';
import { inArray, isNull } from 'drizzle-orm';
import { and } from 'drizzle-orm';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const experiments = await db
		.select()
		.from(table.experiment)
		.where(eq(table.experiment.name, params.name))
		.limit(1);

	if (experiments.length !== 1) {
		return error(404, { message: 'Experiment not found.' });
	}

	const [experiment] = experiments;

	const cookie = cookies.get(experiment.id.toString());
	const documentIds = JSON.parse(cookie ?? '[]');
	const annotations = await db
		.select()
		.from(table.annotation)
		.where(
			and(inArray(table.annotation.documentId, documentIds), isNull(table.annotation.surveyId))
		);

	if (annotations.length === 0) {
		return redirect('/experiments', { type: 'error', message: 'Survey already taken.' }, cookies);
	}

	const form = await superValidate(zod(schema));
	return { form };
};

export const actions = {
	default: async ({ request, params, cookies }) => {
		const form = await superValidate(request, zod(schema));

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Invalid form data.' }, cookies);
			return fail(400, { form });
		}

		const [{ experimentId }] = await db
			.select({ experimentId: table.experiment.id })
			.from(table.experiment)
			.where(eq(table.experiment.name, params.name));
		const cookie = cookies.get(experimentId.toString());
		const documentIds = JSON.parse(cookie ?? '[]');

		try {
			const [{ surveyId }] = await db
				.insert(table.survey)
				.values({ experimentId, ...form.data })
				.returning({ surveyId: table.survey.id });
			await db
				.update(table.annotation)
				.set({ surveyId })
				.where(inArray(table.annotation.documentId, documentIds));
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
