import Link from "next/link";

/**
 * ExamFluent logotipi.
 * Belgi — "gapirish + tasdiqlash" g'oyasi: suhbat pufagi ichida belgi (✓).
 * SVG ishlatilgani uchun har qanday o'lchamda toza ko'rinadi.
 */
export function Logo({
  href = "/",
  size = "md",
  showText = true,
}: {
  href?: string | null;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}) {
  const dims = { sm: 26, md: 32, lg: 40 }[size];
  const textSize = { sm: "text-base", md: "text-lg", lg: "text-2xl" }[size];

  const content = (
    <span className="inline-flex items-center gap-2.5">
      <svg
        width={dims}
        height={dims}
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="40" height="40" rx="11" fill="#1a34d9" />
        {/* suhbat pufagi */}
        <path
          d="M11 14.5C11 13.1193 12.1193 12 13.5 12h13c1.3807 0 2.5 1.1193 2.5 2.5v8c0 1.3807-1.1193 2.5-2.5 2.5H19l-5 4v-4h-.5C12.1193 25 11 23.8807 11 22.5v-8Z"
          fill="white"
          fillOpacity="0.95"
        />
        {/* tasdiq belgisi */}
        <path
          d="m15.8 18.6 2.6 2.6 5.6-5.6"
          stroke="#1a34d9"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showText && (
        <span className={`${textSize} font-bold tracking-tight text-ink-900`}>
          Exam<span className="text-brand-700">Fluent</span>
        </span>
      )}
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} className="rounded-lg transition-opacity hover:opacity-80">
      {content}
    </Link>
  );
}
