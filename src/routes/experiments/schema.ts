import { z } from 'zod';
import { slugregex } from '$lib/utils';

const name = z.string().nonempty().regex(slugregex, 'String must be a valid slug');

export const deletion = z
	.object({
		name: name
	})
	.required()
	.strict();

export const creation = z
	.object({
		name: name,
		instructions: z.string().nonempty(),
		history: z.number().nonnegative().nullable(),
		documents: z
			.instanceof(File, { message: 'Please upload a file.' })
			.refine((f) => f.size < 100_000, 'Max 100 kB upload size.')
			.array()
			.min(1)
	})
	.required()
	.strict();
