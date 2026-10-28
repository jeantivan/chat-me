import React, { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { useAuth } from "@/lib/auth/AuthContext.js";
import { useDialogContainer } from "@/components/DialogContainer";
import mc from "@/lib/utils/mergeClassnames.js";

interface AuthDialogProps {
  open: boolean;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function AuthDialog({ open }: AuthDialogProps) {
  const { login, register, error: contextError } = useAuth();
  const { container } = useDialogContainer();

  const [tab, setTab] = useState<"login" | "register">("login");

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  // Validation & error states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const newErrors: { [key: string]: string } = {};

    if (!isValidEmail(loginEmail)) {
      newErrors.loginEmail = "Please enter a valid email";
    }
    if (!loginPassword) {
      newErrors.loginPassword = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to log in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (email: string) => {
    setServerError(null);
    setErrors({});
    setLoginEmail(email);
    setLoginPassword("Password123!");
    setIsSubmitting(true);
    try {
      await login(email, "Password123!");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to log in with demo account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const newErrors: { [key: string]: string } = {};

    if (!registerName.trim()) {
      newErrors.registerName = "Please enter your name";
    }
    if (!isValidEmail(registerEmail)) {
      newErrors.registerEmail = "Please enter a valid email";
    }
    if (!registerPassword || registerPassword.length < 6) {
      newErrors.registerPassword = "Password must be at least 6 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await register(registerEmail, registerPassword, registerName.trim());
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open}>
      <DialogPrimitive.Portal container={container}>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className={mc(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
            "bg-background-2 border border-background-6 text-background-12 rounded-2xl p-6 shadow-2xl",
            "focus:outline-none"
          )}
        >
          <DialogPrimitive.Title className="text-2xl font-bold text-center mb-1 text-background-12">
            Welcome to ChatMe
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="text-sm text-center text-background-11 mb-6">
            Log in to your account or register to start messaging.
          </DialogPrimitive.Description>

          {(serverError || contextError) && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-sm rounded-lg text-center">
              {serverError || contextError}
            </div>
          )}

          <TabsPrimitive.Root
            value={tab}
            onValueChange={(val) => {
              setTab(val as "login" | "register");
              setErrors({});
              setServerError(null);
            }}
          >
            <TabsPrimitive.List className="grid grid-cols-2 rounded-lg bg-background-4 p-1 mb-6">
              <TabsPrimitive.Trigger
                value="login"
                className={mc(
                  "py-2 text-sm font-medium rounded-md transition-all",
                  "text-background-11 data-[state=active]:bg-background-2 data-[state=active]:text-background-12 shadow-sm"
                )}
              >
                Log In
              </TabsPrimitive.Trigger>
              <TabsPrimitive.Trigger
                value="register"
                className={mc(
                  "py-2 text-sm font-medium rounded-md transition-all",
                  "text-background-11 data-[state=active]:bg-background-2 data-[state=active]:text-background-12 shadow-sm"
                )}
              >
                Register
              </TabsPrimitive.Trigger>
            </TabsPrimitive.List>

            {/* Login Tab Content */}
            <TabsPrimitive.Content value="login">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold uppercase text-background-11 mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className={mc(
                      "w-full px-3 py-2 rounded-lg bg-background-3 border text-background-12",
                      "focus:outline-none focus:ring-2 focus:ring-primary-9 transition-all text-sm",
                      errors.loginEmail ? "border-red-500" : "border-background-6"
                    )}
                    placeholder="you@example.com"
                  />
                  {errors.loginEmail && (
                    <p className="mt-1 text-xs text-red-500">{errors.loginEmail}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold uppercase text-background-11 mb-1.5"
                  >
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={mc(
                      "w-full px-3 py-2 rounded-lg bg-background-3 border text-background-12",
                      "focus:outline-none focus:ring-2 focus:ring-primary-9 transition-all text-sm",
                      errors.loginPassword ? "border-red-500" : "border-background-6"
                    )}
                    placeholder="••••••••"
                  />
                  {errors.loginPassword && (
                    <p className="mt-1 text-xs text-red-500">{errors.loginPassword}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={mc(
                    "w-full py-2.5 px-4 mt-2 rounded-lg font-semibold text-sm",
                    "bg-primary-9 hover:bg-primary-10 text-neutral-950 transition-colors shadow-md",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? "Logging in..." : "Log In"}
                </button>

                <div className="pt-3 mt-4 border-t border-background-6">
                  <p className="text-xs font-medium text-center text-background-11 mb-2.5">
                    Quick Demo Access (Seeded Accounts)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleDemoLogin("alice@example.com")}
                      className={mc(
                        "py-2 px-3 rounded-lg text-xs font-semibold transition-colors",
                        "bg-background-4 hover:bg-background-5 text-background-12 border border-background-6",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      Demo as Alice
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleDemoLogin("bob@example.com")}
                      className={mc(
                        "py-2 px-3 rounded-lg text-xs font-semibold transition-colors",
                        "bg-background-4 hover:bg-background-5 text-background-12 border border-background-6",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      Demo as Bob
                    </button>
                  </div>
                </div>
              </form>
            </TabsPrimitive.Content>

            {/* Register Tab Content */}
            <TabsPrimitive.Content value="register">
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="register-name"
                    className="block text-xs font-semibold uppercase text-background-11 mb-1.5"
                  >
                    Full Name
                  </label>
                  <input
                    id="register-name"
                    type="text"
                    autoComplete="name"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className={mc(
                      "w-full px-3 py-2 rounded-lg bg-background-3 border text-background-12",
                      "focus:outline-none focus:ring-2 focus:ring-primary-9 transition-all text-sm",
                      errors.registerName ? "border-red-500" : "border-background-6"
                    )}
                    placeholder="Alex Morgan"
                  />
                  {errors.registerName && (
                    <p className="mt-1 text-xs text-red-500">{errors.registerName}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="register-email"
                    className="block text-xs font-semibold uppercase text-background-11 mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className={mc(
                      "w-full px-3 py-2 rounded-lg bg-background-3 border text-background-12",
                      "focus:outline-none focus:ring-2 focus:ring-primary-9 transition-all text-sm",
                      errors.registerEmail ? "border-red-500" : "border-background-6"
                    )}
                    placeholder="you@example.com"
                  />
                  {errors.registerEmail && (
                    <p className="mt-1 text-xs text-red-500">{errors.registerEmail}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="register-password"
                    className="block text-xs font-semibold uppercase text-background-11 mb-1.5"
                  >
                    Password
                  </label>
                  <input
                    id="register-password"
                    type="password"
                    autoComplete="new-password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className={mc(
                      "w-full px-3 py-2 rounded-lg bg-background-3 border text-background-12",
                      "focus:outline-none focus:ring-2 focus:ring-primary-9 transition-all text-sm",
                      errors.registerPassword ? "border-red-500" : "border-background-6"
                    )}
                    placeholder="••••••••"
                  />
                  {errors.registerPassword && (
                    <p className="mt-1 text-xs text-red-500">{errors.registerPassword}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={mc(
                    "w-full py-2.5 px-4 mt-2 rounded-lg font-semibold text-sm",
                    "bg-primary-9 hover:bg-primary-10 text-neutral-950 transition-colors shadow-md",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? "Creating Account..." : "Create Account"}
                </button>
              </form>
            </TabsPrimitive.Content>
          </TabsPrimitive.Root>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
