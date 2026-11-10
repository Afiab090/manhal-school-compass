/**
 * Database configuration — Al-Manhal School
 * ------------------------------------------------------------
 * The app currently runs fully on the device (browser storage) with
 * pre-loaded demo data, managed by src/lib/school/store.ts.
 *
 * To move to a shared cloud database:
 *   1. Create the tables using docs/schema.sql.
 *   2. Fill in the two values below (project URL + public "anon" key).
 *   3. Switch DATA_MODE to "cloud" and replace the store actions with
 *      database calls (each action in store.ts maps 1:1 to a table).
 *
 * The public key is safe to keep in code — it is protected by the
 * row-level security policies defined in schema.sql. Never paste a
 * service/secret key here.
 */

export type DataMode = "local" | "cloud";

export const DB_CONFIG = {
  DATA_MODE: "local" as DataMode,
  URL: "", // e.g. https://xxxxxxxx.supabase.co
  ANON_KEY: "", // public anon key
};

export const TABLES = {
  classes: "classes",
  students: "students",
  teachers: "teachers",
  installments: "installments",
  payments: "payments",
  announcements: "announcements",
  slots: "timetable_slots",
  homework: "homework",
  homeworkCompletion: "homework_completion",
  attendance: "attendance",
  events: "calendar_events",
  notifications: "notifications",
} as const;

export function isCloudConfigured() {
  return DB_CONFIG.DATA_MODE === "cloud" && DB_CONFIG.URL !== "" && DB_CONFIG.ANON_KEY !== "";
}
