/** Compatibility shim: the app's auth lives in src/lib/session.ts. */
export { getSessionUser, SESSION_COOKIE } from "./session";
export type { SessionUser } from "./session";
