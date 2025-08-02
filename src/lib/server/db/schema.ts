import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull()
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export const experiment = sqliteTable('experiment', {
	name: text('name').primaryKey(),
	instructions: text('instructions').notNull()
});

export const document = sqliteTable('document', {
	id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	content: text('content', { mode: 'json' })
		.notNull()
		.$type<{ id: string; text: string; metadata: string }[]>(),
	experiment: text('experiment')
		.notNull()
		.references(() => experiment.name, { onDelete: 'cascade' })
});

export type Document = typeof document.$inferSelect;

export type Experiment = typeof experiment.$inferSelect;

export const annotation = sqliteTable('annotation', {
	id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
	documentId: integer('document_id', { mode: 'number' })
		.notNull()
		.references(() => document.id, { onDelete: 'cascade' }),
	segmentation: text('segmentation', { mode: 'json' }).notNull().$type<boolean[]>(),
	labels: text('labels', { mode: 'json' }).notNull().$type<(string | undefined)[]>(),
	category: text('category')
});

export type Annotation = typeof annotation.$inferSelect;
