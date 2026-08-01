/** Shared application/job status labels and pipeline stage mapping. */

export const TRACKING_STATUSES = [
  "draft",
  "applied",
  "interview",
  "offer",
  "rejected",
] as const;

export type TrackingStatus = (typeof TRACKING_STATUSES)[number];

export const STATUS_OPTIONS: { value: TrackingStatus; label: string }[] = [
  { value: "draft", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

/** Positive pipeline path only — Rejected is a status badge, not a strip stage. */
export const PIPELINE_STAGES = ["saved", "applied", "interview", "offer"] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

const STATUS_LABEL_BY_VALUE: Record<TrackingStatus, string> = {
  draft: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

const STAGE_LABEL_BY_KEY: Record<PipelineStage, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
};

export function getStatusLabel(status: string): string {
  if (status in STATUS_LABEL_BY_VALUE) {
    return STATUS_LABEL_BY_VALUE[status as TrackingStatus];
  }
  return status;
}

export function getPipelineStageLabel(stage: PipelineStage): string {
  return STAGE_LABEL_BY_KEY[stage];
}

/** Returns null for rejected — strip should show no progress. */
export function mapStatusToPipelineStage(status: string): PipelineStage | null {
  switch (status) {
    case "draft":
    case "saved":
      return "saved";
    case "applied":
      return "applied";
    case "interview":
    case "interviewing":
      return "interview";
    case "offer":
    case "offered":
      return "offer";
    case "rejected":
      return null;
    default:
      return "applied";
  }
}

/** @deprecated Prefer mapStatusToPipelineStage */
export function mapJobStatusToPipelineStage(status: string): PipelineStage | null {
  return mapStatusToPipelineStage(status);
}

export function getFurthestPipelineStage(statuses: string[]): PipelineStage {
  if (statuses.length === 0) {
    return "saved";
  }

  let maxIndex = 0;
  let sawPositive = false;
  for (const status of statuses) {
    const stage = mapStatusToPipelineStage(status);
    if (stage == null) {
      continue;
    }
    sawPositive = true;
    const index = PIPELINE_STAGES.indexOf(stage);
    if (index > maxIndex) {
      maxIndex = index;
    }
  }

  return sawPositive ? PIPELINE_STAGES[maxIndex] : "saved";
}
