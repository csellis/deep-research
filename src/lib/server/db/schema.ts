import { pgTable, serial, text, integer, timestamp, uuid } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	age: integer('age'),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull()
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

export const reports = pgTable('reports', {
	id: uuid('id').defaultRandom().primaryKey(),
	topic: text('topic').notNull(),
	description: text('description'),
	metadata: text('metadata'),
	content: text('content'),
	status: text('status').default('pending'),
	created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
	updated_at: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow()
});

export const sources = pgTable('sources', {
	id: uuid('id').defaultRandom().primaryKey(),
	reportId: uuid('report_id')
		.notNull()
		.references(() => reports.id, { onDelete: 'cascade' }),
	url: text('url').notNull(),
	title: text('title').notNull(),
	snippet: text('snippet').notNull(),
	content: text('content'),
	created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow()
});

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Source = typeof sources.$inferSelect;
