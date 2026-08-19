import * as React from "react"

// 1280px covers standard iPad Pro landscape + most tablets with sidebars
const MOBILE_BREAKPOINT = 1280

export function useIsMobile() {
  // Initialize synchronously so the first render is already correct
  const [isMobile, setIsMobile] = React.useState(
    () => typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT,
  )

  React.useEffect(() => {
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    window.addEventListener("resize", onChange)
    return () => window.removeEventListener("resize", onChange)
  }, [])

  return isMobile
}
