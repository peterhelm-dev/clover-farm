import { ForbiddenError } from "@shared/_core/errors";
import { eq } from "drizzle-orm";
import type { Request } from "express";
import { appSettings, betaInvites, type User } from "../../drizzle/schema";
import * as db from "../db";
import { getDb } from "../db";
import { getSupabaseAuthClient } from "./supabaseAdmin";

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

function getInviteCodeHeader(req: Request): string | undefined {
  const value = req.headers["x-invite-code"];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function deriveLoginMethod(user: {
  app_metadata?: { provider?: string | null } | null;
}): string | null {
  return user.app_metadata?.provider ?? null;
}

/**
 * Validates the Supabase-issued access token on the request, syncs the
 * corresponding row in our own `users` table, and returns it. Returns
 * `null` when there's no (or an invalid) session — callers treat that as
 * "not logged in", which is fine for public procedures.
 */
export async function authenticateRequest(req: Request): Promise<User | null> {
  const token = getBearerToken(req);
  if (!token) return null;

  const { data, error } = await getSupabaseAuthClient().auth.getUser(token);
  if (error || !data.user) return null;

  const supabaseUser = data.user;
  const openId = supabaseUser.id;
  const signedInAt = new Date();

  let user = await db.getUserByOpenId(openId);

  if (!user) {
    // New user — check invite-only mode before creating the local row.
    const dbConn = await getDb();
    const inviteCode = getInviteCodeHeader(req);

    if (dbConn) {
      const [settings] = await dbConn.select().from(appSettings).limit(1);
      if (settings?.inviteOnly === 1) {
        if (!inviteCode) {
          throw ForbiddenError("This app is invite-only. You need a valid invite code to sign up.");
        }
        const [invite] = await dbConn
          .select()
          .from(betaInvites)
          .where(eq(betaInvites.code, inviteCode));
        if (!invite || invite.redeemedBy || new Date(invite.expiresAt) < new Date()) {
          throw ForbiddenError("Invalid or expired invite code");
        }
      }
    }

    const name =
      (supabaseUser.user_metadata?.full_name as string | undefined) ??
      (supabaseUser.user_metadata?.name as string | undefined) ??
      null;

    await db.upsertUser({
      openId,
      name,
      email: supabaseUser.email ?? null,
      loginMethod: deriveLoginMethod(supabaseUser),
      lastSignedIn: signedInAt,
    });

    user = await db.getUserByOpenId(openId);

    if (user && dbConn && inviteCode) {
      await dbConn
        .update(betaInvites)
        .set({ redeemedBy: user.id, redeemedAt: signedInAt })
        .where(eq(betaInvites.code, inviteCode));
    }
  } else {
    await db.upsertUser({ openId, lastSignedIn: signedInAt });
    user = await db.getUserByOpenId(openId);
  }

  if (!user) throw ForbiddenError("Failed to sync user info");

  return user;
}
