"use client";

import { useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/Icon";
import { Panel, Field, fieldClass } from "@/components/marketplace/uiBits";
import { useAppDialog } from "@/hooks/useAppDialog";
import { btn } from "@/lib/ui";

const STORAGE_KEY = "soko_workspace_settings";

type WorkspaceSettings = {
  emailNotifications: boolean;
  dealAlerts: boolean;
  language: "en" | "fr" | "rw";
  compactTables: boolean;
};

const defaults: WorkspaceSettings = {
  emailNotifications: true,
  dealAlerts: true,
  language: "en",
  compactTables: false,
};

function subscribeNoop() {
  return () => {};
}

function clientReady() {
  return true;
}

function serverReady() {
  return false;
}

function loadSettings(): WorkspaceSettings {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...(JSON.parse(raw) as Partial<WorkspaceSettings>) };
  } catch {
    return defaults;
  }
}

export function SettingsPage() {
  const { showSuccess, dialog } = useAppDialog();
  const isClient = useSyncExternalStore(
    subscribeNoop,
    clientReady,
    serverReady
  );
  const [settings, setSettings] = useState<WorkspaceSettings>(defaults);
  const [ready, setReady] = useState(false);

  if (isClient && !ready) {
    setSettings(loadSettings());
    setReady(true);
  }

  const update = <K extends keyof WorkspaceSettings>(
    key: K,
    value: WorkspaceSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    void showSuccess("Your workspace preferences were saved on this device.", {
      title: "Settings saved",
    });
  };

  if (!ready) return null;

  return (
    <>
      {dialog}
      <form className="flex flex-col gap-4" onSubmit={save}>
        <Panel
          title="Notifications"
          subtitle="Choose which alerts you want while using the workspace."
        >
          <label className="mb-3 flex cursor-pointer items-center justify-between gap-4 text-xs">
            <span>
              <strong className="block text-soko-ink">
                Email notifications
              </strong>
              <span className="text-soko-muted">
                Account and trade updates by email
              </span>
            </span>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => update("emailNotifications", e.target.checked)}
              className="h-4 w-4 accent-soko-navy"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-4 text-xs">
            <span>
              <strong className="block text-soko-ink">Deal alerts</strong>
              <span className="text-soko-muted">
                Notify when deals need your action
              </span>
            </span>
            <input
              type="checkbox"
              checked={settings.dealAlerts}
              onChange={(e) => update("dealAlerts", e.target.checked)}
              className="h-4 w-4 accent-soko-navy"
            />
          </label>
        </Panel>

        <Panel title="Display" subtitle="Local preferences for this browser.">
          <div className="mb-3.5 max-w-xs">
            <Field label="Language">
              <select
                className={fieldClass}
                value={settings.language}
                onChange={(e) =>
                  update(
                    "language",
                    e.target.value as WorkspaceSettings["language"]
                  )
                }
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="rw">Kinyarwanda</option>
              </select>
            </Field>
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-4 text-xs">
            <span>
              <strong className="block text-soko-ink">Compact tables</strong>
              <span className="text-soko-muted">
                Denser rows on deals and listings
              </span>
            </span>
            <input
              type="checkbox"
              checked={settings.compactTables}
              onChange={(e) => update("compactTables", e.target.checked)}
              className="h-4 w-4 accent-soko-navy"
            />
          </label>
        </Panel>

        <div>
          <button
            type="submit"
            className={`${btn.primaryCompact} sm:px-5.5 sm:py-3.5`}
          >
            Save settings <Icon name="arrow" />
          </button>
        </div>
      </form>
    </>
  );
}
