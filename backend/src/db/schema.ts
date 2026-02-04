import { pgTable, text, timestamp, integer, uuid } from 'drizzle-orm/pg-core';

export const toilEvents = pgTable('toil_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  type: text('type', { enum: ['ADD', 'TAKE'] }).notNull(),
  minutes: integer('minutes').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  userId: text('user_id').notNull(),
});
