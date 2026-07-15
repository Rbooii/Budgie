"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AuthInput } from "@/components/auth-input";
import { Button } from "@/components/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { FaGoogle, FaGithub } from "react-icons/fa";

export function SignInForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "github" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === "signup";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignup) {
        const { error } = await authClient.signUp.email({
          email,
          password,
          name: name || "User",
        });
        if (error) throw new Error(error.message ?? "Sign up failed");
      } else {
        const { error } = await authClient.signIn.email({
          email,
          password,
        });
        if (error) throw new Error(error.message ?? "Sign in failed");
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleSocial(provider: "google" | "github") {
    setSocialLoading(provider);
    setError(null);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "/dashboard",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Social sign in failed");
      setSocialLoading(null);
    }
  }

  function toggleMode() {
    setMode(isSignup ? "signin" : "signup");
    setError(null);
  }

  return (
    <main className="w-full min-h-screen bg-[#00CE11] flex items-center justify-center p-6 sm:p-8">
      <div className="w-82 h-fit">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          {isSignup ? "Sign up" : "Sign in"}
        </h1>
        <p className="text-xs mt-2 text-white/80 leading-relaxed">
          By {isSignup ? "creating an account" : "signing in"} you acknowledge
          that this is your personal budgie account and you will never share
          your credentials with anyone else.
        </p>

        <div className="grid gap-3 mt-5">
          <Button
            type="button"
            variant="outline"
            fullWidth
            loading={socialLoading === "google"}
            leadingIcon={<FaGoogle className="text-[18px]" />}
            onClick={() => handleSocial("google")}
          >
            Continue with Google
          </Button>
          <Button
            type="button"
            variant="outline"
            fullWidth
            loading={socialLoading === "github"}
            leadingIcon={<FaGithub className="text-[18px]" />}
            onClick={() => handleSocial("github")}
          >
            Continue with GitHub
          </Button>
        </div>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/30" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#00CE11] px-2 text-xs text-white/80 font-medium">
              or
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-[9px]">
          {isSignup && (
            <AuthInput
              type="text"
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <AuthInput
            type="email"
            placeholder="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <AuthInput
            type="password"
            placeholder="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="flex items-center gap-2 text-sm text-white/90 bg-white/15 border border-white/25 backdrop-blur-sm rounded-[20px] px-4 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => router.push("/")} aria-label="Back to home">
              <ArrowLeft className="w-[24px] h-[24px]" />
            </Button>
            <Button type="submit" variant="primary" loading={loading} fullWidth>
              {isSignup ? "Sign up" : "Sign in"}
            </Button>
          </div>
        </form>

        <p className="text-center text-xs mt-5 text-white/80">
          {isSignup ? "Already have an account?" : "No account?"}{" "}
          <button
            type="button"
            onClick={toggleMode}
            className="font-bold text-white underline underline-offset-2"
          >
            {isSignup ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </main>
  );
}