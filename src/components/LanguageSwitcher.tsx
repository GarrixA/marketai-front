"use client";

import useTranslation from "next-translate/useTranslation";
import { useAppLocale } from "@/components/providers/AppI18nProvider";
import type { AppLocale } from "@/lib/i18n";

type LanguageSwitcherProps = {
  className?: string;
  compact?: boolean;
};

export function LanguageSwitcher({
  className = "",
  compact = false,
}: LanguageSwitcherProps) {
  const { t } = useTranslation("settings");
  const { lang, setLanguage, ready } = useAppLocale();

  return (
    <label
      className={`inline-flex items-center gap-2 text-[0.6875rem] font-bold text-soko-muted ${className}`}
    >
      {!compact ? <span>{t("language")}</span> : null}
      <select
        aria-label={t("language")}
        value={lang}
        disabled={!ready}
        onChange={(e) => void setLanguage(e.target.value as AppLocale)}
        className="rounded-md border border-soko-line bg-white px-2 py-1.5 text-[0.75rem] font-semibold text-soko-ink outline-none"
      >
        <option value="en">{t("languages.english")}</option>
        <option value="rw">{t("languages.kinyarwanda")}</option>
      </select>
    </label>
  );
}
