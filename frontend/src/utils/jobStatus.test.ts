import { describe, expect, it } from "vitest";

import {
  getFurthestPipelineStage,
  getStatusLabel,
  mapJobStatusToPipelineStage,
  mapStatusToPipelineStage,
} from "./jobStatus";

describe("jobStatus utils", () => {
  it("maps backend statuses to pipeline stages", () => {
    expect(mapStatusToPipelineStage("draft")).toBe("saved");
    expect(mapStatusToPipelineStage("applied")).toBe("applied");
    expect(mapStatusToPipelineStage("interview")).toBe("interview");
    expect(mapStatusToPipelineStage("offer")).toBe("offer");
    expect(mapStatusToPipelineStage("rejected")).toBeNull();
    expect(mapJobStatusToPipelineStage("draft")).toBe("saved");
  });

  it("uses consistent human labels", () => {
    expect(getStatusLabel("draft")).toBe("Saved");
    expect(getStatusLabel("rejected")).toBe("Rejected");
    expect(getStatusLabel("applied")).toBe("Applied");
  });

  it("returns the furthest stage across jobs", () => {
    expect(getFurthestPipelineStage(["applied", "interview"])).toBe("interview");
    expect(getFurthestPipelineStage([])).toBe("saved");
    expect(getFurthestPipelineStage(["rejected", "applied"])).toBe("applied");
    expect(getFurthestPipelineStage(["rejected"])).toBe("saved");
  });
});
