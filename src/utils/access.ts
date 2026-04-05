import type { User } from "@supabase/supabase-js";
import type { Tables } from "../types";
import { isUserProvinceName } from "../constants/provinces";

type Profile = Tables<"profiles">;
export type UserRole = Profile["role"];
export const ALL_PROVINCES_SCOPE = "__all_provinces__";

const USER_ROLES: UserRole[] = ["admin", "editor", "reader"];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

export function getUserRole(
  profile?: Pick<Profile, "role"> | null,
  user?: User | null,
): UserRole {
  if (profile?.role && isUserRole(profile.role)) {
    return profile.role;
  }

  const metadataRole = user?.user_metadata?.role;
  if (isUserRole(metadataRole)) {
    return metadataRole;
  }

  return user ? "editor" : "reader";
}

export function isApprovedProfile(profile?: Pick<Profile, "approved"> | null) {
  return profile?.approved !== false;
}

export function getUserProvince(
  profile?: Pick<Profile, "province"> | null,
  user?: User | null,
) {
  const province = profile?.province ?? user?.user_metadata?.province;
  return typeof province === "string" && isUserProvinceName(province)
    ? province
    : null;
}

export function isGeneralAdmin(
  profile?: Pick<Profile, "role"> | null,
  user?: User | null,
) {
  return getUserRole(profile, user) === "admin";
}

export function canManageUnits(
  profile?: Pick<Profile, "role" | "approved"> | null,
  user?: User | null,
) {
  if (!isApprovedProfile(profile)) {
    return false;
  }

  const role = getUserRole(profile, user);
  return role === "admin" || role === "editor";
}

export function canManageUsers(
  profile?: Pick<Profile, "role" | "approved"> | null,
  user?: User | null,
) {
  if (!isApprovedProfile(profile)) {
    return false;
  }

  return isGeneralAdmin(profile, user);
}
