import { integerregex } from '$lib/utils';
import type { ParamMatcher } from '@sveltejs/kit';

export const match = ((param: string): boolean => {
	return param.match(integerregex) !== null;
}) satisfies ParamMatcher;
