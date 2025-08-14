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
	id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	instructions: text('instructions').notNull(),
	history: integer('history')
});

export const document = sqliteTable('document', {
	id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	group: text('group'),
	content: text('content', { mode: 'json' })
		.notNull()
		.$type<{ id: string; text: string; metadata: string }[]>(),
	experimentId: integer('experiment_id', { mode: 'number' })
		.notNull()
		.references(() => experiment.id, { onDelete: 'cascade' }),
	isExample: integer({ mode: 'boolean' }).notNull()
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
	category: text('category'),
	rts: text('rts', { mode: 'json' }).notNull().$type<number[]>(),
	edits: text('edits', { mode: 'json' })
		.notNull()
		.$type<{ type: 'undo' | 'redo'; index: number; rt: number; isBoundary: boolean }[]>(),
	surveyId: integer('survey_id', { mode: 'number' }).references(() => survey.id, {
		onDelete: 'cascade'
	})
});

export type Annotation = typeof annotation.$inferSelect;

export const survey = sqliteTable('survey', {
	id: integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
	experimentId: integer('experiment_id', { mode: 'number' })
		.notNull()
		.references(() => experiment.id, { onDelete: 'cascade' }),
	age: integer('age').notNull(),
	gender: text('gender'),
	languages: text('languages').notNull(),
	background: text('background').notNull(),
	intuitiveness: text('intuitiveness').notNull(),
	ease: text('ease').notNull(),
	feedback: text('feedback'),
	valid: integer('valid', { mode: 'boolean' }).notNull()
});

export type Survey = typeof survey.$inferSelect;
