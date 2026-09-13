import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const words = sqliteTable("words", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  word: text("word").notNull().unique(),
  phonetic: text("phonetic").notNull().default(""),
  partOfSpeech: text("part_of_speech").notNull().default("word"),
  definition: text("definition").notNull(),
  korean: text("korean").notNull().default(""),
  examples: text("examples").notNull().default("[]"),
  mastered: integer("mastered", { mode: "boolean" }).notNull().default(false),
});
