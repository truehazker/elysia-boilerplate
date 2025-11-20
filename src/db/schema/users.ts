import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-typebox';
import { t } from 'elysia';

// Users table definition
export const users = pgTable('users', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => Bun.randomUUIDv7()),
  name: varchar('name', { length: 255 }).notNull(),
  surname: varchar('surname', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Field validation refinements for Elysia
const fieldRefinements = {
  name: t.String({ minLength: 1, maxLength: 255, examples: ['User Name'] }),
  surname: t.String({
    minLength: 1,
    maxLength: 255,
    examples: ['User Surname'],
  }),
  email: t.String({ minLength: 1, maxLength: 255, examples: ['User Email'] }),
};

// Drizzle-TypeBox schemas (declare variables to avoid infinite type instantiation)
const _userCreate = createInsertSchema(users, fieldRefinements);
const _userSelect = createSelectSchema(users, fieldRefinements);
const _userUpdate = createUpdateSchema(users, fieldRefinements);

export const userCreate = _userCreate;
export const userSelect = _userSelect;
export const userUpdate = _userUpdate;
