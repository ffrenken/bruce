import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { error } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import { redirect } from 'sveltekit-flash-message/server';

export const load = async ({ params, cookies }) => {
	const queryset = await db
		.select()
		.from(table.experiment)
		.where(eq(table.experiment.name, params.name))
		.limit(1);

	if (queryset.length !== 1) {
		return error(404, { message: 'Experiment not found.' });
	}

	const [experiment] = queryset;

	const cookie = cookies.get(experiment.id.toString());
	const documentIds = JSON.parse(cookie ?? '[]');

	// TODO: allow continuing experiment if more documents available
	if (documentIds.length > 0) {
		return redirect(
			'/experiments',
			{ type: 'error', message: 'Experiment already completed.' },
			cookies
		);
	}

	// experiments must have at least one document
	const [document] = await db
		.select()
		.from(table.document)
		.where(eq(table.document.experimentId, experiment.id))
		.orderBy(sql`RANDOM()`)
		.limit(1);

	return { experiment, document };
};
