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
		name: name
	})
	.required()
	.strict();
