import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { loginFormData, registerFormData } from "../schemas/authSchema";
import i18n from "../i18n";
import {
  GENERAL_ADMINISTRATION_PROVINCE,
  isProvinceName,
} from "../constants/provinces";
import { supabase } from "../services/supabaseClient";
import useThemeStore from "./useThemeStore";
import type {
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "../types/index";
import {
  ALL_PROVINCES_SCOPE,
  canManageUsers,
  getUserProvince as getResolvedUserProvince,
  getUserRole,
  isApprovedProfile,
  isGeneralAdmin,
  type UserRole,
} from "../utils/access";

type Profile = Tables<"profiles">;
type Unit = Tables<"units">;
type UnitHistory = Tables<"unit_history">;
type UnitInsert = TablesInsert<"units">;
type UnitUpdate = TablesUpdate<"units">;
type UnitHistoryInsert = TablesInsert<"unit_history">;

interface SupabaseStore {
  isLoading: boolean;
  isAuthLoading: boolean;
  isHistoryLoading: boolean;
  user: User | null;
  profile: Profile | null;
  message: string | null;
  erro: string | null;
  units: Unit[];
  historyByUnit: Record<string, UnitHistory[]>;
  provinceUsers: Profile[];
  file: string;
  isUsersLoading: boolean;
  initializeAuth: () => () => void;
  logoutUser: () => Promise<void>;
  loginUser: (data: loginFormData) => Promise<void>;
  registerUser: (data: registerFormData) => Promise<boolean>;
  hasLoadedUnits: boolean;
  loadedUnitsProvince: string | null;
  fetchProfile: (userOverride?: User | null) => Promise<void>;
  updateAvatar: (file: File) => Promise<boolean>;
  fetchUnits: (force?: boolean) => Promise<void>;
  insertUnit: (data: UnitInsert | UnitInsert[]) => Promise<boolean>;
  importUnits: (rows: UnitInsert[]) => Promise<boolean>;
  updateUnit: (id: string, updates: UnitUpdate) => Promise<boolean>;
  archiveUnit: (id: string) => Promise<boolean>;
  restoreUnit: (id: string) => Promise<boolean>;
  deleteUnit: (id: string) => Promise<void>;
  fetchUnitHistory: (unitId: string) => Promise<UnitHistory[]>;
  fetchProvinceUsers: () => Promise<Profile[]>;
  updateProvinceUserRole: (userId: string, role: UserRole) => Promise<boolean>;
  approveProvinceUser: (userId: string, role: UserRole) => Promise<boolean>;
  updateProvinceUserApproval: (userId: string, approved: boolean) => Promise<boolean>;
  deleteProvinceUser: (userId: string) => Promise<boolean>;
  clearMessage: () => void;
  setError: (erro: string | null) => void;
  setMessage: (message: string | null) => void;
  uploadImage: (file: File) => Promise<string>;
}

let unitsRequest: Promise<void> | null = null;
let profileRequest: Promise<void> | null = null;
let profileRequestUserId: string | null = null;
let pendingApprovalFeedbackMode: "message" | "error" = "message";

function getUserProvince(user: User | null, profile?: Profile | null) {
  return getResolvedUserProvince(profile, user);
}

function hasGlobalProvinceAccess(user: User | null, profile?: Profile | null) {
  return isGeneralAdmin(profile, user);
}

function getUnitsScopeKey(user: User | null, profile?: Profile | null) {
  if (hasGlobalProvinceAccess(user, profile)) {
    return ALL_PROVINCES_SCOPE;
  }

  return getUserProvince(user, profile);
}

function resolveManagedUnitProvince(
  user: User | null,
  profile?: Profile | null,
  province?: string | null,
) {
  if (!hasGlobalProvinceAccess(user, profile)) {
    return getUserProvince(user, profile);
  }

  return typeof province === "string" && isProvinceName(province)
    ? province
    : null;
}

function buildFallbackProfile(user: User): Profile {
  return {
    approved: true,
    created_at: new Date().toISOString(),
    email: user.email ?? null,
    id: user.id,
    name:
      typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : null,
    avatar_url: null,
    province: getUserProvince(user),
    role: getUserRole(null, user),
  };
}

function shouldResetUnitsState(
  previousUser: User | null,
  nextUser: User | null,
  loadedUnitsProvince: string | null,
) {
  if (!nextUser) {
    return true;
  }

  if (!previousUser || previousUser.id !== nextUser.id) {
    return true;
  }

  const previousProvince = getUnitsScopeKey(previousUser);
  const nextProvince = getUnitsScopeKey(nextUser);

  return previousProvince !== nextProvince || loadedUnitsProvince !== nextProvince;
}

function isProfilePermissionError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const profileError = error as {
    code?: unknown;
    message?: unknown;
    status?: unknown;
  };

  if (profileError.code === "42501") {
    return true;
  }

  if (profileError.status === 401 || profileError.status === 403) {
    return true;
  }

  return (
    typeof profileError.message === "string" &&
    profileError.message.toLowerCase().includes("permission")
  );
}

async function fetchProfileRecord(user: User) {
  const response = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (response.error) {
    if (
      isProfilePermissionError({ ...response.error, status: response.status })
    ) {
      return buildFallbackProfile(user);
    }

    throw response.error;
  }

  return response.data ?? buildFallbackProfile(user);
}

function normalizeComparableText(value?: string | null) {
  return value?.toLowerCase().replace(/\s+/g, "").trim() ?? "";
}

function normalizeZipCode(value?: string | null) {
  return value?.replace(/\D/g, "") ?? "";
}

function translate(key: string, options?: Record<string, unknown>) {
  return String(i18n.t(key, options));
}

function getDuplicateUnitsMessage() {
  return translate("feedback.units.duplicate", {
    defaultValue:
      "Esta unidade (ou uma com nome identico nesta localizacao) ja esta cadastrada.",
  });
}

function getMissingProvinceMessage() {
  return translate("feedback.units.missingProvince", {
    defaultValue: "Seu usuario nao possui uma provincia vinculada.",
  });
}

function getUnitProvinceRequiredMessage() {
  return translate("feedback.units.provinceRequired", {
    defaultValue: "Selecione uma provincia valida para a unidade.",
  });
}

function getUnitNotFoundMessage() {
  return translate("feedback.units.notFound", {
    defaultValue: "Unidade nao encontrada.",
  });
}

function getUsersAdminOnlyMessage() {
  return translate("feedback.users.adminOnly", {
    defaultValue: "Apenas a Administracao geral pode gerenciar usuarios.",
  });
}

function getCannotDeleteOwnUserMessage() {
  return translate("feedback.users.cannotDeleteSelf", {
    defaultValue: "Voce nao pode excluir sua propria conta por aqui.",
  });
}

function getCannotChangeOwnRoleMessage() {
  return translate("feedback.users.cannotChangeOwnRole", {
    defaultValue: "Voce nao pode alterar sua propria permissao.",
  });
}

function getPendingApprovalMessage() {
  return translate("feedback.auth.pendingApproval", {
    defaultValue:
      "Seu cadastro esta pendente de aprovacao. Aguarde a liberacao da Administracao geral.",
  });
}

function getPendingApprovalFeedbackState() {
  if (pendingApprovalFeedbackMode === "error") {
    return {
      erro: getPendingApprovalMessage(),
      message: null,
    };
  }

  return {
    erro: null,
    message: getPendingApprovalMessage(),
  };
}

function getApprovalUpdatedMessage(isApproved: boolean) {
  return translate(
    isApproved
      ? "feedback.users.approvalGranted"
      : "feedback.users.approvalRevoked",
    {
      defaultValue: isApproved
        ? "Usuario aprovado com sucesso!"
        : "A aprovacao do usuario foi removida.",
    },
  );
}

function getActorName(user: User | null, profile: Profile | null) {
  if (profile?.name) {
    return profile.name;
  }

  if (typeof user?.user_metadata?.name === "string") {
    return user.user_metadata.name;
  }

  return user?.email ?? null;
}

function getChangedFields(currentUnit: Unit | null, updates: UnitUpdate) {
  if (!currentUnit) {
    return Object.keys(updates).filter((field) => field !== "province");
  }

  return Object.entries(updates)
    .filter(([field, value]) => {
      if (field === "province") {
        return false;
      }

      return JSON.stringify(currentUnit[field as keyof Unit] ?? null) !== JSON.stringify(value ?? null);
    })
    .map(([field]) => field);
}

function buildUnitSnapshot(unit: Partial<Unit>): Json {
  return {
    type: unit.type ?? null,
    status: unit.status ?? null,
    city: unit.city ?? null,
    country: unit.country ?? null,
    address: unit.address ?? null,
    is_archived: unit.is_archived ?? false,
  };
}

function sortUnitsByCreatedAt(units: Unit[]) {
  return [...units].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function sortProfilesByRoleAndName(profiles: Profile[]) {
  const roleWeight: Record<UserRole, number> = {
    admin: 0,
    editor: 1,
    reader: 2,
  };

  return [...profiles].sort((a, b) => {
    if (a.approved !== b.approved) {
      return a.approved ? 1 : -1;
    }

    const roleDifference = roleWeight[a.role] - roleWeight[b.role];
    if (roleDifference !== 0) {
      return roleDifference;
    }

    return (a.name ?? a.email ?? "").localeCompare(b.name ?? b.email ?? "");
  });
}

function findDuplicateConflict(
  currentUnits: Unit[],
  candidates: Array<Pick<UnitInsert, "name" | "city" | "zip_code">>,
  ignoreUnitId?: string,
) {
  const seenNameCity = new Set<string>();
  const seenZipCodes = new Set<string>();

  for (const candidate of candidates) {
    const normalizedName = normalizeComparableText(candidate.name);
    const normalizedCity = normalizeComparableText(candidate.city);
    const normalizedZip = normalizeZipCode(candidate.zip_code);
    const nameCityKey =
      normalizedName && normalizedCity
        ? `${normalizedName}::${normalizedCity}`
        : "";

    if (nameCityKey && seenNameCity.has(nameCityKey)) {
      return true;
    }

    if (normalizedZip && seenZipCodes.has(normalizedZip)) {
      return true;
    }

    const conflict = currentUnits.some((unit) => {
      if (ignoreUnitId && unit.id === ignoreUnitId) {
        return false;
      }

      const sameNameCity =
        nameCityKey &&
        normalizeComparableText(unit.name) === normalizedName &&
        normalizeComparableText(unit.city) === normalizedCity;
      const sameZip =
        normalizedZip && normalizeZipCode(unit.zip_code) === normalizedZip;

      return Boolean(sameNameCity || sameZip);
    });

    if (conflict) {
      return true;
    }

    if (nameCityKey) {
      seenNameCity.add(nameCityKey);
    }

    if (normalizedZip) {
      seenZipCodes.add(normalizedZip);
    }
  }

  return false;
}

function buildUnitHistoryEntry(params: {
  unitId?: string | null;
  unitName: string;
  province: string;
  action: UnitHistory["action"];
  actorUserId?: string | null;
  actorName?: string | null;
  details?: Json;
}): UnitHistoryInsert {
  return {
    unit_id: params.unitId ?? null,
    unit_name: params.unitName,
    province: params.province,
    action: params.action,
    actor_user_id: params.actorUserId ?? null,
    actor_name: params.actorName ?? null,
    details: params.details ?? {},
  };
}

async function insertHistoryEntries(entries: UnitHistoryInsert[]) {
  if (entries.length === 0) {
    return;
  }

  const { error } = await supabase.from("unit_history").insert(entries);

  if (error) {
    console.warn("Nao foi possivel registrar historico das unidades.", error);
  }
}

const useSupabaseStore = create<SupabaseStore>()(
  devtools(
    (set, get) => ({
      isLoading: false,
      isAuthLoading: true,
      isHistoryLoading: false,
      user: null,
      profile: null,
      message: null,
      erro: null,
      units: [],
      historyByUnit: {},
      provinceUsers: [],
      file: "",
      isUsersLoading: false,
      hasLoadedUnits: false,
      loadedUnitsProvince: null,

      initializeAuth: () => {
        const syncAuthenticatedUser = async (nextUser: User | null) => {
          const previousUser = get().user;
          const shouldResetUnits = shouldResetUnitsState(
            previousUser,
            nextUser,
            get().loadedUnitsProvince,
          );

          if (!nextUser) {
            set({
              user: null,
              profile: null,
              isAuthLoading: false,
              isHistoryLoading: false,
              ...(shouldResetUnits
                ? {
                    units: [],
                    historyByUnit: {},
                    provinceUsers: [],
                    hasLoadedUnits: false,
                    loadedUnitsProvince: null,
                  }
                : {}),
            });
            return;
          }

          try {
            const profile = await fetchProfileRecord(nextUser);

            if (!isApprovedProfile(profile)) {
              await supabase.auth.signOut();

              set({
                user: null,
                profile: null,
                ...getPendingApprovalFeedbackState(),
                isLoading: false,
                isAuthLoading: false,
                isHistoryLoading: false,
                units: [],
                historyByUnit: {},
                provinceUsers: [],
                hasLoadedUnits: false,
                loadedUnitsProvince: null,
              });
              return;
            }

            set({
              user: nextUser,
              profile,
              erro: null,
              isLoading: false,
              isAuthLoading: false,
              isHistoryLoading: false,
              ...(shouldResetUnits
                ? {
                    units: [],
                    historyByUnit: {},
                    provinceUsers: [],
                    hasLoadedUnits: false,
                    loadedUnitsProvince: null,
                  }
                : {}),
            });

            if (shouldResetUnits) {
              void get().fetchUnits(true);
            }
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : translate("feedback.auth.profileLoadError", {
                    defaultValue: "Erro ao carregar perfil.",
                  });

            set({
              user: nextUser,
              profile: null,
              erro: message,
              isLoading: false,
              isAuthLoading: false,
              isHistoryLoading: false,
              ...(shouldResetUnits
                ? {
                    units: [],
                    historyByUnit: {},
                    provinceUsers: [],
                    hasLoadedUnits: false,
                    loadedUnitsProvince: null,
                  }
                : {}),
            });
          }
        };

        supabase.auth
          .getSession()
          .then(
            ({ data: { session } }: { data: { session: Session | null } }) => {
              void syncAuthenticatedUser(session?.user || null);
            },
          );

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(
          (_event: AuthChangeEvent, session: Session | null) => {
            void syncAuthenticatedUser(session?.user || null);
          },
        );

        return () => subscription.unsubscribe();
      },

      logoutUser: async () => {
        set({ isLoading: true }, false, "logoutUser_start");
        const { error } = await supabase.auth.signOut();

        if (error) {
          set(
            { erro: error.message, isLoading: false },
            false,
            "logoutUser_error",
          );
          return;
        }

        useThemeStore.getState().setTheme("light");

        set(
          {
            user: null,
            profile: null,
            units: [],
            historyByUnit: {},
            provinceUsers: [],
            hasLoadedUnits: false,
            loadedUnitsProvince: null,
            message: null,
            erro: null,
            isHistoryLoading: false,
            isUsersLoading: false,
            isLoading: false,
          },
          false,
          "logoutUser_success",
        );
      },

      loginUser: async (data) => {
        set({ isLoading: true }, false, "loginUser_start");
        pendingApprovalFeedbackMode = "error";

        try {
          const { data: authData, error } =
            await supabase.auth.signInWithPassword({
              email: data.email,
              password: data.password,
            });

          if (error) {
            set(
              { erro: error.message, isLoading: false },
              false,
              "loginUser_error",
            );
            return;
          }

          const profile = await fetchProfileRecord(authData.user);

          if (!isApprovedProfile(profile)) {
            await supabase.auth.signOut();
            set(
              {
                user: null,
                profile: null,
                ...getPendingApprovalFeedbackState(),
                isLoading: false,
              },
              false,
              "loginUser_pending_approval",
            );
            return;
          }

          set(
            {
              user: authData.user,
              profile,
              message: translate("feedback.auth.loginSuccess", {
                defaultValue: "Login realizado com sucesso!",
              }),
              erro: null,
              isLoading: false,
            },
            false,
            "loginUser_success",
          );
        } finally {
          pendingApprovalFeedbackMode = "message";
        }
      },

      registerUser: async (data) => {
        set({ isLoading: true }, false, "registerUser_start");
        const role =
          data.province === GENERAL_ADMINISTRATION_PROVINCE
            ? "admin"
            : "editor";

        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              name: data.name,
              province: data.province,
              role,
              approved: false,
            },
          },
        });

        if (error) {
          set(
            { erro: error.message, isLoading: false },
            false,
            "registerUser_error",
          );
          return false;
        }

        if (authData.session) {
          await supabase.auth.signOut();
        }

        set(
          {
            user: null,
            profile: null,
            units: [],
            hasLoadedUnits: false,
            loadedUnitsProvince: null,
            message: null,
            erro: null,
            isLoading: false,
          },
          false,
          "registerUser_success",
        );

        return true;
      },

      fetchProfile: async (userOverride) => {
        const currentUser = userOverride ?? get().user;

        if (!currentUser) {
          profileRequest = null;
          profileRequestUserId = null;
          set({ profile: null }, false, "fetchProfile_clear");
          return;
        }

        if (profileRequest && profileRequestUserId === currentUser.id) {
          return profileRequest;
        }

        profileRequestUserId = currentUser.id;
        profileRequest = (async () => {
          try {
            const profile = await fetchProfileRecord(currentUser);
            const metadataScopeKey = getUnitsScopeKey(currentUser);
            const resolvedScopeKey = getUnitsScopeKey(currentUser, profile);

            set(
              {
                profile,
                erro: null,
              },
              false,
              "fetchProfile_success",
            );

            if (!isApprovedProfile(profile) && get().user?.id === currentUser.id) {
              await supabase.auth.signOut();
              set(
                {
                  user: null,
                  profile: null,
                  ...getPendingApprovalFeedbackState(),
                  units: [],
                  historyByUnit: {},
                  provinceUsers: [],
                  hasLoadedUnits: false,
                  loadedUnitsProvince: null,
                },
                false,
                "fetchProfile_pending_approval",
              );
              return;
            }

            if (get().user?.id === currentUser.id && metadataScopeKey !== resolvedScopeKey) {
              void get().fetchUnits(true);
            }
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : translate("feedback.auth.profileLoadError", {
                    defaultValue: "Erro ao carregar perfil.",
                  });

            set(
              {
                profile: buildFallbackProfile(currentUser),
                erro: message,
              },
              false,
              "fetchProfile_error",
            );
          }
        })();

        try {
          await profileRequest;
        } finally {
          if (profileRequestUserId === currentUser.id) {
            profileRequest = null;
            profileRequestUserId = null;
          }
        }
      },

      updateAvatar: async (file) => {
        const currentUser = get().user;

        if (!currentUser) {
          set(
            {
              erro: translate("feedback.auth.unauthenticated", {
                defaultValue: "Usuario nao autenticado.",
              }),
            },
            false,
            "updateAvatar_no_user",
          );
          return false;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log("Session ativa:", session);
        console.log("User ID:", session?.user?.id);
        console.log("currentUser.id:", currentUser.id);

        set({ isLoading: true }, false, "updateAvatar_start");

        const fileExt = file.name.split(".").pop() || "png";
        const filePath = `avatars/${currentUser.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("unit-images")
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          set(
            { erro: uploadError.message, isLoading: false },
            false,
            "updateAvatar_upload_error",
          );
          return false;
        }

        const { data } = supabase.storage
          .from("unit-images")
          .getPublicUrl(filePath);

        const currentProfile =
          get().profile ?? buildFallbackProfile(currentUser);

        const { data: updatedProfile, error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: currentUser.id,
            name: currentProfile.name,
            avatar_url: data.publicUrl,
            email: currentProfile.email,
            province: currentProfile.province,
            role: currentProfile.role,
          })
          .select("*")
          .single();

        if (profileError) {
          const errorMessage = isProfilePermissionError(profileError)
            ? translate("feedback.profile.avatarPermissionError", {
                defaultValue:
                  "Nao foi possivel salvar o avatar porque o acesso a tabela profiles esta bloqueado para este usuario.",
              })
            : profileError.message;

          set(
            { erro: errorMessage, isLoading: false },
            false,
            "updateAvatar_profile_error",
          );
          return false;
        }

        set(
          {
            profile: updatedProfile,
            message: translate("feedback.profile.avatarUpdated", {
              defaultValue: "Avatar atualizado com sucesso!",
            }),
            erro: null,
            isLoading: false,
          },
          false,
          "updateAvatar_success",
        );

        return true;
      },

      fetchUnits: async (force = false) => {
        const currentUser = get().user;
        const currentProfile = get().profile;

        if (!currentUser) {
          return;
        }

        const userProvince = getUserProvince(currentUser, currentProfile);
        const scopeKey = getUnitsScopeKey(currentUser, currentProfile);
        const hasGlobalAccess = hasGlobalProvinceAccess(currentUser, currentProfile);

        if (!hasGlobalAccess && !userProvince) {
          set(
            {
              units: [],
              hasLoadedUnits: false,
              loadedUnitsProvince: null,
              erro: getMissingProvinceMessage(),
              isLoading: false,
            },
            false,
            "fetchUnits_missing_province",
          );
          return;
        }

        if (!force) {
          if (
            get().hasLoadedUnits &&
            get().loadedUnitsProvince === scopeKey
          ) {
            return;
          }

          if (unitsRequest) {
            return unitsRequest;
          }
        }

        set({ isLoading: true }, false, "fetchUnits_start");

        unitsRequest = (async () => {
          let query = supabase
            .from("units")
            .select("*")
            .order("created_at", { ascending: false });

          if (!hasGlobalAccess) {
            query = query.eq("province", userProvince as string);
          }

          const { data, error } = await query;
          const currentScopeKey = getUnitsScopeKey(get().user, get().profile);

          if (currentScopeKey !== scopeKey) {
            return;
          }

          if (error) {
            set(
              { erro: error.message, isLoading: false },
              false,
              "fetchUnits_error",
            );
            return;
          }

          set(
            {
              units: sortUnitsByCreatedAt(data || []),
              erro: null,
              isLoading: false,
              hasLoadedUnits: true,
              loadedUnitsProvince: scopeKey,
            },
            false,
            "fetchUnits_success",
          );
        })();

        try {
          await unitsRequest;
        } finally {
          unitsRequest = null;
        }
      },

      insertUnit: async (newUnit) => {
        const currentUser = get().user;
        const currentProfile = get().profile;
        const hasGlobalAccess = hasGlobalProvinceAccess(currentUser, currentProfile);
        const userProvince = getUserProvince(currentUser, currentProfile);

        if (!hasGlobalAccess && !userProvince) {
          set(
            {
              erro: getMissingProvinceMessage(),
              isLoading: false,
            },
            false,
            "insertUnit_missing_province",
          );
          return false;
        }

        set(
          { isLoading: true, erro: null, message: null },
          false,
          "insertUnit_start",
        );

        const currentUnits = get().units;
        const normalizedUnits = (Array.isArray(newUnit) ? newUnit : [newUnit]).map(
          (item) => {
            const province = resolveManagedUnitProvince(
              currentUser,
              currentProfile,
              item.province,
            );

            return {
              ...item,
              province,
            };
          },
        );

        if (normalizedUnits.some((item) => !item.province)) {
          set(
            {
              erro: getUnitProvinceRequiredMessage(),
              isLoading: false,
            },
            false,
            "insertUnit_missing_target_province",
          );
          return false;
        }

        if (findDuplicateConflict(currentUnits, normalizedUnits)) {
          set(
            {
              erro: getDuplicateUnitsMessage(),
              isLoading: false,
            },
            false,
            "insertUnit_duplicate",
          );
          return false;
        }

        const { data, error } = await supabase
          .from("units")
          .insert(normalizedUnits)
          .select();

        if (error) {
          const msg =
            error.code === "23505"
              ? translate("feedback.units.insertDuplicate", {
                  defaultValue: "Esta unidade ja esta cadastrada nesta cidade.",
                })
              : error.message;
          set({ erro: msg, isLoading: false }, false, "insertUnit_error");
          return false;
        }

        if (data) {
          const actorName = getActorName(get().user, get().profile);
          await insertHistoryEntries(
            data.map((unit) =>
              buildUnitHistoryEntry({
                unitId: unit.id,
                unitName: unit.name,
                province: unit.province,
                action: "created",
                actorUserId: get().user?.id,
                actorName,
                details: {
                  source: Array.isArray(newUnit) ? "batch" : "manual",
                  snapshot: buildUnitSnapshot(unit),
                },
              }),
            ),
          );

          set(
            (state) => ({
              units: sortUnitsByCreatedAt([...state.units, ...data]),
              message:
                data.length > 1
                  ? translate("feedback.units.createdMany", {
                      defaultValue: "{{count}} unidades criadas com sucesso!",
                      count: data.length,
                    })
                  : translate("feedback.units.createdOne", {
                      defaultValue: "Unidade criada com sucesso!",
                    }),
              erro: null,
              isLoading: false,
            }),
            false,
            "insertUnit_success",
          );
          return true;
        }

        set({ isLoading: false }, false, "insertUnit_empty");
        return false;
      },

      importUnits: async (rows) => {
        const currentUser = get().user;
        const currentProfile = get().profile;
        const hasGlobalAccess = hasGlobalProvinceAccess(currentUser, currentProfile);
        const userProvince = getUserProvince(currentUser, currentProfile);

        if (!hasGlobalAccess && !userProvince) {
          set(
            {
              erro: getMissingProvinceMessage(),
              isLoading: false,
            },
            false,
            "importUnits_missing_province",
          );
          return false;
        }

        if (rows.length === 0) {
          set(
            {
              erro: translate("feedback.units.noValidImportRows", {
                defaultValue:
                  "Nenhuma unidade valida foi encontrada para importar.",
              }),
            },
            false,
            "importUnits_empty",
          );
          return false;
        }

        set(
          { isLoading: true, erro: null, message: null },
          false,
          "importUnits_start",
        );

        const normalizedRows = rows.map((row) => ({
          ...row,
          province: resolveManagedUnitProvince(
            currentUser,
            currentProfile,
            row.province,
          ),
        }));

        if (normalizedRows.some((row) => !row.province)) {
          set(
            {
              erro: getUnitProvinceRequiredMessage(),
              isLoading: false,
            },
            false,
            "importUnits_missing_target_province",
          );
          return false;
        }

        if (findDuplicateConflict(get().units, normalizedRows)) {
          set(
            {
              erro: getDuplicateUnitsMessage(),
              isLoading: false,
            },
            false,
            "importUnits_duplicate",
          );
          return false;
        }

        const { data, error } = await supabase
          .from("units")
          .insert(normalizedRows)
          .select();

        if (error) {
          const message =
            error.code === "23505"
              ? translate("feedback.units.importDuplicate", {
                  defaultValue:
                    "Uma ou mais unidades deste arquivo ja estao cadastradas.",
                })
              : error.message;

          set(
            { erro: message, isLoading: false },
            false,
            "importUnits_error",
          );
          return false;
        }

        if (!data || data.length === 0) {
          set({ isLoading: false }, false, "importUnits_empty_result");
          return false;
        }

        const actorName = getActorName(get().user, get().profile);
        await insertHistoryEntries(
          data.map((unit) =>
            buildUnitHistoryEntry({
              unitId: unit.id,
              unitName: unit.name,
              province: unit.province,
              action: "imported",
              actorUserId: get().user?.id,
              actorName,
              details: {
                source: "csv",
                snapshot: buildUnitSnapshot(unit),
              },
            }),
          ),
        );

        set(
          (state) => ({
            units: sortUnitsByCreatedAt([...state.units, ...data]),
            message: translate("feedback.units.imported", {
              defaultValue: "{{count}} unidades importadas com sucesso!",
              count: data.length,
            }),
            erro: null,
            isLoading: false,
          }),
          false,
          "importUnits_success",
        );

        return true;
      },

      updateUnit: async (id, updates) => {
        const currentUser = get().user;
        const currentProfile = get().profile;
        const hasGlobalAccess = hasGlobalProvinceAccess(currentUser, currentProfile);
        const userProvince = getUserProvince(currentUser, currentProfile);
        const currentUnits = get().units;
        const currentUnit = currentUnits.find((unit) => unit.id === id) ?? null;

        if (!hasGlobalAccess && !userProvince) {
          set(
            {
              erro: getMissingProvinceMessage(),
              isLoading: false,
            },
            false,
            "updateUnit_missing_province",
          );
          return false;
        }

        const managedProvince = resolveManagedUnitProvince(
          currentUser,
          currentProfile,
          updates.province ?? currentUnit?.province,
        );

        if (!managedProvince) {
          set(
            {
              erro: getUnitProvinceRequiredMessage(),
              isLoading: false,
            },
            false,
            "updateUnit_missing_target_province",
          );
          return false;
        }

        set(
          { isLoading: true, erro: null, message: null },
          false,
          "updateUnit_start",
        );

        const normalizedUpdates = { ...updates, province: managedProvince };

        if (
          findDuplicateConflict(
            currentUnits,
            [
              {
                name: (normalizedUpdates.name ?? currentUnit?.name ?? "").trim(),
                city: (normalizedUpdates.city ?? currentUnit?.city ?? "").trim(),
                zip_code: normalizedUpdates.zip_code ?? currentUnit?.zip_code ?? "",
              },
            ],
            id,
          )
        ) {
          set(
            {
              erro: getDuplicateUnitsMessage(),
              isLoading: false,
            },
            false,
            "updateUnit_duplicate",
          );
          return false;
        }

        let query = supabase
          .from("units")
          .update(normalizedUpdates)
          .eq("id", id);

        if (!hasGlobalAccess) {
          query = query.eq("province", userProvince as string);
        }

        const { data, error } = await query.select();

        if (error) {
          set(
            { erro: error.message, isLoading: false },
            false,
            "updateUnit_error",
          );
          return false;
        }

        if (data && data.length > 0) {
          const updatedUnit = data[0];
          const actorName = getActorName(get().user, get().profile);
          await insertHistoryEntries([
            buildUnitHistoryEntry({
              unitId: updatedUnit.id,
              unitName: updatedUnit.name,
              province: updatedUnit.province,
              action: "updated",
              actorUserId: get().user?.id,
              actorName,
              details: {
                changedFields: getChangedFields(currentUnit, normalizedUpdates),
                before: currentUnit ? buildUnitSnapshot(currentUnit) : null,
                after: buildUnitSnapshot(updatedUnit),
              },
            }),
          ]);

          set(
            (state) => ({
              units: state.units.map((unit) =>
                unit.id === id ? { ...unit, ...updatedUnit } : unit,
              ),
              message: translate("feedback.units.updated", {
                defaultValue: "Unidade atualizada com sucesso!",
              }),
              erro: null,
              isLoading: false,
            }),
            false,
            "updateUnit_success",
          );
          return true;
        }

        set(
          {
            erro: translate("feedback.units.updateBlocked", {
              defaultValue: "Voce nao tem permissao para editar esta unidade.",
            }),
            isLoading: false,
          },
          false,
          "updateUnit_blocked",
        );
        return false;
      },

      archiveUnit: async (id) => {
        const currentUser = get().user;
        const currentProfile = get().profile;
        const hasGlobalAccess = hasGlobalProvinceAccess(currentUser, currentProfile);
        const userProvince = getUserProvince(currentUser, currentProfile);

        if (!hasGlobalAccess && !userProvince) {
          set(
            {
              erro: getMissingProvinceMessage(),
              isLoading: false,
            },
            false,
            "archiveUnit_missing_province",
          );
          return false;
        }

        const currentUnit = get().units.find((unit) => unit.id === id);

        if (!currentUnit) {
          set(
            { erro: getUnitNotFoundMessage() },
            false,
            "archiveUnit_not_found",
          );
          return false;
        }

        set(
          { isLoading: true, erro: null, message: null },
          false,
          "archiveUnit_start",
        );

        const archivedAt = new Date().toISOString();
        let query = supabase
          .from("units")
          .update({
            is_archived: true,
            archived_at: archivedAt,
          })
          .eq("id", id);

        if (!hasGlobalAccess) {
          query = query.eq("province", userProvince as string);
        }

        const { data, error } = await query.select().single();

        if (error) {
          set(
            { erro: error.message, isLoading: false },
            false,
            "archiveUnit_error",
          );
          return false;
        }

        const actorName = getActorName(get().user, get().profile);
        await insertHistoryEntries([
          buildUnitHistoryEntry({
            unitId: data.id,
            unitName: data.name,
            province: data.province,
            action: "archived",
            actorUserId: get().user?.id,
            actorName,
            details: {
              archived_at: archivedAt,
              snapshot: buildUnitSnapshot(data),
            },
          }),
        ]);

        set(
          (state) => ({
            units: state.units.map((unit) => (unit.id === id ? data : unit)),
            message: translate("feedback.units.archived", {
              defaultValue: "Unidade arquivada com sucesso!",
            }),
            erro: null,
            isLoading: false,
          }),
          false,
          "archiveUnit_success",
        );

        return true;
      },

      restoreUnit: async (id) => {
        const currentUser = get().user;
        const currentProfile = get().profile;
        const hasGlobalAccess = hasGlobalProvinceAccess(currentUser, currentProfile);
        const userProvince = getUserProvince(currentUser, currentProfile);

        if (!hasGlobalAccess && !userProvince) {
          set(
            {
              erro: getMissingProvinceMessage(),
              isLoading: false,
            },
            false,
            "restoreUnit_missing_province",
          );
          return false;
        }

        const currentUnit = get().units.find((unit) => unit.id === id);

        if (!currentUnit) {
          set(
            { erro: getUnitNotFoundMessage() },
            false,
            "restoreUnit_not_found",
          );
          return false;
        }

        set(
          { isLoading: true, erro: null, message: null },
          false,
          "restoreUnit_start",
        );

        let query = supabase
          .from("units")
          .update({
            is_archived: false,
            archived_at: null,
          })
          .eq("id", id);

        if (!hasGlobalAccess) {
          query = query.eq("province", userProvince as string);
        }

        const { data, error } = await query.select().single();

        if (error) {
          set(
            { erro: error.message, isLoading: false },
            false,
            "restoreUnit_error",
          );
          return false;
        }

        const actorName = getActorName(get().user, get().profile);
        await insertHistoryEntries([
          buildUnitHistoryEntry({
            unitId: data.id,
            unitName: data.name,
            province: data.province,
            action: "restored",
            actorUserId: get().user?.id,
            actorName,
            details: {
              snapshot: buildUnitSnapshot(data),
            },
          }),
        ]);

        set(
          (state) => ({
            units: state.units.map((unit) => (unit.id === id ? data : unit)),
            message: translate("feedback.units.restored", {
              defaultValue: "Unidade restaurada com sucesso!",
            }),
            erro: null,
            isLoading: false,
          }),
          false,
          "restoreUnit_success",
        );

        return true;
      },

      deleteUnit: async (id) => {
        const currentUser = get().user;
        const currentProfile = get().profile;
        const hasGlobalAccess = hasGlobalProvinceAccess(currentUser, currentProfile);
        const userProvince = getUserProvince(currentUser, currentProfile);

        if (!hasGlobalAccess && !userProvince) {
          set(
            {
              erro: getMissingProvinceMessage(),
              isLoading: false,
            },
            false,
            "deleteUnit_missing_province",
          );
          return;
        }

        const currentUnit = get().units.find((unit) => unit.id === id) ?? null;
        set({ isLoading: true }, false, "deleteUnit_start");
        let query = supabase.from("units").delete().eq("id", id);

        if (!hasGlobalAccess) {
          query = query.eq("province", userProvince as string);
        }

        const { error } = await query;

        if (error) {
          set(
            { erro: error.message, isLoading: false },
            false,
            "deleteUnit_error",
          );
          return;
        }

        if (currentUnit) {
          await insertHistoryEntries([
            buildUnitHistoryEntry({
              unitId: currentUnit.id,
              unitName: currentUnit.name,
              province: currentUnit.province,
              action: "deleted",
              actorUserId: get().user?.id,
              actorName: getActorName(get().user, get().profile),
              details: {
                snapshot: buildUnitSnapshot(currentUnit),
              },
            }),
          ]);
        }

        set(
          (state) => ({
            units: state.units.filter((unit) => unit.id !== id),
            message: translate("feedback.units.deleted", {
              defaultValue: "Unidade deletada com sucesso!",
            }),
            erro: null,
            isLoading: false,
          }),
          false,
          "deleteUnit_success",
        );
      },

      fetchUnitHistory: async (unitId) => {
        set({ isHistoryLoading: true }, false, "fetchUnitHistory_start");

        const { data, error } = await supabase
          .from("unit_history")
          .select("*")
          .eq("unit_id", unitId)
          .order("created_at", { ascending: false });

        if (error) {
          set(
            {
              erro: error.message,
              isHistoryLoading: false,
            },
            false,
            "fetchUnitHistory_error",
          );
          return [];
        }

        const history = data ?? [];

        set(
          (state) => ({
            historyByUnit: {
              ...state.historyByUnit,
              [unitId]: history,
            },
            isHistoryLoading: false,
            erro: null,
          }),
          false,
          "fetchUnitHistory_success",
        );

        return history;
      },

      fetchProvinceUsers: async () => {
        const currentUser = get().user;
        const currentProfile = get().profile;

        if (!currentUser || !canManageUsers(currentProfile, currentUser)) {
          set(
            {
              erro: getUsersAdminOnlyMessage(),
              isUsersLoading: false,
            },
            false,
            "fetchProvinceUsers_forbidden",
          );
          return [];
        }

        set(
          { isUsersLoading: true, erro: null },
          false,
          "fetchProvinceUsers_start",
        );

        const { data, error } = await supabase
          .from("profiles")
          .select("*");

        if (error) {
          set(
            {
              erro: error.message,
              isUsersLoading: false,
            },
            false,
            "fetchProvinceUsers_error",
          );
          return [];
        }

        const provinceUsers = sortProfilesByRoleAndName(data ?? []);

        set(
          {
            provinceUsers,
            isUsersLoading: false,
            erro: null,
          },
          false,
          "fetchProvinceUsers_success",
        );

        return provinceUsers;
      },

      updateProvinceUserRole: async (userId, role) => {
        const currentUser = get().user;
        const currentProfile = get().profile;

        if (!currentUser || !canManageUsers(currentProfile, currentUser)) {
          set(
            {
              erro: getUsersAdminOnlyMessage(),
              isUsersLoading: false,
            },
            false,
            "updateProvinceUserRole_forbidden",
          );
          return false;
        }

        if (currentUser.id === userId) {
          set(
            {
              erro: getCannotChangeOwnRoleMessage(),
              isUsersLoading: false,
            },
            false,
            "updateProvinceUserRole_self_blocked",
          );
          return false;
        }

        set(
          { isUsersLoading: true, erro: null, message: null },
          false,
          "updateProvinceUserRole_start",
        );

        const { data, error } = await supabase
          .from("profiles")
          .update({ role })
          .eq("id", userId)
          .select("*")
          .single();

        if (error) {
          set(
            {
              erro: error.message,
              isUsersLoading: false,
            },
            false,
            "updateProvinceUserRole_error",
          );
          return false;
        }

        set(
          (state) => ({
            provinceUsers: sortProfilesByRoleAndName(
              state.provinceUsers.map((userProfile) =>
                userProfile.id === userId ? data : userProfile,
              ),
            ),
            message: translate("feedback.users.roleUpdated", {
              defaultValue: "Permissao do usuario atualizada com sucesso!",
            }),
            erro: null,
            isUsersLoading: false,
          }),
          false,
          "updateProvinceUserRole_success",
        );

        return true;
      },

      approveProvinceUser: async (userId, role) => {
        const currentUser = get().user;
        const currentProfile = get().profile;

        if (!currentUser || !canManageUsers(currentProfile, currentUser)) {
          set(
            {
              erro: getUsersAdminOnlyMessage(),
              isUsersLoading: false,
            },
            false,
            "approveProvinceUser_forbidden",
          );
          return false;
        }

        set(
          { isUsersLoading: true, erro: null, message: null },
          false,
          "approveProvinceUser_start",
        );

        const { data, error } = await supabase
          .from("profiles")
          .update({ role, approved: true })
          .eq("id", userId)
          .select("*")
          .single();

        if (error) {
          set(
            {
              erro: error.message,
              isUsersLoading: false,
            },
            false,
            "approveProvinceUser_error",
          );
          return false;
        }

        set(
          (state) => ({
            provinceUsers: sortProfilesByRoleAndName(
              state.provinceUsers.map((userProfile) =>
                userProfile.id === userId ? data : userProfile,
              ),
            ),
            message: translate("feedback.users.approvalGranted", {
              defaultValue: "Usuario aprovado com sucesso!",
            }),
            erro: null,
            isUsersLoading: false,
          }),
          false,
          "approveProvinceUser_success",
        );

        return true;
      },

      updateProvinceUserApproval: async (userId, approved) => {
        const currentUser = get().user;
        const currentProfile = get().profile;

        if (!currentUser || !canManageUsers(currentProfile, currentUser)) {
          set(
            {
              erro: getUsersAdminOnlyMessage(),
              isUsersLoading: false,
            },
            false,
            "updateProvinceUserApproval_forbidden",
          );
          return false;
        }

        set(
          { isUsersLoading: true, erro: null, message: null },
          false,
          "updateProvinceUserApproval_start",
        );

        const { data, error } = await supabase
          .from("profiles")
          .update({ approved })
          .eq("id", userId)
          .select("*")
          .single();

        if (error) {
          set(
            {
              erro: error.message,
              isUsersLoading: false,
            },
            false,
            "updateProvinceUserApproval_error",
          );
          return false;
        }

        set(
          (state) => ({
            provinceUsers: sortProfilesByRoleAndName(
              state.provinceUsers.map((userProfile) =>
                userProfile.id === userId ? data : userProfile,
              ),
            ),
            message: getApprovalUpdatedMessage(approved),
            erro: null,
            isUsersLoading: false,
          }),
          false,
          "updateProvinceUserApproval_success",
        );

        return true;
      },

      deleteProvinceUser: async (userId) => {
        const currentUser = get().user;
        const currentProfile = get().profile;

        if (!currentUser || !canManageUsers(currentProfile, currentUser)) {
          set(
            {
              erro: getUsersAdminOnlyMessage(),
              isUsersLoading: false,
            },
            false,
            "deleteProvinceUser_forbidden",
          );
          return false;
        }

        if (currentUser.id === userId) {
          set(
            {
              erro: getCannotDeleteOwnUserMessage(),
              isUsersLoading: false,
            },
            false,
            "deleteProvinceUser_self_blocked",
          );
          return false;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          set(
            {
              erro: translate("feedback.auth.unauthenticated", {
                defaultValue: "Usuario nao autenticado.",
              }),
              isUsersLoading: false,
            },
            false,
            "deleteProvinceUser_missing_session",
          );
          return false;
        }

        set(
          { isUsersLoading: true, erro: null, message: null },
          false,
          "deleteProvinceUser_start",
        );

        const { error } = await supabase.functions.invoke("delete-auth-user", {
          body: { userId },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          set(
            {
              erro: error.message,
              isUsersLoading: false,
            },
            false,
            "deleteProvinceUser_error",
          );
          return false;
        }

        set(
          (state) => ({
            provinceUsers: state.provinceUsers.filter(
              (userProfile) => userProfile.id !== userId,
            ),
            message: translate("feedback.users.deleteSuccess", {
              defaultValue: "Usuario excluido com sucesso!",
            }),
            erro: null,
            isUsersLoading: false,
          }),
          false,
          "deleteProvinceUser_success",
        );

        return true;
      },

      uploadImage: async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("unit-images")
          .upload(fileName, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from("unit-images")
          .getPublicUrl(fileName);

        return data.publicUrl;
      },

      clearMessage: () =>
        set({ erro: null, message: null }, false, "clearMessage"),
      setError: (erro) => set({ erro }, false, "setError"),
      setMessage: (message) => set({ message }, false, "setMessage"),
    }),
    { name: "supabaseStore" },
  ),
);

export default useSupabaseStore;
