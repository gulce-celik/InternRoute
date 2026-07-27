import type { CSSProperties } from "react";

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ className = "", style }: SkeletonProps) {
  return <span className={`skeleton ${className}`.trim()} style={style} aria-hidden="true" />;
}

export function JobCardSkeleton() {
  return (
    <article className="job-card skeleton-card" aria-hidden="true">
      <div className="job-card-header">
        <div className="skeleton-stack">
          <Skeleton className="skeleton--title" />
          <Skeleton className="skeleton--meta" />
        </div>
        <Skeleton className="skeleton--badge" />
      </div>
      <Skeleton className="skeleton--line" />
      <Skeleton className="skeleton--line skeleton--line-short" />
      <div className="job-card-footer">
        <Skeleton className="skeleton--date" />
        <Skeleton className="skeleton--button" />
      </div>
    </article>
  );
}

export function CvCardSkeleton() {
  return (
    <article className="job-card skeleton-card" aria-hidden="true">
      <div className="job-card-header">
        <div className="skeleton-stack">
          <Skeleton className="skeleton--title" />
          <Skeleton className="skeleton--meta" />
        </div>
        <Skeleton className="skeleton--badge" />
      </div>
      <div className="job-card-footer job-card-footer--actions">
        <Skeleton className="skeleton--date" />
        <div className="cv-card-actions">
          <Skeleton className="skeleton--button" />
          <Skeleton className="skeleton--button" />
        </div>
      </div>
    </article>
  );
}

export function FlowCardSkeleton() {
  return (
    <article className="flow-card skeleton-card" aria-hidden="true">
      <div className="skeleton-stack">
        <Skeleton className="skeleton--title" />
        <Skeleton className="skeleton--meta" />
        <Skeleton className="skeleton--meta" />
      </div>
      <div className="flow-card-footer">
        <Skeleton className="skeleton--select" />
        <Skeleton className="skeleton--date" />
      </div>
    </article>
  );
}

export function FormSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="skeleton-form" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="skeleton-form-row">
          <Skeleton className="skeleton--label" />
          <Skeleton className="skeleton--input" />
        </div>
      ))}
      <Skeleton className="skeleton--button-wide" />
    </div>
  );
}

export function ListSkeleton({
  count = 3,
  variant = "job",
}: {
  count?: number;
  variant?: "job" | "cv" | "flow";
}) {
  const Card =
    variant === "cv" ? CvCardSkeleton : variant === "flow" ? FlowCardSkeleton : JobCardSkeleton;

  if (variant === "flow") {
    return (
      <div className="pipeline-preview-grid skeleton-list" aria-busy="true" aria-label="Loading">
        {Array.from({ length: count }, (_, index) => (
          <FlowCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <ul className="jobs-list skeleton-list" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, index) => (
        <li key={index}>
          <Card />
        </li>
      ))}
    </ul>
  );
}
