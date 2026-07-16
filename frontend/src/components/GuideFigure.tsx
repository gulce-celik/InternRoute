export default function GuideFigure({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 140" className={className} aria-hidden="true">
      <ellipse cx="60" cy="128" rx="28" ry="6" fill="rgba(20,17,15,0.12)" />
      <path d="M38 78c0-18 10-34 22-34s22 16 22 34v28H38V78z" fill="#2f5d4a" />
      <circle cx="60" cy="36" r="22" fill="#f3ede3" stroke="#14110f" strokeWidth="3" />
      <circle cx="52" cy="34" r="3" fill="#14110f" />
      <circle cx="68" cy="34" r="3" fill="#14110f" />
      <path
        d="M52 44c4 4 12 4 16 0"
        fill="none"
        stroke="#14110f"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M82 70c14 4 22 16 24 28"
        fill="none"
        stroke="#c84b31"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="106" cy="100" r="5" fill="#c84b31" />
      <path
        d="M38 70c-14 4-22 16-24 28"
        fill="none"
        stroke="#14110f"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="14" cy="98" r="5" fill="#14110f" />
    </svg>
  );
}
