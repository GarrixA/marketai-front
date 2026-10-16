type LogoProps = {
  light?: boolean;
  onHome?: () => void;
};

export function Logo({ light = false, onHome }: LogoProps) {
  return (
    <button
      className={`flex items-center gap-2.5 border-0 bg-transparent p-0 font-display text-xl font-extrabold tracking-[-0.04375rem] ${
        light ? "text-white" : "text-soko-ink"
      }`}
      onClick={onHome}
      aria-label="Soko home"
    >
      <span
        className={`grid h-9.75 w-8.25 place-items-center rounded-[52%_48%_48%_52%/62%_62%_38%_38%] ${
          light ? "bg-white" : "bg-soko-navy"
        }`}
        style={{ transform: "rotate(25deg)" }}
      >
        <span
          className={`block h-4.25 w-2.75 rounded-[60%_20%_60%_20%] ${
            light ? "bg-soko-navy" : "bg-soko-on-dark"
          }`}
          style={{ transform: "rotate(-15deg)" }}
        />
      </span>
      <span>
        Soko
        <small
          className={`block font-sans text-[0.4375rem] font-bold tracking-[0.15rem] ${
            light ? "text-soko-on-dark" : "text-soko-muted"
          }`}
        >
          RWANDA
        </small>
      </span>
    </button>
  );
}
