import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const id = parseInt(params.id);
	const queryset = await db.select().from(table.document).where(eq(table.document.id, id));

	if (queryset.length === 0) {
		return error(404, 'Unknown document id.');
	}

	const [document] = queryset;

	return { document };
};
