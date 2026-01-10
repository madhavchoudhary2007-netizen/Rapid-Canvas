import { z } from "zod";

// Pin types
export type PinType = "text" | "image" | "list";

// Position on canvas
export const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export type Position = z.infer<typeof positionSchema>;

// Size
export const sizeSchema = z.object({
  width: z.number(),
  height: z.number(),
});

export type Size = z.infer<typeof sizeSchema>;

// List item
export const listItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),
});

export type ListItem = z.infer<typeof listItemSchema>;

// Pin color tags
export const pinColors = ["default", "red", "orange", "yellow", "green", "blue", "purple", "pink"] as const;
export type PinColor = typeof pinColors[number];

// Base pin
export const pinSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "image", "list"]),
  position: positionSchema,
  size: sizeSchema,
  zIndex: z.number(),
  color: z.enum(pinColors).default("default"),
  tags: z.array(z.string()).default([]),
  // Text pin
  title: z.string().optional(),
  content: z.string().optional(),
  // Image pin
  imageUrl: z.string().optional(),
  imageMinWidth: z.number().optional(),
  imageMinHeight: z.number().optional(),
  // List pin
  listItems: z.array(listItemSchema).optional(),
});

export type Pin = z.infer<typeof pinSchema>;

// Canvas viewport
export const viewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number(),
});

export type Viewport = z.infer<typeof viewportSchema>;

// Board state
export const boardStateSchema = z.object({
  pins: z.array(pinSchema),
  viewport: viewportSchema,
  nextZIndex: z.number(),
});

export type BoardState = z.infer<typeof boardStateSchema>;

// Snapshot
export const snapshotSchema = z.object({
  id: z.string(),
  name: z.string(),
  timestamp: z.number(),
  state: boardStateSchema,
  thumbnail: z.string().optional(),
});

export type Snapshot = z.infer<typeof snapshotSchema>;

// Action types for undo/redo
export type ActionType = 
  | "CREATE_PIN"
  | "DELETE_PIN"
  | "MOVE_PIN"
  | "RESIZE_PIN"
  | "UPDATE_PIN"
  | "REORDER_PINS";

export const historyEntrySchema = z.object({
  id: z.string(),
  type: z.string(),
  timestamp: z.number(),
  previousState: boardStateSchema,
  nextState: boardStateSchema,
});

export type HistoryEntry = z.infer<typeof historyEntrySchema>;

// App state for localStorage
export const appStateSchema = z.object({
  board: boardStateSchema,
  snapshots: z.array(snapshotSchema),
});

export type AppState = z.infer<typeof appStateSchema>;

// Insert schemas
export const insertPinSchema = pinSchema.omit({ id: true, zIndex: true });
export type InsertPin = z.infer<typeof insertPinSchema>;

export const insertSnapshotSchema = snapshotSchema.omit({ id: true, timestamp: true });
export type InsertSnapshot = z.infer<typeof insertSnapshotSchema>;

// Keep existing user schema for compatibility
import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
