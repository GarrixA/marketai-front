"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { ButtonLoader } from "@/components/ActionLoader";
import { useAppDialog } from "@/hooks/useAppDialog";
import { btn } from "@/lib/ui";
import { formatApiError } from "@/lib/apiError";
import { rolesService } from "@/services/roles.service";
import { usersService } from "@/services/users.service";
import type { CreateUserRequest, ListedUser, RoleRecord } from "@/types/user";

type CreateForm = CreateUserRequest & { role: string };

const emptyCreateForm = (): CreateForm => ({
  email: "",
  phone: "",
  password: "",
  firstName: "",
  lastName: "",
  role: "",
});

export function UsersManagement() {
  const { confirm, showSuccess, showError, showWarning, dialog } =
    useAppDialog();
  const [users, setUsers] = useState<ListedUser[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateForm>(emptyCreateForm);
  const [roleEdits, setRoleEdits] = useState<Record<string, string>>({});

  const commitLoaded = useCallback(
    (nextUsers: ListedUser[], nextRoles: RoleRecord[]) => {
      setUsers(nextUsers);
      setRoles(nextRoles);
      setRoleEdits(
        Object.fromEntries(
          nextUsers.map((user) => [user.id, user.roles[0] ?? ""])
        )
      );
    },
    []
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextUsers, nextRoles] = await Promise.all([
        usersService.listUsers(),
        rolesService.listRoles(),
      ]);
      commitLoaded(nextUsers, nextRoles);
    } catch (err) {
      showError(formatApiError(err), { title: "Could not load users" });
    } finally {
      setLoading(false);
    }
  }, [commitLoaded, showError]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [nextUsers, nextRoles] = await Promise.all([
          usersService.listUsers(),
          rolesService.listRoles(),
        ]);
        if (cancelled) return;
        commitLoaded(nextUsers, nextRoles);
      } catch (err) {
        if (!cancelled) {
          showError(formatApiError(err), { title: "Could not load users" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [commitLoaded, showError]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => {
      const haystack = [
        user.firstName,
        user.lastName,
        user.email,
        user.phone,
        user.status,
        ...user.roles,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [users, search]);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const email = form.email.trim().toLowerCase();
    const selectedRole = form.role;
    let createdEmail = email;

    const confirmed = await confirm({
      title: "Create user?",
      message: selectedRole
        ? `Create ${email} and assign role ${selectedRole}?`
        : `Create ${email} without a role?`,
      confirmLabel: "Create user",
      onConfirm: async () => {
        setSaving(true);
        try {
          const created = await usersService.createUser({
            email,
            phone: form.phone.trim(),
            password: form.password,
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
          });
          createdEmail = created.email;
          if (selectedRole) {
            await rolesService.assignRole({
              userId: created.id,
              role: selectedRole,
            });
          }
          setForm(emptyCreateForm());
          setCreateOpen(false);
          await load();
        } catch (err) {
          throw new Error(formatApiError(err));
        } finally {
          setSaving(false);
        }
      },
    });

    if (!confirmed) return;

    showSuccess(
      selectedRole
        ? `Created ${createdEmail} with role ${selectedRole}. A verification email is on the way.`
        : `Created ${createdEmail}. A verification email is on the way.`,
      { title: "User created" }
    );
  };

  const applyRole = async (user: ListedUser) => {
    const nextRole = roleEdits[user.id];
    if (!nextRole) {
      showWarning("Select a role first.", { title: "Role required" });
      return;
    }
    if (user.roles.includes(nextRole)) {
      showWarning(`${user.email} already has ${nextRole}.`, {
        title: "No change needed",
      });
      return;
    }

    const isAssign = user.roles.length === 0;
    const previousRole = user.roles[0];
    const confirmed = await confirm({
      title: isAssign ? "Assign role?" : "Update role?",
      message: isAssign
        ? `Assign ${nextRole} to ${user.email}?`
        : `Change ${user.email} from ${previousRole} to ${nextRole}?`,
      confirmLabel: isAssign ? "Assign role" : "Update role",
      onConfirm: async () => {
        setSaving(true);
        try {
          if (isAssign) {
            await rolesService.assignRole({
              userId: user.id,
              role: nextRole,
            });
          } else {
            await rolesService.updateUserRole({
              userId: user.id,
              currentRole: previousRole,
              newRole: nextRole,
            });
          }
          await load();
        } catch (err) {
          throw new Error(formatApiError(err));
        } finally {
          setSaving(false);
        }
      },
    });

    if (!confirmed) return;

    showSuccess(
      isAssign
        ? `Assigned ${nextRole} to ${user.email}.`
        : `Updated ${user.email} from ${previousRole} to ${nextRole}.`,
      { title: isAssign ? "Role assigned" : "Role updated" }
    );
  };

  return (
    <div className="space-y-4.25">
      {dialog}
      <section className="rounded-1.75 border border-soko-line bg-white p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="m-0 mb-0.5 font-display text-[0.9375rem] font-bold">
              Users
            </h2>
            <p className="m-0 text-[0.625rem] text-soko-muted">
              Manage accounts and assign marketplace roles.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btn.outline}
              onClick={() => void load()}
              disabled={loading || saving}
            >
              Refresh
            </button>
            <button
              type="button"
              className={btn.primaryCompact}
              onClick={() => setCreateOpen((open) => !open)}
              disabled={saving}
            >
              {createOpen ? "Close form" : "Create user"} <Icon name="arrow" />
            </button>
          </div>
        </div>

        <label className="mb-4 block text-[0.625rem] font-bold">
          Search
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-1.5 block w-full rounded-1.25 border border-soko-line p-2.75 text-xs outline-soko-navy"
            placeholder="Name, email, phone, role…"
          />
        </label>

        {createOpen ? (
          <form
            className="mb-5 grid gap-3 rounded-1.25 border border-soko-line bg-soko-slate p-4 sm:grid-cols-2"
            onSubmit={(e) => void createUser(e)}
          >
            {(
              [
                ["firstName", "First name", "text"],
                ["lastName", "Last name", "text"],
                ["email", "Email", "email"],
                ["phone", "Phone", "tel"],
                ["password", "Password", "password"],
              ] as const
            ).map(([key, label, type]) => (
              <label key={key} className="block text-[0.625rem] font-bold">
                {label}
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  className="mt-1.5 block w-full rounded-1.25 border border-soko-line bg-white p-2.75 text-xs outline-soko-navy"
                  required
                  minLength={key === "password" ? 8 : undefined}
                  disabled={saving}
                />
              </label>
            ))}
            <label className="block text-[0.625rem] font-bold sm:col-span-2">
              Initial role (optional)
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, role: e.target.value }))
                }
                className="mt-1.5 block w-full rounded-1.25 border border-soko-line bg-white p-2.75 text-xs outline-soko-navy"
                disabled={saving}
              >
                <option value="">No role yet</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className={btn.primaryCompact}
                disabled={saving}
                aria-busy={saving}
              >
                {saving ? (
                  <ButtonLoader label="Creating…" />
                ) : (
                  <>
                    Save user <Icon name="arrow" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : null}

        {loading ? (
          <p className="m-0 text-xs text-soko-muted">Loading users…</p>
        ) : filtered.length === 0 ? (
          <p className="m-0 text-xs text-soko-muted">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-soko-line text-[0.5625rem] tracking-wide text-soko-muted uppercase">
                  <th className="px-2 py-2.5 font-bold">User</th>
                  <th className="px-2 py-2.5 font-bold">Status</th>
                  <th className="px-2 py-2.5 font-bold">Roles</th>
                  <th className="px-2 py-2.5 font-bold">Assign / update</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-soko-line align-top"
                  >
                    <td className="px-2 py-3">
                      <strong className="block text-[0.6875rem]">
                        {user.firstName} {user.lastName}
                      </strong>
                      <span className="block text-[0.5625rem] text-soko-muted">
                        {user.email}
                      </span>
                      <span className="block text-[0.5625rem] text-soko-muted">
                        {user.phone}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-[0.625rem]">{user.status}</td>
                    <td className="px-2 py-3 text-[0.625rem]">
                      {user.roles.length > 0 ? user.roles.join(", ") : "—"}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={roleEdits[user.id] ?? ""}
                          onChange={(e) =>
                            setRoleEdits((prev) => ({
                              ...prev,
                              [user.id]: e.target.value,
                            }))
                          }
                          className="rounded-1.25 border border-soko-line bg-white px-2 py-1.5 text-[0.625rem] outline-soko-navy"
                          disabled={saving}
                        >
                          <option value="">Select role</option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.name}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="border-0 bg-transparent text-[0.625rem] font-bold text-soko-navy disabled:opacity-50"
                          onClick={() => void applyRole(user)}
                          disabled={saving}
                        >
                          Apply
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
