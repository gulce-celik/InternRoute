import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import LoginPage from "./Login";
import { AuthProvider } from "../hooks/useAuth";
import { renderWithRouter } from "../test/test-utils";

vi.mock("../services/api", () => ({
  getCurrentUser: vi.fn(),
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  loginUser: vi.fn(),
  startRegistration: vi.fn(),
  verifyRegistration: vi.fn(),
  resendRegistrationCode: vi.fn(),
}));

describe("LoginPage", () => {
  it("renders sign-in form and hero copy", () => {
    renderWithRouter(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );

    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/stop losing track of applications/i)).toBeInTheDocument();
  });

  it("links to register page", () => {
    renderWithRouter(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );
    expect(screen.getByRole("link", { name: /create your free account/i })).toHaveAttribute(
      "href",
      "/register",
    );
  });
});
