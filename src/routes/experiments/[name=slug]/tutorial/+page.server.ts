import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { schema } from '$lib/schemas/annotation';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const form = await superValidate(zod(schema));

	const experimentset = await db
		.select()
		.from(table.experiment)
		.where(eq(table.experiment.name, params.name))
		.limit(1);

	if (experimentset.length !== 1) {
		return error(404, { message: 'Experiment not found.' });
	}

	const [experiment] = experimentset;

	const documentset = await db
		.select()
		.from(table.document)
		.where(and(eq(table.document.experimentId, experiment.id), eq(table.document.isExample, true)));

	if (documentset.length === 0) {
		return error(404, { message: 'Example document not found.' });
	}

	const [document] = documentset;

	return { form, document, experiment };
};
