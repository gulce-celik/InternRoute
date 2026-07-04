import { describe, expect, it } from "vitest";

import {
  getFurthestPipelineStage,
  mapJobStatusToPipelineStage,
} from "./jobStatus";

describe("jobStatus utils", () => {
  it("maps backend statuses to pipeline stages", () => {
    expect(mapJobStatusToPipelineStage("draft")).toBe("saved");
    expect(mapJobStatusToPipelineStage("applied")).toBe("applied");
    expect(mapJobStatusToPipelineStage("interview")).toBe("interview");
    expect(mapJobStatusToPipelineStage("offer")).toBe("offer");
  });

  it("returns the furthest stage across jobs", () => {
    expect(getFurthestPipelineStage(["applied", "interview"])).toBe("interview");
    expect(getFurthestPipelineStage([])).toBe("saved");
  });
});
