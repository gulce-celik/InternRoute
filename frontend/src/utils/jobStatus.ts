export const PIPELINE_STAGES = ["saved", "applied", "interview", "offer"] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export function mapJobStatusToPipelineStage(status: string): PipelineStage {
  switch (status) {
    case "draft":
      return "saved";
    case "applied":
      return "applied";
    case "interview":
    case "interviewing":
      return "interview";
    case "offer":
    case "offered":
      return "offer";
    default:
      return "applied";
  }
}

export function getFurthestPipelineStage(statuses: string[]): PipelineStage {
  if (statuses.length === 0) {
    return "saved";
  }

  let maxIndex = 0;
  for (const status of statuses) {
    const stage = mapJobStatusToPipelineStage(status);
    const index = PIPELINE_STAGES.indexOf(stage);
    if (index > maxIndex) {
      maxIndex = index;
    }
  }

  return PIPELINE_STAGES[maxIndex];
}
