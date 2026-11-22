"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { cn } from "cn"

/** İçeriği yüksekliğiyle birlikte yumuşakça açıp kapatır; kapalıyken odak ve tıklama almaz. */
export function Collapse({ open, className, children }: { open: boolean; className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const prev = useRef(open)
  // İlk yükseklik sabit kalır; sonraki değişiklikleri aşağıdaki etki doğrudan stile yazar.
  const [initial] = useState(open)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || prev.current === open) return
    prev.current = open
    // "auto" ile sayı arasında geçiş olmaz: önce gerçek yükseklik yazılır, sonra hedefe geçilir.
    el.style.height = el.scrollHeight + "px"
    if (open) {
      const timer = setTimeout(() => (el.style.height = "auto"), 320)
      return () => clearTimeout(timer)
    }
    void el.offsetHeight
    el.style.height = "0px"
  }, [open])

  return (
    <div
      ref={ref}
      inert={!open}
      style={{ height: initial ? "auto" : 0 }}
      // Yatay boşluk, odak halkası kırpılmasın diye.
      className={cn(
        "-mx-1 overflow-hidden px-1 transition-[height,opacity] duration-300 ease-out motion-reduce:transition-none",
        open ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {children}
    </div>
  )
}

/** Açılış ekranı: kayıtlar okunurken gösterilir. Çok kısa yüklemelerde hiç görünmemesi için gecikmeyle belirir. */
export function Splash({ name, label }: { name: string; label: string }) {
  return (
    <div className="anim-splash grid min-h-svh place-items-center p-6" role="status" aria-label={label}>
      <div className="grid justify-items-center gap-4">
        <div className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <svg viewBox="0 0 16 16" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M3 4.5h10M3 8h10M3 11.5h6" />
          </svg>
        </div>
        <p className="text-lg font-semibold tracking-tight">{name}</p>
        <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
          <div className="anim-bar h-full w-1/3 rounded-full bg-primary" />
        </div>
      </div>
    </div>
  )
}
