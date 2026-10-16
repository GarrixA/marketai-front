import { Logo } from "@/components/Logo";

type SiteFooterProps = {
  onHome?: () => void;
};

export function SiteFooter({ onHome }: SiteFooterProps) {
  return (
    <footer className="relative z-2 flex items-center justify-between bg-soko-navy py-8.75 text-white max-sm:flex-col max-sm:items-start max-sm:gap-5 px-[max(24px,calc((100%-1192px)/2))]">
      <Logo light onHome={onHome} />
      <p className="text-[0.6875rem] text-soko-on-dark">
        Making agricultural trade work better for everyone.
      </p>
      <span className="text-[0.6875rem] text-soko-on-dark">
        © 2025 Soko Rwanda
      </span>
    </footer>
  );
}
