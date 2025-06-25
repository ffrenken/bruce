export class DocumentError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'DocumentError';
	}
}

export function* parseDocument(name: string, text: string) {
	const entries = text
		.trim()
		.split(/\r?\n/g)
		.map((line) => line.split('\t'));

	if (entries.length < 2) {
		throw new DocumentError(`'${name}' contains no header and/or data`);
	}

	if (!entries.every((row) => row.length === 3)) {
		throw new DocumentError(`'${name}' uses invalid column format`);
	}

	const expected = ['id', 'text', 'metadata'];
	const [header, ...rest] = entries;
	if (!header.every((value, index) => value === expected[index])) {
		throw new DocumentError(`'${name}' has unexpected header ${header.join('/')}`);
	}

	for (const [id, text, metadata] of rest) {
		yield {
			id,
			text,
			metadata
		};
	}
}
