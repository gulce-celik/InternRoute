import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";

import DashboardPage from "./Dashboard";
import { AuthProvider } from "../hooks/useAuth";
import { renderWithRouter } from "../test/test-utils";

vi.mock("../services/api", () => ({
  getCurrentUser: vi.fn(),
  getProfile: vi.fn().mockResolvedValue({
    id: 1,
    email: "student@example.com",
    full_name: "Test Student",
    university: null,
    study_year: null,
    major: null,
    target_sectors: null,
  }),
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  getDashboardStats: vi.fn().mockResolvedValue({
    job_count: 1,
    cv_count: 2,
    application_count: 1,
    interview_count: 0,
    offer_count: 0,
    furthest_pipeline_stage: "applied",
  }),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    localStorage.setItem("internroute_token", "test-token");
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders stat cards and pipeline strip", async () => {
    renderWithRouter(
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>,
    );

    expect(screen.getByRole("heading", { name: /internship command desk/i })).toBeInTheDocument();
    expect(screen.getByText("Applications")).toBeInTheDocument();
    expect(screen.getByText("CV Versions")).toBeInTheDocument();
    expect(screen.getByLabelText("Application pipeline")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/ready in your locker for pipeline matching/i)).toBeInTheDocument();
      expect(document.querySelectorAll(".stat-value")[0]?.textContent).toBe("1");
    });
  });
});
