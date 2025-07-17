import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { error } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';

export const load = async ({ params }) => {
	const queryset = await db
		.select()
		.from(table.experiment)
		.where(eq(table.experiment.name, params.name))
		.limit(1);

	if (queryset.length !== 1) {
		return error(404, { message: 'Experiment not found.' });
	}

	const [experiment] = queryset;

	// experiments must have at least one document
	const [document] = await db
		.select()
		.from(table.document)
		.where(eq(table.document.experiment, experiment.name))
		.orderBy(sql`RANDOM()`)
		.limit(1);

	return { experiment, document };
};
