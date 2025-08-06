import { z } from 'zod';

export const schema = z
	.object({
		age: z
			.number()
			.nonnegative()
			.max(100)
			.default(undefined as unknown as number),
		gender: z.string().optional(),
		languages: z.string().nonempty(),
		background: z.string().nonempty(),
		intuitiveness: z.string().nonempty(),
		ease: z.string().nonempty(),
		feedback: z.string(),
		valid: z.boolean().default(undefined as unknown as boolean)
	})
	.strict()
	.required();
