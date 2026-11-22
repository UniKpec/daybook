"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

/** Açık / koyu tema düğmesi. Yeni tema, düğmenin olduğu yerden büyüyen bir daireyle ekrana yayılır. */
export function ThemeToggle({ className, variant = "ghost" }: { className?: string; variant?: "ghost" | "outline" }) {
  const { resolvedTheme, setTheme } = useTheme()
  const { t } = useI18n()

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = resolvedTheme === "dark" ? "light" : "dark"
    const root = document.documentElement
    const apply = () => {
      // Sınıf hemen yazılır ki geçişin "sonraki" görüntüsü yeni temayla alınsın; next-themes aynısını ardından yapar.
      root.classList.remove("light", "dark")
      root.classList.add(next)
      root.style.colorScheme = next
      setTheme(next)
    }
    if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return apply()

    const box = e.currentTarget.getBoundingClientRect()
    const x = box.left + box.width / 2
    const y = box.top + box.height / 2
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    document.startViewTransition(apply).ready.then(() =>
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 500, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }
      )
    )
  }

  return (
    <Button variant={variant} size="icon-sm" className={className} aria-label={t("side.theme")} title={t("side.theme")} onClick={toggle}>
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="dark:hidden" />
    </Button>
  )
}
