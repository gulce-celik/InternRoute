/** Yellow brand mark — pin on a route (internship path). */
export default function BrandMark({ className = "" }: { className?: string }) {
  return (
    <div className={`brand-mark ${className}`.trim()} aria-hidden="true">
      <svg className="brand-mark-icon" viewBox="0 0 32 32" fill="none">
        <path
          d="M5 23c5-9 11-13 18-13"
          stroke="#14110f"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M21 8.5c0 3.6-3.5 7.2-3.5 7.2S14 12.1 14 8.5a3.5 3.5 0 1 1 7 0Z"
          fill="#14110f"
        />
        <circle cx="21" cy="8.5" r="1.35" fill="#e8b84a" />
        <circle cx="23" cy="23" r="2.1" fill="#14110f" />
      </svg>
    </div>
  );
}
