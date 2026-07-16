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
  startRegistration: vi.fn(),
  verifyRegistration: vi.fn(),
  resendRegistrationCode: vi.fn(),
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
    localStorage.setItem("internroute_home_tour_done", "1");
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders living desk hub with flow zones", async () => {
    renderWithRouter(
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>,
    );

    expect(screen.getByRole("heading", { name: /this is your home base/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Your InternRoute desk")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pinned roles" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "CV versions" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Applications" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Where applications move" })).not.toBeInTheDocument();
    expect(screen.queryByText("then")).not.toBeInTheDocument();
    expect(document.querySelectorAll(".desk-flow-chevron")).toHaveLength(2);

    await waitFor(() => {
      expect(screen.getByText(/1 pinned · 2 in locker · 1 in pipeline/i)).toBeInTheDocument();
      expect(screen.getByText("role")).toBeInTheDocument();
      expect(screen.getByText("versions")).toBeInTheDocument();
    });
  });
});
