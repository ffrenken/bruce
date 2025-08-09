import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { error } from '@sveltejs/kit';
import { eq, inArray } from 'drizzle-orm';

export const GET = async ({ params, locals }) => {
	if (locals.user === null) {
		return error(403);
	}

	const documentIds = (
		await db
			.select({ id: table.document.id })
			.from(table.document)
			.innerJoin(table.experiment, eq(table.document.experimentId, table.experiment.id))
			.where(eq(table.experiment.name, params.name))
	).map((document) => document.id);

	const annotations = await db
		.select()
		.from(table.annotation)
		.where(inArray(table.annotation.documentId, documentIds));

	const surveyIds = annotations
		.map((annotation) => annotation.surveyId)
		.filter((surveyId) => surveyId !== null);

	const surveys = await db
		.selectDistinct()
		.from(table.survey)
		.where(inArray(table.survey.id, surveyIds));

	const data = { annotations, surveys };

	return new Response(JSON.stringify(data), {
		headers: {
			'Content-Type': 'application/json',
			'Content-Disposition': `attachment; filename=${params.name}.json`
		}
	});
};
