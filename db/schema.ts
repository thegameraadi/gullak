import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const accounts = sqliteTable("gullak_accounts", {
  userId: text("user_id").primaryKey(),
  stateJson: text("state_json").notNull(),
  version: integer("version").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});
