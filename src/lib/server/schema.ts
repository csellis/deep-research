import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const reports = pgTable('reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  topic: text('topic').notNull(),
  description: text('description').notNull(),
  content: text('content'),
  status: text('status').notNull().default('pending'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
}); 