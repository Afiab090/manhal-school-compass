import { currentUser, useSchool } from "@/lib/school/store";

/** Signed-in user + full state. Only used under /app, whose layout guarantees a session. */
export function useMe() {
  const s = useSchool();
  const me = currentUser(s);
  if (!me) throw new Error("no session");
  return { s, me };
}
