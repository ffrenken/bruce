import { z } from 'zod';

export const schema = z.object({
	username: z.string().nonempty().min(3).max(31),
	password: z.string().nonempty().min(3).max(255)
});
