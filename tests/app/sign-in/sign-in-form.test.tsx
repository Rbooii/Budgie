import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const signInEmailMock = vi.fn();
const signUpEmailMock = vi.fn();
const signInSocialMock = vi.fn();
const pushMock = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      email: (...args: unknown[]) => signInEmailMock(...args),
      social: (...args: unknown[]) => signInSocialMock(...args),
    },
    signUp: {
      email: (...args: unknown[]) => signUpEmailMock(...args),
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import { SignInForm } from "@/app/sign-in/sign-in-form";

beforeEach(() => {
  vi.clearAllMocks();
  signInEmailMock.mockResolvedValue({ error: null });
  signUpEmailMock.mockResolvedValue({ error: null });
  signInSocialMock.mockResolvedValue({});
});

describe("SignInForm — default (sign in mode)", () => {
  it("renders the 'Sign in' heading", () => {
    render(<SignInForm />);
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });

  it("renders email and password inputs", () => {
    render(<SignInForm />);
    expect(screen.getByPlaceholderText("email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("password")).toBeInTheDocument();
  });

  it("does not render the name field in sign-in mode", () => {
    render(<SignInForm />);
    expect(screen.queryByPlaceholderText("Name (optional)")).not.toBeInTheDocument();
  });

  it("renders Google and GitHub social buttons", () => {
    render(<SignInForm />);
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
    expect(screen.getByText("Continue with GitHub")).toBeInTheDocument();
  });

  it("renders a toggle to sign up", () => {
    render(<SignInForm />);
    expect(screen.getByText("No account?")).toBeInTheDocument();
    expect(screen.getByText("Sign up")).toBeInTheDocument();
  });
});

describe("SignInForm — toggle to signup", () => {
  it("switches to 'Sign up' heading when the toggle is clicked", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);
    await user.click(screen.getByText("Sign up"));
    expect(screen.getAllByText("Sign up").length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText("Name (optional)")).toBeInTheDocument();
  });

  it("switches back to sign in when toggled again", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);
    await user.click(screen.getByText("Sign up"));
    await user.click(screen.getByText("Sign in"));
    expect(screen.queryByPlaceholderText("Name (optional)")).not.toBeInTheDocument();
  });
});

describe("SignInForm — email sign in", () => {
  it("calls authClient.signIn.email with email and password", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);
    await user.type(screen.getByPlaceholderText("email"), "test@test.com");
    await user.type(screen.getByPlaceholderText("password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(signInEmailMock).toHaveBeenCalled());
    const call = signInEmailMock.mock.calls[0][0];
    expect(call).toMatchObject({ email: "test@test.com", password: "password123" });
  });

  it("navigates to /dashboard on successful sign in", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);
    await user.type(screen.getByPlaceholderText("email"), "test@test.com");
    await user.type(screen.getByPlaceholderText("password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard"));
  });

  it("shows an error when sign in fails", async () => {
    signInEmailMock.mockResolvedValue({ error: { message: "Invalid credentials" } });
    const user = userEvent.setup();
    render(<SignInForm />);
    await user.type(screen.getByPlaceholderText("email"), "test@test.com");
    await user.type(screen.getByPlaceholderText("password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });
});

describe("SignInForm — email sign up", () => {
  it("calls authClient.signUp.email with name, email, and password", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);
    await user.click(screen.getByText("Sign up"));
    await user.type(screen.getByPlaceholderText("Name (optional)"), "John");
    await user.type(screen.getByPlaceholderText("email"), "john@test.com");
    await user.type(screen.getByPlaceholderText("password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign up" }));
    await waitFor(() => expect(signUpEmailMock).toHaveBeenCalled());
    const call = signUpEmailMock.mock.calls[0][0];
    expect(call).toMatchObject({ name: "John", email: "john@test.com", password: "password123" });
  });

  it("defaults name to 'User' when the name field is empty", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);
    await user.click(screen.getByText("Sign up"));
    await user.type(screen.getByPlaceholderText("email"), "john@test.com");
    await user.type(screen.getByPlaceholderText("password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign up" }));
    await waitFor(() => expect(signUpEmailMock).toHaveBeenCalled());
    const call = signUpEmailMock.mock.calls[0][0];
    expect(call.name).toBe("User");
  });
});

describe("SignInForm — social sign in", () => {
  it("calls authClient.signIn.social with the google provider", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);
    await user.click(screen.getByText("Continue with Google"));
    await waitFor(() => expect(signInSocialMock).toHaveBeenCalled());
    const call = signInSocialMock.mock.calls[0][0];
    expect(call).toMatchObject({ provider: "google", callbackURL: "/dashboard" });
  });

  it("calls authClient.signIn.social with the github provider", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);
    await user.click(screen.getByText("Continue with GitHub"));
    await waitFor(() => expect(signInSocialMock).toHaveBeenCalled());
    const call = signInSocialMock.mock.calls[0][0];
    expect(call).toMatchObject({ provider: "github" });
  });
});
