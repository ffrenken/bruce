import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { error } from '@sveltejs/kit';
import { eq, sql, and, inArray, notInArray, isNull, or } from 'drizzle-orm';
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
	const documentIds: number[] = JSON.parse(cookie ?? '[]');

	const groups = (
		await db
			.select({ group: table.document.group })
			.from(table.document)
			.where(inArray(table.document.id, documentIds))
	)
		.map(({ group }) => group)
		.filter((group) => group !== null);

	const documents = await db
		.select()
		.from(table.document)
		.where(
			and(
				eq(table.document.experimentId, experiment.id),
				notInArray(table.document.id, documentIds),
				eq(table.document.isExample, false),
				or(isNull(table.document.group), notInArray(table.document.group, groups))
			)
		)
		.orderBy(
			sql`(SELECT COUNT(*) FROM ${table.annotation} WHERE ${table.annotation.documentId} = ${table.document.id})`,
			sql`RANDOM()`
		)
		.limit(1);

	if (documents.length === 0) {
		return redirect(
			`/experiments/${experiment.name}/survey`,
			{ type: 'error', message: 'No more documents available. Redirecting to survey.' },
			cookies
		);
	}

	const [document] = documents;
	return { experiment, document };
};
