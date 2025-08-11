import chroma from 'chroma-js';
import { kmeans } from 'ml-kmeans';

export const slugregex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const integerregex = /^[1-9]\d*$/;

export function getPalette(values: string[], options: { seed: number }): Map<string, string> {
	const uniqueValues = new Set(values);
	const colors = getColors(uniqueValues.size, options);
	return new Map(Array.from(uniqueValues, (value, i) => [value, colors[i]]));
}

function getColors(n: number, options: { seed: number }): string[] {
	// generate candidates in colorblind-friendly hcl space
	const candidates: number[][] = [];
	const step = 5;
	for (let h = 0; h <= 360; h += step) {
		for (let c = 40; c <= 70; c += step) {
			for (let l = 15; l <= 85; l += step) {
				const lab = chroma.hcl(h, c, l).lab();
				if (!lab.some((v) => isNaN(v))) {
					candidates.push(lab);
				}
			}
		}
	}
	const { centroids } = kmeans(candidates, n, options);
	return centroids.map(([l, a, b]) => chroma.lab(l, a, b).hex());
}
