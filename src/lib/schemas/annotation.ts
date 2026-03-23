import { z } from 'zod';

const undefinedIfEmpty = (arg: string | undefined) => (arg?.trim() ? arg : undefined);
const BoundaryEnum = z.enum(['soft', 'hard']).nullable();
export type BoundaryType = z.infer<typeof BoundaryEnum>;

export const schema = z
	.object({
		segmentation: z.array(BoundaryEnum).nonempty().default(['hard']),
		labels: z.array(z.string().optional().transform(undefinedIfEmpty)),
		category: z.string().optional().transform(undefinedIfEmpty),
		rts: z.array(z.number().positive()).nonempty().default([Infinity]),
		edits: z.array(
			z.object({
				type: z.enum(['undo', 'redo']),
				index: z.number().nonnegative(),
				rt: z.number().nonnegative(),
				boundary: BoundaryEnum
			})
		)
	})
	.strict()
	.required()
	.refine((arg) => arg.segmentation.length == arg.rts.length)
	.transform((arg, ctx) => {
		// pad labels to number of segments
		const segments = arg.segmentation.filter((arg) => arg !== null).length;
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

export type Schema = z.infer<typeof schema>;
