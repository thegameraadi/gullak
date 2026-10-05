import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
export const accounts = sqliteTable("gullak_accounts", {
  userId: text("user_id").primaryKey(),
  stateJson: text("state_json").notNull(),
  version: integer("version").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

export const manageOwner = sqliteTable("gullak_manage_owner", {
  id: integer("id").primaryKey(),
  userId: text("user_id").notNull(),
  boundAt: text("bound_at").notNull(),
});

export const analyticsVisitors = sqliteTable("gullak_analytics_visitors", {
  id: text("id").primaryKey(),
  firstSeen: text("first_seen").notNull(),
  lastSeen: text("last_seen").notNull(),
});

export const analyticsEvents = sqliteTable("gullak_analytics_events", {
  id: text("id").primaryKey(),
  visitorId: text("visitor_id").notNull(),
  sessionId: text("session_id").notNull(),
  name: text("name").notNull(),
  occurredAt: text("occurred_at").notNull(),
  mode: text("mode").notNull(),
  device: text("device").notNull(),
  os: text("os").notNull(),
  browser: text("browser").notNull(),
  standalone: integer("standalone").notNull(),
  source: text("source").notNull(),
  engine: text("engine").notNull(),
  pageLoadId: text("page_load_id"),
  trafficClass: text("traffic_class").notNull().default("unknown"),
  trafficSignal: text("traffic_signal").notNull().default("legacy"),
}, table => [
  index("idx_gullak_analytics_events_time").on(table.occurredAt),
  index("idx_gullak_analytics_events_visitor_time").on(table.visitorId, table.occurredAt),
  index("idx_gullak_analytics_events_page_load").on(table.pageLoadId),
]);

export const analyticsVisits = sqliteTable("gullak_analytics_visits", {
  id: text("id").primaryKey(),
  occurredAt: text("occurred_at").notNull(),
  page: text("page").notNull(),
  trafficClass: text("traffic_class").notNull(),
  trafficSignal: text("traffic_signal").notNull(),
}, table => [index("idx_gullak_analytics_visits_time").on(table.occurredAt)]);
