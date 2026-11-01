"use client";

import { useState, useSyncExternalStore } from "react";
import useTranslation from "next-translate/useTranslation";
import { Icon } from "@/components/Icon";
import { Panel, Field, fieldClass } from "@/components/marketplace/uiBits";
import { useAppLocale } from "@/components/providers/AppI18nProvider";
import { useAppDialog } from "@/hooks/useAppDialog";
import { btn } from "@/lib/ui";
import { normalizeLocale } from "@/lib/i18n";

const STORAGE_KEY = "soko_workspace_settings";

type WorkspaceSettings = {
  emailNotifications: boolean;
  dealAlerts: boolean;
  language: "en" | "rw";
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
    const parsed = JSON.parse(raw) as Partial<WorkspaceSettings>;
    return {
      ...defaults,
      ...parsed,
      language: normalizeLocale(parsed.language),
    };
  } catch {
    return defaults;
  }
}

export function SettingsPage() {
  const { t } = useTranslation("settings");
  const { setLanguage } = useAppLocale();
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
    void setLanguage(settings.language);
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
          title={t("notifications")}
          subtitle={t("notificationsDescription")}
        >
          <label className="mb-3 flex cursor-pointer items-center justify-between gap-4 text-xs">
            <span>
              <strong className="block text-soko-ink">
                {t("emailNotifications")}
              </strong>
              <span className="text-soko-muted">
                {t("emailNotificationsDescription")}
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
              <strong className="block text-soko-ink">{t("dealAlerts")}</strong>
              <span className="text-soko-muted">
                {t("dealAlertsDescription")}
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

        <Panel title={t("display")} subtitle={t("displayDescription")}>
          <div className="mb-3.5 max-w-xs">
            <Field label={t("language")}>
              <select
                className={fieldClass}
                value={settings.language}
                onChange={(e) => {
                  const next = normalizeLocale(e.target.value);
                  update("language", next);
                  void setLanguage(next);
                }}
              >
                <option value="en">{t("languages.english")}</option>
                <option value="rw">{t("languages.kinyarwanda")}</option>
              </select>
            </Field>
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-4 text-xs">
            <span>
              <strong className="block text-soko-ink">
                {t("compactTables")}
              </strong>
              <span className="text-soko-muted">
                {t("compactTablesDescription")}
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
            {t("saveSettings")} <Icon name="arrow" />
          </button>
        </div>
      </form>
    </>
  );
}
