"use client";

/**
 * SCROLL-REVEAL — element ekranga kirganda animatsiya bilan paydo bo'ladi.
 *
 * Nima uchun IntersectionObserver?
 *   Scroll hodisasini tinglash sahifani sekinlashtiradi (har piksel harakatda
 *   kod ishlaydi). IntersectionObserver esa brauzerning o'zida ishlaydi va
 *   deyarli resurs talab qilmaydi.
 *
 * Ishlatilishi:
 *   <Reveal delay={1}><div className="card">...</div></Reveal>
 */

import { useEffect, useRef, useState } from "react";

export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  /** Kechikish qadami (0-8). Ketma-ket elementlarga 1, 2, 3... bering. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Brauzer eski bo'lsa — animatsiyasiz darhol ko'rsatamiz
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            // Bir marta ko'rsatgach kuzatishni to'xtatamiz —
            // yuqoriga qaytganda qayta animatsiya bo'lmasin
            observer.unobserve(entry.target);
          }
        }
      },
      {
        // Element pastdan 12% ko'ringanda boshlansin
        threshold: 0.12,
        // Pastki chetdan 60px oldin ishga tushsin — silliqroq tuyuladi
        rootMargin: "0px 0px -60px 0px",
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      data-visible={visible ? "true" : "false"}
      className={`reveal ${className}`}
      style={{ transitionDelay: `${delay * 70}ms` }}
    >
      {children}
    </Tag>
  );
}
