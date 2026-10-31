import { eq, and, inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../db/schema.js";
import { contacts, userSettings, UserSettings } from "../db/schema.js";
import type { PrivacyAudience, UserProfile, UserSettingsData } from "@chat-me/shared";

export async function canViewerAccess(
  db: NodePgDatabase<typeof schema>,
  ownerId: string,
  viewerId: string,
  audience: PrivacyAudience
): Promise<boolean> {
  if (ownerId === viewerId) return true;
  if (audience === "all") return true;
  if (audience === "none") return false;

  // Unidirectional evaluation: ownerId must have viewerId in contacts
  const contactRow = await db
    .select({ userId: contacts.userId })
    .from(contacts)
    .where(and(eq(contacts.userId, ownerId), eq(contacts.contactUserId, viewerId)))
    .limit(1);

  return contactRow.length > 0;
}

export async function canViewPresence(
  db: NodePgDatabase<typeof schema>,
  targetId: string,
  viewerId: string
): Promise<boolean> {
  if (targetId === viewerId) return true;

  const settingsRows = await db
    .select()
    .from(userSettings)
    .where(inArray(userSettings.userId, [targetId, viewerId]));

  const targetSettings = settingsRows.find((s) => s.userId === targetId);
  const viewerSettings = settingsRows.find((s) => s.userId === viewerId);

  const targetAudience: PrivacyAudience =
    (targetSettings?.privacyLastSeen as PrivacyAudience) || "all";
  const viewerAudience: PrivacyAudience =
    (viewerSettings?.privacyLastSeen as PrivacyAudience) || "all";

  // Target must permit viewer
  const targetAllowsViewer = await canViewerAccess(db, targetId, viewerId, targetAudience);
  if (!targetAllowsViewer) return false;

  // Reciprocity: Viewer must permit target
  const viewerAllowsTarget = await canViewerAccess(db, viewerId, targetId, viewerAudience);
  return viewerAllowsTarget;
}

export async function sanitizeUserProfiles(
  db: NodePgDatabase<typeof schema>,
  targetUsers: UserProfile[],
  viewerId: string
): Promise<UserProfile[]> {
  if (targetUsers.length === 0) return [];

  const otherUserIds = targetUsers
    .filter((u) => u.id !== viewerId)
    .map((u) => u.id);

  if (otherUserIds.length === 0) {
    return targetUsers.map((u) => ({ ...u }));
  }

  // Batch query settings for target users
  const settingsRows = await db
    .select()
    .from(userSettings)
    .where(inArray(userSettings.userId, otherUserIds));
  const settingsMap = new Map<string, UserSettings>(
    settingsRows.map((s) => [s.userId, s])
  );

  // Batch query unidirectional contact relationships: which target users have viewerId in their contacts?
  const contactRows = await db
    .select({ userId: contacts.userId })
    .from(contacts)
    .where(
      and(
        inArray(contacts.userId, otherUserIds),
        eq(contacts.contactUserId, viewerId)
      )
    );
  const contactsSet = new Set<string>(contactRows.map((c) => c.userId));

  return targetUsers.map((user) => {
    if (user.id === viewerId) {
      return { ...user };
    }

    const userSetting = settingsMap.get(user.id);
    const pictureAudience: PrivacyAudience =
      (userSetting?.privacyPicture as PrivacyAudience) || "all";
    const bioAudience: PrivacyAudience =
      (userSetting?.privacyBio as PrivacyAudience) || "all";

    const isContact = contactsSet.has(user.id);
    const canSeePicture =
      pictureAudience === "all" || (pictureAudience === "contacts" && isContact);
    const canSeeBio =
      bioAudience === "all" || (bioAudience === "contacts" && isContact);

    return {
      ...user,
      pictureUrl: canSeePicture ? user.pictureUrl : "",
      bio: canSeeBio ? user.bio : "",
    };
  });
}

export async function sanitizeUserProfile(
  db: NodePgDatabase<typeof schema>,
  targetUser: UserProfile,
  viewerId: string,
  settings?: UserSettings | UserSettingsData | null
): Promise<UserProfile> {
  if (targetUser.id === viewerId) {
    return { ...targetUser };
  }

  if (settings) {
    const pictureAudience: PrivacyAudience =
      (settings.privacyPicture as PrivacyAudience) || "all";
    const bioAudience: PrivacyAudience =
      (settings.privacyBio as PrivacyAudience) || "all";

    const [canSeePicture, canSeeBio] = await Promise.all([
      canViewerAccess(db, targetUser.id, viewerId, pictureAudience),
      canViewerAccess(db, targetUser.id, viewerId, bioAudience),
    ]);

    return {
      ...targetUser,
      pictureUrl: canSeePicture ? targetUser.pictureUrl : "",
      bio: canSeeBio ? targetUser.bio : "",
    };
  }

  const [sanitized] = await sanitizeUserProfiles(db, [targetUser], viewerId);
  return sanitized;
}

export async function canAddToGroup(
  db: NodePgDatabase<typeof schema>,
  targetUserId: string,
  actorId: string
): Promise<boolean> {
  if (targetUserId === actorId) return true;

  const rows = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, targetUserId))
    .limit(1);

  const audience: PrivacyAudience = (rows[0]?.privacyGroups as PrivacyAudience) || "all";
  return canViewerAccess(db, targetUserId, actorId, audience);
}

export async function checkGroupAdditionAllowed(
  db: NodePgDatabase<typeof schema>,
  targetUserIds: string[],
  actorId: string
): Promise<{ allowed: boolean; disallowedUserIds: string[] }> {
  const disallowedUserIds: string[] = [];

  for (const uid of targetUserIds) {
    if (uid === actorId) continue;
    const allowed = await canAddToGroup(db, uid, actorId);
    if (!allowed) {
      disallowedUserIds.push(uid);
    }
  }

  return {
    allowed: disallowedUserIds.length === 0,
    disallowedUserIds,
  };
}

export async function assertGroupAdditionAllowed(
  db: NodePgDatabase<typeof schema>,
  targetUserIds: string[],
  actorId: string
): Promise<{ allowed: true } | { allowed: false; error: string }> {
  const result = await checkGroupAdditionAllowed(db, targetUserIds, actorId);
  if (!result.allowed) {
    return {
      allowed: false,
      error: "Forbidden: One or more users do not allow group invitations",
    };
  }
  return { allowed: true };
}
