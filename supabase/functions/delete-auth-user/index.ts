import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

type DeleteAuthUserRequest = {
  userId: string;
};

type StorageObjectRow = {
  bucket_id: string;
  name: string;
};

type ProfileRow = {
  id: string;
  province: string | null;
  role: "admin" | "editor" | "reader" | null;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.",
  );
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const parseAdminUserIds = () =>
  (Deno.env.get("ADMIN_USER_IDS") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

const parseManagedBuckets = () =>
  (Deno.env.get("USER_STORAGE_BUCKETS") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

async function deleteOwnedStorageObjects(
  userId: string,
  managedBuckets: string[],
) {
  const { data: ownedObjects, error: queryError } = await supabaseAdmin
    .from("objects", { schema: "storage" })
    .select("bucket_id, name")
    .eq("owner", userId);

  if (queryError) {
    throw new Error(`Failed to query storage objects: ${queryError.message}`);
  }

  const objects = (ownedObjects ?? []) as StorageObjectRow[];
  if (objects.length === 0) {
    return { deletedFiles: 0, skippedBuckets: [] as string[] };
  }

  const groupedByBucket = new Map<string, string[]>();
  for (const object of objects) {
    if (!managedBuckets.includes(object.bucket_id)) {
      continue;
    }

    const currentPaths = groupedByBucket.get(object.bucket_id) ?? [];
    currentPaths.push(object.name);
    groupedByBucket.set(object.bucket_id, currentPaths);
  }

  const skippedBuckets = [
    ...new Set(
      objects
        .map((object) => object.bucket_id)
        .filter((bucketId) => !managedBuckets.includes(bucketId)),
    ),
  ];

  let deletedFiles = 0;

  for (const [bucketId, paths] of groupedByBucket.entries()) {
    for (let index = 0; index < paths.length; index += 100) {
      const chunk = paths.slice(index, index + 100);
      const { error: removeError } = await supabaseAdmin.storage
        .from(bucketId)
        .remove(chunk);

      if (removeError) {
        throw new Error(
          `Failed to remove files from bucket "${bucketId}": ${removeError.message}`,
        );
      }

      deletedFiles += chunk.length;
    }
  }

  return { deletedFiles, skippedBuckets };
}

async function fetchProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, province, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load profile: ${error.message}`);
  }

  return (data ?? null) as ProfileRow | null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header." }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: caller },
      error: callerError,
    } = await supabaseAdmin.auth.getUser(token);

    if (callerError || !caller) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token." }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = (await request.json()) as DeleteAuthUserRequest;
    const userId = body.userId?.trim();

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (userId === caller.id) {
      return new Response(
        JSON.stringify({ error: "General administration cannot delete itself." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const [callerProfile, targetProfile] = await Promise.all([
      fetchProfile(caller.id),
      fetchProfile(userId),
    ]);

    if (!targetProfile) {
      return new Response(
        JSON.stringify({ error: "Target user profile was not found." }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const adminUserIds = parseAdminUserIds();
    const isBypassAdmin = adminUserIds.includes(caller.id);
    const canDeleteUser = callerProfile?.role === "admin";

    if (!isBypassAdmin && !canDeleteUser) {
      return new Response(
        JSON.stringify({
          error: "Caller is not allowed to delete this user.",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const managedBuckets = parseManagedBuckets();
    if (managedBuckets.length === 0) {
      return new Response(
        JSON.stringify({
          error:
            "Missing USER_STORAGE_BUCKETS environment variable. Add at least one bucket name.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { deletedFiles, skippedBuckets } = await deleteOwnedStorageObjects(
      userId,
      managedBuckets,
    );

    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(
      userId,
    );

    if (deleteUserError) {
      throw new Error(`Failed to delete auth user: ${deleteUserError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedUserId: userId,
        deletedFiles,
        skippedBuckets,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
