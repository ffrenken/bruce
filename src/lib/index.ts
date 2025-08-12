export class DocumentError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'DocumentError';
	}
}

export async function parseDocument(document: File) {
	const text = (await document.text()).trim();
	const name = document.name.substring(0, document.name.lastIndexOf('.')) || document.name;

	const lines = text.split(/\r?\n/g);

	const commentOrHeader = lines.shift();
	if (commentOrHeader === undefined) {
		throw new DocumentError(`${name}: empty document`);
	}

	let group: string | null = null;
	if (commentOrHeader.startsWith('#')) {
		const match = commentOrHeader?.match(/^#\s*group\s*:\s*(?<group>[\w-]+)\s*$/i);
		if (match === null || match.groups === undefined) {
			throw new DocumentError(`${name}: malformed group comment`);
		} else {
			({ group } = match.groups);
		}
	} else {
		lines.unshift(commentOrHeader);
	}

	const table = lines.map((line) => line.split('\t').map((field) => field.trim()));
	if (!table.every((row) => row.length === 3)) {
		throw new DocumentError(`${name}: inconsistent column format`);
	}

	const expected = ['id', 'text', 'metadata'];
	const header = table.shift();
	if (header === undefined) {
		throw new DocumentError(`${name}: missing header`);
	} else if (!header.every((value, index) => value === expected[index])) {
		throw new DocumentError(`${name}: unexpected header`);
	}

	const content = table.map(([id, text, metadata]) => ({ id, text, metadata }));
	return { name, group, content };
}
