import { z } from 'zod';

const undefinedIfEmpty = (arg: string | undefined) => (arg?.trim() ? arg : undefined);

export const schema = z
	.object({
		segmentation: z.array(z.boolean()).nonempty(),
		labels: z.array(z.string().optional().transform(undefinedIfEmpty)),
		category: z.string().optional().transform(undefinedIfEmpty)
	})
	.strict()
	.required()
	.transform((arg, ctx) => {
		// pad labels to number of segments (+ 1 for implicit first)
		const segments = arg.segmentation.filter(Boolean).length + 1;
		if (arg.labels.length > segments) {
			ctx.addIssue({
				path: ['labels'],
				code: z.ZodIssueCode.custom,
				message: `Too many labels (${arg.labels.length} > ${segments})`
			});
		} else {
			const missing = Array(segments - arg.labels.length).fill(undefined);
			arg.labels.push(...missing); // append missing undefined
		}
		return arg;
	});
