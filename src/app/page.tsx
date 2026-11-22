import { App } from "@/components/app/app"
import { I18nProvider } from "@/lib/i18n"
import { StoreProvider } from "@/lib/store"

export default function Page() {
  return (
    <I18nProvider>
      <StoreProvider>
        <App />
      </StoreProvider>
    </I18nProvider>
  )
}
