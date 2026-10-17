export function VerifiedBadge({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label="Verified"
      className="shrink-0"
    >
      <path
        fill="#1d9bf0"
        d="M12 1.2 14.7 3l3.2-.5 1.3 3 3 .9-.6 3.2L23.2 12l-1.6 2.4.6 3.2-3 .9-1.3 3-3.2-.5L12 22.8 9.3 21l-3.2.5-1.3-3-3-.9.6-3.2L.8 12l1.6-2.4-.6-3.2 3-.9 1.3-3 3.2.5Z"
      />
      <path
        d="m7.6 12.2 2.7 2.7 6.1-6.3"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
