/** Yellow brand mark — briefcase (internship / career). */
export default function BrandMark({ className = "" }: { className?: string }) {
  return (
    <div className={`brand-mark ${className}`.trim()} aria-hidden="true">
      <svg className="brand-mark-icon" viewBox="0 0 32 32" fill="none">
        <rect
          x="4"
          y="11"
          width="24"
          height="15"
          rx="2.5"
          stroke="#14110f"
          strokeWidth="2.4"
          fill="#14110f"
        />
        <path
          d="M11 11V9a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v2"
          stroke="#14110f"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path d="M4 17h24" stroke="#e8b84a" strokeWidth="2.2" strokeLinecap="round" />
        <rect x="13.5" y="15.5" width="5" height="3.5" rx="1" fill="#e8b84a" />
      </svg>
    </div>
  );
}
