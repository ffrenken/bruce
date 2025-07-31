import { z } from 'zod';

export const schema = z
	.object({
		segmentation: z.array(z.boolean()).nonempty()
	})
	.strict()
	.required();
