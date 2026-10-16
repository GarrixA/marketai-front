import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname, useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardLayout from "@/app/dashboard/layout";
import DashboardPage from "@/app/dashboard/page";
import SokoApp from "@/components/SokoApp";
import StoreProvider from "@/components/providers/StoreProvider";
import type { UserSession } from "@/lib/session";

const loginMock = vi.fn();
const logoutMock = vi.fn();

vi.mock("@/services/auth.service", () => ({
  authService: {
    login: (...args: unknown[]) => loginMock(...args),
    register: vi.fn(),
    logout: () => logoutMock(),
    formatError: (error: unknown) =>
      error instanceof Error ? error.message : "Login failed",
  },
}));

const buyerSession: UserSession = {
  token: "test-token",
  userId: "user-buyer",
  role: "buyer",
  name: "Aline Kabera",
  email: "buyer@soko.rw",
  businessName: "Aline Kabera",
  roles: ["BUYER"],
};

const logisticsSession: UserSession = {
  token: "test-token-logistics",
  userId: "user-logistics",
  role: "logistics",
  name: "Jean Niyonzima",
  email: "logistics@soko.rw",
  businessName: "Jean Niyonzima",
  roles: ["DRIVER"],
};

async function signInAs(
  user: ReturnType<typeof userEvent.setup>,
  email: string,
  password: string
) {
  await user.click(screen.getByRole("button", { name: /Log in/i }));
  await user.type(screen.getByPlaceholderText("name@company.rw"), email);
  await user.type(screen.getByPlaceholderText("Enter your password"), password);
  await user.click(screen.getByRole("button", { name: /Sign in/i }));
  await waitFor(() => {
    expect(localStorage.getItem("soko_user_session")).toBeTruthy();
  });
}

function renderWithStore(ui: React.ReactElement) {
  return render(<StoreProvider>{ui}</StoreProvider>);
}

function renderDashboard() {
  return renderWithStore(
    <DashboardLayout>
      <DashboardPage />
    </DashboardLayout>
  );
}

describe("SokoApp", () => {
  beforeEach(() => {
    localStorage.clear();
    loginMock.mockReset();
    logoutMock.mockReset();
    vi.mocked(usePathname).mockReturnValue("/dashboard");
  });

  it("renders the public marketplace", () => {
    renderWithStore(<SokoApp />);

    expect(
      screen.getByRole("heading", { name: /Reliable supply/i })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Soko home" }).length
    ).toBeGreaterThan(0);
  });

  it("opens login modal and redirects buyer to /dashboard", async () => {
    const user = userEvent.setup();
    const push = vi.fn();
    loginMock.mockResolvedValue(buyerSession);
    vi.mocked(useRouter).mockReturnValue({
      push,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    });

    renderWithStore(<SokoApp />);
    await signInAs(user, "buyer@soko.rw", "buyer12345");

    expect(loginMock).toHaveBeenCalledWith({
      email: "buyer@soko.rw",
      password: "buyer12345",
    });
    expect(
      JSON.parse(localStorage.getItem("soko_user_session")!)
    ).toMatchObject({
      role: "buyer",
      email: "buyer@soko.rw",
    });
    expect(localStorage.getItem("soko_access_token")).toBeNull();
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("switches from login to the register form", async () => {
    const user = userEvent.setup();
    renderWithStore(<SokoApp />);

    await user.click(screen.getByRole("button", { name: /Log in/i }));
    await user.click(
      screen.getByRole("button", { name: /Create an account/i })
    );

    expect(
      screen.getByRole("heading", { name: /Join Soko/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Create account/i })
    ).toBeInTheDocument();
  });

  it("logs in a logistics user and stores the logistics role", async () => {
    const user = userEvent.setup();
    const push = vi.fn();
    loginMock.mockResolvedValue(logisticsSession);
    vi.mocked(useRouter).mockReturnValue({
      push,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    });

    renderWithStore(<SokoApp />);
    await signInAs(user, "logistics@soko.rw", "logistics123");

    expect(
      JSON.parse(localStorage.getItem("soko_user_session")!)
    ).toMatchObject({
      role: "logistics",
      email: "logistics@soko.rw",
    });
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("renders the buyer dashboard from local storage on /dashboard", async () => {
    localStorage.setItem("soko_user_session", JSON.stringify(buyerSession));
    localStorage.setItem("soko_access_token", buyerSession.token);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Soko workspace")).toBeInTheDocument();
      expect(screen.getByText(/Good morning/i)).toBeInTheDocument();
    });
  });

  it("logs out from the dashboard and clears the session", async () => {
    const user = userEvent.setup();
    const push = vi.fn();
    logoutMock.mockImplementation(() => {
      localStorage.removeItem("soko_user_session");
      localStorage.removeItem("soko_access_token");
    });
    vi.mocked(useRouter).mockReturnValue({
      push,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    });

    localStorage.setItem("soko_user_session", JSON.stringify(buyerSession));
    localStorage.setItem("soko_access_token", buyerSession.token);

    renderDashboard();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Log out/i })
      ).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /Log out/i }));

    expect(logoutMock).toHaveBeenCalled();
    expect(localStorage.getItem("soko_user_session")).toBeNull();
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/");
    });
  });
});
