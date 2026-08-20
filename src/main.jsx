import ReactDOM from "react-dom/client"
import "@/index.css"
import "@/i18n.js"

const rootElement = document.getElementById("root")

async function bootstrap() {
  const { default: App } = await import("@/App")

  ReactDOM.createRoot(rootElement).render(<App />)
}

bootstrap().catch((error) => {
  console.error("Application bootstrap failed", error)

  rootElement.innerHTML = `
    <main role="alert" class="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div class="max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
        <h1 class="text-lg font-semibold text-slate-900">Application could not be loaded</h1>
        <p class="mt-2 text-sm text-slate-600">Please refresh the page or try again later.</p>
      </div>
    </main>
  `
})
