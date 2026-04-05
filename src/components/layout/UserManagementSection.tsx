import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Loader2 from "lucide-react/dist/esm/icons/loader-2.js";
import RefreshCcw from "lucide-react/dist/esm/icons/refresh-ccw.js";
import Shield from "lucide-react/dist/esm/icons/shield.js";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check.js";
import Eye from "lucide-react/dist/esm/icons/eye.js";
import UserCheck from "lucide-react/dist/esm/icons/user-check.js";
import Clock3 from "lucide-react/dist/esm/icons/clock-3.js";
import Trash2 from "lucide-react/dist/esm/icons/trash-2.js";
import useSupabaseStore from "../../store/useSupabaseStore";
import { GENERAL_ADMINISTRATION_PROVINCE } from "../../constants/provinces";
import {
  getUserProvince,
  isGeneralAdmin,
  type UserRole,
} from "../../utils/access";
import { translateProvinceName } from "../../utils/provinceLabels";

const ROLE_ICON_BY_KEY = {
  admin: ShieldCheck,
  editor: Shield,
  reader: Eye,
} as const;

const ROLE_BADGE_BY_KEY = {
  admin: "bg-primary-light/10 text-primary-light",
  editor: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
  reader: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
} as const;

function getPendingDefaultRole(province?: string | null): UserRole | "" {
  return province === GENERAL_ADMINISTRATION_PROVINCE ? "admin" : "";
}

export function UserManagementSection() {
  const { t } = useTranslation();
  const {
    user,
    profile,
    provinceUsers,
    isUsersLoading,
    fetchProvinceUsers,
    updateProvinceUserRole,
    approveProvinceUser,
    deleteProvinceUser,
    setError,
    setMessage,
  } = useSupabaseStore();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [approvingUserId, setApprovingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [pendingRoleSelections, setPendingRoleSelections] = useState<
    Record<string, UserRole | "">
  >({});

  const currentProvince = getUserProvince(profile, user);
  const hasGlobalAccess = isGeneralAdmin(profile, user);

  useEffect(() => {
    void fetchProvinceUsers();
  }, [fetchProvinceUsers]);

  useEffect(() => {
    setPendingRoleSelections((currentSelections) =>
      Object.fromEntries(
        Object.entries(currentSelections).filter(([userId]) =>
          provinceUsers.some(
            (provinceUser) => provinceUser.id === userId && !provinceUser.approved,
          ),
        ),
      ) as Record<string, UserRole | "">,
    );
  }, [provinceUsers]);

  const handleRefresh = () => {
    void fetchProvinceUsers();
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setUpdatingUserId(userId);
    try {
      await updateProvinceUserRole(userId, role);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmed = window.confirm(
      t("userManagement.deleteMessagePlain", {
        defaultValue:
          'Voce esta prestes a excluir permanentemente "{{userName}}".',
        userName,
      }),
    );

    if (!confirmed) {
      return;
    }

    setDeletingUserId(userId);
    try {
      await deleteProvinceUser(userId);
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleApproveUser = async (
    userId: string,
    defaultRole: UserRole | "" = "",
  ) => {
    const selectedRole = pendingRoleSelections[userId] ?? defaultRole;

    if (!selectedRole) {
      setMessage(null);
      setError(
        t("feedback.users.roleRequiredForApproval", {
          defaultValue:
            "Selecione um perfil de acesso antes de aprovar o usuario.",
        }),
      );
      return;
    }

    setApprovingUserId(userId);
    try {
      const hasApproved = await approveProvinceUser(userId, selectedRole);

      if (hasApproved) {
        setPendingRoleSelections((currentSelections) => {
          const nextSelections = { ...currentSelections };
          delete nextSelections[userId];
          return nextSelections;
        });
      }
    } finally {
      setApprovingUserId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border-subtle pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            {t("userManagement.title", {
              defaultValue: "Usuarios e Permissoes",
            })}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
            {t("userManagement.description", {
              defaultValue:
                "A Administracao geral pode ajustar o perfil de acesso dos usuarios de todas as provincias.",
            })}
          </p>
          {hasGlobalAccess ? (
            <span className="mt-3 inline-flex items-center rounded-full bg-hover-bg px-3 py-1 text-xs font-semibold text-text-secondary">
              {t("userManagement.scopeAll", {
                defaultValue: "Acesso liberado: todas as provincias",
              })}
            </span>
          ) : currentProvince ? (
            <span className="mt-3 inline-flex items-center rounded-full bg-hover-bg px-3 py-1 text-xs font-semibold text-text-secondary">
              {t("userManagement.scope", {
                defaultValue: "Província atual: {{province}}",
                province: translateProvinceName(currentProvince),
              })}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isUsersLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-hover-bg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUsersLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
          {t("userManagement.refresh", { defaultValue: "Atualizar lista" })}
        </button>
      </div>

      {isUsersLoading && provinceUsers.length === 0 ? (
        <div className="flex items-center gap-3 py-10 text-sm text-text-secondary">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t("userManagement.loading", {
            defaultValue: "Carregando usuarios...",
          })}
        </div>
      ) : provinceUsers.length === 0 ? (
        <div className="py-10 text-sm text-text-secondary">
          {t("userManagement.empty", {
            defaultValue: "Nenhum usuario encontrado.",
          })}
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {provinceUsers.map((provinceUser) => {
            const pendingRoleSelection =
              pendingRoleSelections[provinceUser.id] ??
              getPendingDefaultRole(provinceUser.province);
            const selectedRole = provinceUser.approved
              ? provinceUser.role
              : pendingRoleSelection || null;
            const RoleIcon = selectedRole ? ROLE_ICON_BY_KEY[selectedRole] : null;
            const isCurrentUser = provinceUser.id === user?.id;
            const isBusy =
              updatingUserId === provinceUser.id ||
              approvingUserId === provinceUser.id ||
              deletingUserId === provinceUser.id;
            const userName =
              provinceUser.name ??
              provinceUser.email ??
              t("userManagement.unnamed", {
                defaultValue: "Usuario sem nome",
              });

            return (
              <div
                key={provinceUser.id}
                className="rounded-2xl border border-border-subtle bg-background/60 p-4"
              >
                <div className="space-y-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary">
                        {userName}
                      </p>
                      {isCurrentUser && (
                        <span className="inline-flex items-center rounded-full bg-primary-light/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary-light">
                          {t("userManagement.currentUser", {
                            defaultValue: "Voce",
                          })}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 break-all text-sm leading-5 text-text-secondary">
                      {provinceUser.email ?? "—"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedRole && RoleIcon ? (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${ROLE_BADGE_BY_KEY[selectedRole]}`}
                        >
                          <RoleIcon className="h-3.5 w-3.5" />
                          {t(`roles.${selectedRole}`, {
                            defaultValue: selectedRole,
                          })}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-hover-bg px-3 py-1 text-xs font-medium text-text-secondary">
                          {t("userManagement.roleUnassigned", {
                            defaultValue: "Perfil nao definido",
                          })}
                        </span>
                      )}

                      {provinceUser.province && (
                        <span className="inline-flex items-center rounded-full bg-hover-bg px-3 py-1 text-xs font-medium text-text-secondary">
                          {translateProvinceName(provinceUser.province)}
                        </span>
                      )}

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                          provinceUser.approved
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {provinceUser.approved ? (
                          <UserCheck className="h-3.5 w-3.5" />
                        ) : (
                          <Clock3 className="h-3.5 w-3.5" />
                        )}
                        {provinceUser.approved
                          ? t("userManagement.approved", {
                              defaultValue: "Aprovado",
                            })
                          : t("userManagement.pending", {
                              defaultValue: "Aguardando aprovação",
                            })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-border-subtle/70 pt-4 md:flex-row md:items-end md:justify-between">
                    <div className="flex w-full flex-col gap-3 md:max-w-[260px]">
                      <label className="flex w-full flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        {t("userManagement.roleLabel", {
                          defaultValue: "Perfil de acesso",
                        })}
                        <select
                          value={provinceUser.approved ? provinceUser.role : pendingRoleSelection}
                          disabled={isCurrentUser || isBusy}
                          onChange={(event) => {
                            const nextRole = event.target.value as UserRole | "";

                            if (provinceUser.approved) {
                              void handleRoleChange(provinceUser.id, nextRole as UserRole);
                              return;
                            }

                            setPendingRoleSelections((currentSelections) => ({
                              ...currentSelections,
                              [provinceUser.id]: nextRole,
                            }));
                          }}
                          className="cursor-pointer rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-light/40 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {!provinceUser.approved && (
                            <option value="">
                              {t("userManagement.rolePlaceholder", {
                                defaultValue: "Selecione um perfil",
                              })}
                            </option>
                          )}
                          {(["admin", "editor", "reader"] as UserRole[]).map((role) => (
                            <option key={role} value={role}>
                              {t(`roles.${role}`, { defaultValue: role })}
                            </option>
                          ))}
                        </select>
                      </label>

                      {!provinceUser.approved && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            void handleApproveUser(
                              provinceUser.id,
                              getPendingDefaultRole(provinceUser.province),
                            )
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 px-4 py-2.5 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {approvingUserId === provinceUser.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                          {t("userManagement.approveAction", {
                            defaultValue: "Aprovar usuário",
                          })}
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isCurrentUser || isBusy}
                      onClick={() =>
                        void handleDeleteUser(provinceUser.id, userName)
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50 md:self-end"
                    >
                      {deletingUserId === provinceUser.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      {provinceUser.approved
                        ? t("userManagement.deleteAction", {
                            defaultValue: "Excluir usuario",
                          })
                        : t("userManagement.rejectAction", {
                            defaultValue: "Rejeitar",
                          })}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
