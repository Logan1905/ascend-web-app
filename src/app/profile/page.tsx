"use client";

import { useState } from "react";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="bg-accent mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
            <User className="text-muted-foreground size-8" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {mode === "login"
              ? "Sign in to access your fitness data"
              : "Get started on your fitness journey"}
          </p>
        </div>

        {/* Form */}
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            // TODO: handle auth when backend is connected
          }}
        >
          {/* Name field (register only) */}
          {mode === "register" && (
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="text-foreground text-sm font-medium"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 w-full rounded-lg border pr-3 pl-10 text-sm transition-colors outline-none focus:ring-2"
                />
              </div>
            </div>
          )}

          {/* Email field */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-foreground text-sm font-medium"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 w-full rounded-lg border pr-3 pl-10 text-sm transition-colors outline-none focus:ring-2"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-foreground text-sm font-medium"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 w-full rounded-lg border pr-10 pl-10 text-sm transition-colors outline-none focus:ring-2"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm password (register only) */}
          {mode === "register" && (
            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="text-foreground text-sm font-medium"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="border-input bg-background focus:border-ring focus:ring-ring/20 h-10 w-full rounded-lg border pr-3 pl-10 text-sm transition-colors outline-none focus:ring-2"
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <Button className="w-full" size="lg">
            {mode === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        {/* Toggle mode */}
        <p className="text-muted-foreground text-center text-sm">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => setMode("register")}
                className="text-primary font-medium hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setMode("login")}
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
