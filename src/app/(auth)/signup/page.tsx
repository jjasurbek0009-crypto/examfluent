import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Ro'yxatdan o'tish" };

export default function SignupPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-7 w-48" />
      <div className="skeleton h-4 w-60" />
      <div className="skeleton h-11 w-full" />
      <div className="skeleton h-11 w-full" />
      <div className="skeleton h-11 w-full" />
    </div>
  );
}
