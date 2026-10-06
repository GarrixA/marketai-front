import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname, useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardLayout from "@/app/dashboard/layout";
import DashboardPage from "@/app/dashboard/page";
import SokoApp from "@/components/SokoApp";

vi.mock("@/lib/actionDelay", () => ({
  ACTION_DELAY_MS: 0,
  waitForAction: () => Promise.resolve(),
}));

async function signInAs(
  user: ReturnType<typeof userEvent.setup>,
  email: string,
  password: string
) {
  await user.click(screen.getByRole("button", { name: "Log in" }));
  await user.type(screen.getByPlaceholderText("name@company.rw"), email);
  await user.type(screen.getByPlaceholderText("Enter your password"), password);
  await user.click(screen.getByRole("button", { name: /Sign in/i }));
  await waitFor(() => {
    expect(localStorage.getItem("soko_user_session")).toBeTruthy();
  });
}

function renderDashboard() {
  return render(
    <DashboardLayout>
      <DashboardPage />
    </DashboardLayout>
  );
}

describe("SokoApp", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(usePathname).mockReturnValue("/dashboard");
  });

  it("renders the public marketplace", () => {
    render(<SokoApp />);

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
    vi.mocked(useRouter).mockReturnValue({
      push,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    });

    render(<SokoApp />);
    await signInAs(user, "buyer@soko.rw", "buyer123");

    expect(JSON.parse(localStorage.getItem("soko_user_session")!)).toMatchObject(
      {
        role: "buyer",
        email: "buyer@soko.rw",
      }
    );
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("logs in a logistics user and stores the logistics role", async () => {
    const user = userEvent.setup();
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    });

    render(<SokoApp />);
    await signInAs(user, "logistics@soko.rw", "logistics123");

    expect(JSON.parse(localStorage.getItem("soko_user_session")!)).toMatchObject(
      {
        role: "logistics",
        email: "logistics@soko.rw",
      }
    );
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("renders the buyer dashboard from local storage on /dashboard", async () => {
    localStorage.setItem(
      "soko_user_session",
      JSON.stringify({
        role: "buyer",
        name: "Aline Kabera",
        email: "buyer@soko.rw",
        businessName: "Kigali Fresh Foods",
      })
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Soko workspace")).toBeInTheDocument();
      expect(screen.getByText(/Good morning/i)).toBeInTheDocument();
    });
  });

  it("logs out from the dashboard and clears the session", async () => {
    const user = userEvent.setup();
    const push = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    });

    localStorage.setItem(
      "soko_user_session",
      JSON.stringify({
        role: "buyer",
        name: "Aline Kabera",
        email: "buyer@soko.rw",
        businessName: "Kigali Fresh Foods",
      })
    );

    renderDashboard();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Log out/i })
      ).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /Log out/i }));

    expect(localStorage.getItem("soko_user_session")).toBeNull();
    expect(push).toHaveBeenCalledWith("/");
  });
});
