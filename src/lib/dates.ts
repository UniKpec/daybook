import type { T } from "./i18n"

// Tarih biçimleri seçili dile göre değişir; dil sağlayıcısı (I18nProvider) bunu ayarlar.
let LOCALE = "tr-TR"
export const setLocale = (l: string) => {
  LOCALE = l
}

const pad = (n: number) => String(n).padStart(2, "0")
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (s: string, n: number) => {
  const d = parse(s)
  d.setDate(d.getDate() + n)
  return ymd(d)
}
export const today = () => ymd(new Date())
export const dayDiff = (a: string, b: string) => Math.round((parse(a).getTime() - parse(b).getTime()) / 864e5)

/** Verilen günün içinde olduğu haftanın pazartesi ve pazarı. */
export const weekOf = (s: string): [string, string] => {
  const a = addDays(s, -((parse(s).getDay() + 6) % 7))
  return [a, addDays(a, 6)]
}
/** Verilen günün ayının ilk ve son günü; offset -1 önceki ay. */
export const monthOf = (s: string, offset = 0): [string, string] => {
  const d = parse(s)
  return [ymd(new Date(d.getFullYear(), d.getMonth() + offset, 1)), ymd(new Date(d.getFullYear(), d.getMonth() + offset + 1, 0))]
}

export const fmtLong = (s: string) =>
  parse(s).toLocaleDateString(LOCALE, { day: "numeric", month: "long", year: "numeric", weekday: "long" })
export const fmtDay = (s: string) => parse(s).toLocaleDateString(LOCALE, { day: "numeric", month: "long", year: "numeric" })
export const fmtWeekday = (s: string) => parse(s).toLocaleDateString(LOCALE, { weekday: "long" })
export const fmtShort = (s: string) => parse(s).toLocaleDateString(LOCALE, { day: "numeric", month: "short", year: "numeric" })
export const fmtDayMonth = (s: string) => parse(s).toLocaleDateString(LOCALE, { day: "numeric", month: "short" })

export function relLabel(s: string, t: T) {
  const diff = dayDiff(s, today())
  if (diff === 0) return t("rel.today")
  if (diff === -1) return t("rel.yesterday")
  if (diff === 1) return t("rel.tomorrow")
  return diff < 0 ? t("rel.daysAgo", { n: -diff }) : t("rel.daysLater", { n: diff })
}

/** Bir işin son tarihini kısa etikete çevirir. */
export function dueLabel(due: string, t: T) {
  const diff = dayDiff(due, today())
  if (diff === 0) return t("due.today")
  if (diff === 1) return t("due.tomorrow")
  if (diff < 0) return t("due.overdue", { n: -diff })
  return fmtDayMonth(due)
}

/** Dakikayı "2 sa 30 dk" biçimine çevirir. */
export function fmtDur(mins: number, t: T) {
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  if (!h) return `${m} ${t("dur.m")}`
  return m ? `${h} ${t("dur.h")} ${m} ${t("dur.m")}` : `${h} ${t("dur.h")}`
}
