import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const userPatchMock = vi.fn();
const checkoutMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("@/lib/api-client", () => ({
  api: {
    user: {
      $patch: (...args: unknown[]) => userPatchMock(...args),
    },
    plus: {
      checkout: {
        $post: (...args: unknown[]) => checkoutMock(...args),
      },
      status: {
        ":orderId": {
          $get: vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ transactionStatus: "pending", plus: false }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          ),
        },
      },
      "simulate-payment": {
        ":orderId": {
          $post: vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ transactionStatus: "settlement" }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          ),
        },
      },
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

import UpgradePlusButton from "@/components/upgradePlusButton";

function okResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  userPatchMock.mockResolvedValue(okResponse({ plus: false }));
  checkoutMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        orderId: "ORDER-1",
        qrString: "000201test",
        status: "pending",
        expiresAt: new Date(Date.now() + 900000).toISOString(),
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    ),
  );
});

describe("UpgradePlusButton — plus=false (upgrade flow)", () => {
  it("renders 'Upgrade to Plus' trigger button", () => {
    render(<UpgradePlusButton plus={false} />);
    expect(screen.getByText("Upgrade to Plus")).toBeInTheDocument();
  });

  it("opens the payment wizard dialog on click (step 1)", async () => {
    const user = userEvent.setup();
    render(<UpgradePlusButton plus={false} />);
    await user.click(screen.getByText("Upgrade to Plus"));
    expect(await screen.findByText("Continue to pay")).toBeInTheDocument();
  });

  it("does NOT call api.user.$patch when upgrading (payment wizard handles it)", async () => {
    const user = userEvent.setup();
    render(<UpgradePlusButton plus={false} />);
    await user.click(screen.getByText("Upgrade to Plus"));
    await screen.findByText("Continue to pay");
    expect(userPatchMock).not.toHaveBeenCalled();
  });
});

describe("UpgradePlusButton — plus=true (downgrade flow)", () => {
  it("renders 'Downgrade to Free' button", () => {
    render(<UpgradePlusButton plus={true} />);
    expect(screen.getByText("Downgrade to Free")).toBeInTheDocument();
  });

  it("PATCHes { plus: false } when downgrading", async () => {
    const user = userEvent.setup();
    render(<UpgradePlusButton plus={true} />);
    await user.click(screen.getByText("Downgrade to Free"));
    expect(userPatchMock).toHaveBeenCalledWith({ json: { plus: false } });
  });

  it("calls router.refresh() after a successful downgrade", async () => {
    const user = userEvent.setup();
    render(<UpgradePlusButton plus={true} />);
    await user.click(screen.getByText("Downgrade to Free"));
    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
  });

  it("shows an error pill when the API returns a non-OK response", async () => {
    userPatchMock.mockResolvedValue(errorResponse("Something went wrong", 500));
    const user = userEvent.setup();
    render(<UpgradePlusButton plus={true} />);
    await user.click(screen.getByText("Downgrade to Free"));
    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("shows a default error message when the API throws", async () => {
    userPatchMock.mockRejectedValue(new Error("network"));
    const user = userEvent.setup();
    render(<UpgradePlusButton plus={true} />);
    await user.click(screen.getByText("Downgrade to Free"));
    expect(await screen.findByText("Failed to downgrade")).toBeInTheDocument();
  });
});
