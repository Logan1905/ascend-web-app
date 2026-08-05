"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { siteConfig } from "@/config/site";

function ConfirmedContent() {
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const hasToken = Boolean(tokenHash && type);

  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    hasToken ? "verifying" : "success",
  );
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!tokenHash || !type) return;

    const supabase = createClient();
    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: type as "email" })
      .then(({ error }) => {
        if (error) {
          setStatus("error");
          setErrorMsg(error.message);
        } else {
          setStatus("success");
        }
      });
  }, [tokenHash, type]);

  if (status === "verifying") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
        <p className="text-muted-foreground mt-4 text-sm">
          Verifying your email...
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-full max-w-sm space-y-4">
          <div className="bg-destructive/10 mx-auto flex size-16 items-center justify-center rounded-full">
            <CheckCircle2 className="text-destructive size-8" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Verification Failed
          </h1>
          <p className="text-muted-foreground text-sm">
            {errorMsg ||
              "The link may have expired. Please try signing in or registering again."}
          </p>
          <Link href="/profile">
            <Button className="w-full">Go to Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-full max-w-sm space-y-4">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="size-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Email Verified!
        </h1>
        <p className="text-muted-foreground text-sm">
          Your email address has been verified successfully. You can now sign in
          to your account.
        </p>
        <div className="pt-2">
          <p className="mb-3 text-lg font-bold tracking-tight">
            {siteConfig.name}
          </p>
          <Link href="/profile">
            <Button className="w-full" size="lg">
              Go to Site
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
        </div>
      }
    >
      <ConfirmedContent />
    </Suspense>
  );
}
