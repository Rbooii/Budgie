import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";

const checkoutMock = vi.fn();
const statusGetMock = vi.fn();
const simulatePaymentMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("@/lib/api-client", () => ({
  api: {
    plus: {
      checkout: {
        $post: (...args: unknown[]) => checkoutMock(...args),
      },
      status: {
        ":orderId": {
          $get: (...args: unknown[]) => statusGetMock(...args),
        },
      },
      "simulate-payment": {
        ":orderId": {
          $post: (...args: unknown[]) => simulatePaymentMock(...args),
        },
      },
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

import { PlusPaymentWizard } from "@/components/plus-payment-wizard";

function okCheckout() {
  return new Response(
    JSON.stringify({
      orderId: "ORDER-1",
      qrString: "00020101021226test",
      status: "pending",
      expiresAt: new Date(Date.now() + 900000).toISOString(),
    }),
    { status: 201, headers: { "Content-Type": "application/json" } },
  );
}

function okStatus(transactionStatus: string, plus: boolean) {
  return new Response(
    JSON.stringify({ transactionStatus, plus }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function okSimulate(transactionStatus: string) {
  return new Response(
    JSON.stringify({ transactionStatus }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  checkoutMock.mockResolvedValue(okCheckout());
  statusGetMock.mockResolvedValue(okStatus("pending", false));
  simulatePaymentMock.mockResolvedValue(okSimulate("settlement"));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("PlusPaymentWizard", () => {
  it("renders trigger button initially", () => {
    render(<PlusPaymentWizard />);
    expect(screen.getByText("Upgrade Now")).toBeInTheDocument();
  });

  it("accepts custom trigger label", () => {
    render(
      <PlusPaymentWizard triggerLabel="Upgrade to Plus" triggerVariant="success" />,
    );
    expect(screen.getByText("Upgrade to Plus")).toBeInTheDocument();
  });

  it("opens step 1 (package summary) when trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<PlusPaymentWizard />);
    await user.click(screen.getByText("Upgrade Now"));
    expect(await screen.findByText("Continue to pay")).toBeInTheDocument();
  });

  it("shows the first-month discount price on step 1", async () => {
    const user = userEvent.setup();
    render(<PlusPaymentWizard />);
    await user.click(screen.getByText("Upgrade Now"));
    expect(await screen.findByText("Continue to pay")).toBeInTheDocument();
    expect(screen.getAllByText(/24.500/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/49.000/).length).toBeGreaterThanOrEqual(2);
  });

  it("proceeds to step 2 (QRIS) after clicking Continue to pay", async () => {
    const user = userEvent.setup();
    render(<PlusPaymentWizard />);
    await user.click(screen.getByText("Upgrade Now"));
    await user.click(await screen.findByText("Continue to pay"));
    expect(await screen.findByText("Scan with your e-wallet")).toBeInTheDocument();
    expect(screen.getByText("I've paid")).toBeInTheDocument();
    expect(checkoutMock).toHaveBeenCalled();
  });

  it("shows an error when checkout fails", async () => {
    checkoutMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "Checkout failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const user = userEvent.setup();
    render(<PlusPaymentWizard />);
    await user.click(screen.getByText("Upgrade Now"));
    await user.click(await screen.findByText("Continue to pay"));
    expect(await screen.findByText("Checkout failed")).toBeInTheDocument();
  });

  it("transitions to step 3 (success) after clicking I've paid", async () => {
    const user = userEvent.setup();
    render(<PlusPaymentWizard />);
    await user.click(screen.getByText("Upgrade Now"));
    await user.click(await screen.findByText("Continue to pay"));
    await screen.findByText("Scan with your e-wallet");
    await user.click(screen.getByText("I've paid"));
    expect(await screen.findByText("Welcome to Budgie Plus")).toBeInTheDocument();
    expect(simulatePaymentMock).toHaveBeenCalledWith({
      param: { orderId: "ORDER-1" },
    });
  });

  it("calls router.refresh() and closes when Done is clicked", async () => {
    const user = userEvent.setup();
    render(<PlusPaymentWizard />);
    await user.click(screen.getByText("Upgrade Now"));
    await user.click(await screen.findByText("Continue to pay"));
    await screen.findByText("Scan with your e-wallet");
    await user.click(screen.getByText("I've paid"));
    const doneBtn = await screen.findByText("Done");
    await user.click(doneBtn);
    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("Welcome to Budgie Plus")).not.toBeInTheDocument();
  });

  it("closes the dialog on Cancel from step 2", async () => {
    const user = userEvent.setup();
    render(<PlusPaymentWizard />);
    await user.click(screen.getByText("Upgrade Now"));
    await user.click(await screen.findByText("Continue to pay"));
    await screen.findByText("Scan with your e-wallet");
    await user.click(screen.getByText("Cancel"));
    await waitFor(() =>
      expect(screen.queryByText("Scan with your e-wallet")).not.toBeInTheDocument(),
    );
  });
});

describe("PlusPaymentWizard — status polling", () => {
  function reachStep2() {
    render(<PlusPaymentWizard />);
    fireEvent.click(screen.getByText("Upgrade Now"));
    fireEvent.click(screen.getByText("Continue to pay"));
    return act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  beforeEach(() => {
    vi.useFakeTimers();
    // clear any unconsumed mockResolvedValueOnce queues from prior tests
    statusGetMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("auto-advances to success when polling reports settlement", async () => {
    statusGetMock
      .mockResolvedValueOnce(okStatus("pending", false))
      .mockResolvedValueOnce(okStatus("settlement", true));
    await reachStep2();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000); // first poll → still pending
    });
    expect(statusGetMock).toHaveBeenCalledWith({ param: { orderId: "ORDER-1" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000); // second poll → settlement
    });
    expect(screen.getByText("Welcome to Budgie Plus")).toBeInTheDocument();
  });

  it("shows the expiry error when polling reports expire", async () => {
    statusGetMock.mockResolvedValue(okStatus("expire", false));
    await reachStep2();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(
      screen.getByText("Payment expired or cancelled. Please try again."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Welcome to Budgie Plus")).not.toBeInTheDocument();
  });

  it("shows the expiry error when polling reports cancel", async () => {
    statusGetMock.mockResolvedValue(okStatus("cancel", false));
    await reachStep2();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(
      screen.getByText("Payment expired or cancelled. Please try again."),
    ).toBeInTheDocument();
  });

  it("keeps polling while the status stays pending", async () => {
    statusGetMock.mockResolvedValue(okStatus("pending", false));
    await reachStep2();
    const callsAfterSetup = statusGetMock.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(statusGetMock.mock.calls.length).toBe(callsAfterSetup + 1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(statusGetMock.mock.calls.length).toBe(callsAfterSetup + 2);
  });

  it("stops polling once the status is terminal", async () => {
    statusGetMock
      .mockResolvedValueOnce(okStatus("pending", false))
      .mockResolvedValueOnce(okStatus("settlement", true));
    await reachStep2();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000); // poll #1 → pending
    });
    const callsAfterPendingPoll = statusGetMock.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000); // poll #2 → settlement → stop
    });
    expect(statusGetMock.mock.calls.length).toBe(callsAfterPendingPoll + 1);
    expect(screen.getByText("Welcome to Budgie Plus")).toBeInTheDocument();
    const callsAfterSettlement = statusGetMock.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000 * 3);
    });
    expect(statusGetMock.mock.calls.length).toBe(callsAfterSettlement);
  });
});
