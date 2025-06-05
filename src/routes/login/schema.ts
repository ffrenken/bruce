import { z } from 'zod';

export const schema = z.object({
	username: z.string().nonempty(),
	password: z.string().min(8),
});
