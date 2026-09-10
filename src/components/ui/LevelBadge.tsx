import { CEFR_META, type CefrLevel } from "@/lib/cefr";

/**
 * CEFR darajasini ko'rsatuvchi belgi (masalan "B2 · Upper-Intermediate").
 * Butun platformada bir xil ko'rinishda bo'lishi uchun alohida komponent.
 */
export function LevelBadge({
  level,
  withTitle = false,
  size = "md",
}: {
  level: CefrLevel | null | undefined;
  withTitle?: boolean;
  size?: "sm" | "md";
}) {
  if (!level) {
    return (
      <span className="badge bg-ink-100 text-ink-500 ring-ink-200">—</span>
    );
  }

  const meta = CEFR_META[level];
  const pad = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span className={`badge ${meta.badge} ${pad}`}>
      {level}
      {withTitle && <span className="ml-1.5 font-medium normal-case opacity-80">{meta.title}</span>}
    </span>
  );
}
