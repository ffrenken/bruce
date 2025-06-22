import { slugregex } from '$lib/utils';
import type { ParamMatcher } from '@sveltejs/kit';

export const match = ((param: string): boolean => {
	return param.match(slugregex) !== null;
}) satisfies ParamMatcher;
