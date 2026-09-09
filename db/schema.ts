import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core';
export const classrooms = sqliteTable('ar_classrooms', {
  code: text('code').primaryKey(), owner: text('owner').notNull(), phase: text('phase').notNull().default('making'), graphKey: text('graph_key'), createdAt: text('created_at').notNull(),
});
export const members = sqliteTable('ar_members', {
  id: text('id').primaryKey(), code: text('code').notNull().references(() => classrooms.code), tokenHash: text('token_hash').notNull().unique(), name: text('name').notNull(), group: integer('group_no').notNull(), canEdit: integer('can_edit').notNull().default(0), createdAt: text('created_at').notNull(),
}, t => [index('ar_members_class_idx').on(t.code)]);
export const works = sqliteTable('ar_works', {
  code: text('code').notNull().references(() => classrooms.code), group: integer('group_no').notNull(), heritageId: integer('heritage_id').notNull(), version: integer('version').notNull(), submitted: integer('submitted').notNull().default(0), objectKey: text('object_key').notNull(), questions: text('questions').notNull(), updatedBy: text('updated_by').notNull().references(() => members.id), updatedAt: text('updated_at').notNull(),
}, t => [primaryKey({ columns: [t.code, t.group] })]);
export const answers = sqliteTable('ar_answers', {
  memberId: text('member_id').primaryKey().references(() => members.id), code: text('code').notNull().references(() => classrooms.code), answers: text('answers').notNull(), score: integer('score').notNull(), total: integer('total').notNull(), role: text('role').notNull(), reflection: text('reflection').notNull(), createdAt: text('created_at').notNull(),
}, t => [index('ar_answers_class_idx').on(t.code)]);
