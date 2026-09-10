import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Kirish" };

export default function LoginPage() {
  // useSearchParams() ishlatilgani uchun Suspense bilan o'rash kerak —
  // aks holda Next.js build paytida ogohlantirish beradi.
  return (
    <Suspense fallback={<FormSkeleton />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-7 w-40" />
      <div className="skeleton h-4 w-56" />
      <div className="skeleton h-11 w-full" />
      <div className="skeleton h-11 w-full" />
      <div className="skeleton h-11 w-full" />
    </div>
  );
}
