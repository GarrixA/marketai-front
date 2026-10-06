"use client";

export function Spinner({
  className = "",
  size = 16,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

export function ButtonLoader({ label = "Please wait…" }: { label?: string }) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <Spinner size={16} />
      <span>{label}</span>
    </span>
  );
}

export function ActionOverlay({ label = "Working…" }: { label?: string }) {
  return (
    <div className="absolute inset-0 z-20 grid place-items-center rounded-[inherit] bg-white/75 backdrop-blur-[1px]">
      <div className="flex flex-col items-center gap-2 text-soko-ink">
        <Spinner size={28} className="text-soko-ink" />
        <span className="text-[0.6875rem] font-bold">{label}</span>
      </div>
    </div>
  );
}
