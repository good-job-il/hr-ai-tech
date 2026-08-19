import { useEffect } from "react"

export default function SEOHead({
  title,
  description,
  image,
  canonical,
  keywords,
  ogType = "website",
  schemaData,
}) {
  useEffect(() => {
    // Update document title
    document.title = title || "HeadHunter - פלטפורמת דרושים בישראל"

    // Update meta tags
    const updateMeta = (name, content, isProperty = false) => {
      const attr = isProperty ? "property" : "name"
      let meta = document.querySelector(`meta[${attr}="${name}"]`)
      if (!meta) {
        meta = document.createElement("meta")
        meta.setAttribute(attr, name)
        document.head.appendChild(meta)
      }
      meta.content = content
    }

    if (description) updateMeta("description", description)
    if (keywords) updateMeta("keywords", keywords)
    if (image) updateMeta("og:image", image, true)

    // Canonical
    let link = document.querySelector('link[rel="canonical"]')
    if (!link) {
      link = document.createElement("link")
      link.rel = "canonical"
      document.head.appendChild(link)
    }
    link.href = canonical || window.location.href

    updateMeta("og:title", title || "HeadHunter", true)
    updateMeta("og:description", description || "פלטפורמת דרושים בישראל", true)
    updateMeta("og:type", ogType, true)
    updateMeta("og:url", canonical || window.location.href, true)

    updateMeta("twitter:title", title || "HeadHunter")
    updateMeta("twitter:description", description || "פלטפורמת דרושים בישראל")
    if (image) updateMeta("twitter:image", image)

    // JSON-LD Schema
    if (schemaData) {
      const existingScript = document.querySelector("script[data-seo-schema]")
      if (existingScript) existingScript.remove()
      const script = document.createElement("script")
      script.type = "application/ld+json"
      script.setAttribute("data-seo-schema", "true")
      script.textContent = JSON.stringify(schemaData)
      document.head.appendChild(script)
    }

    return () => {
      const script = document.querySelector("script[data-seo-schema]")
      if (script) script.remove()
    }
  }, [title, description, image, canonical, keywords, ogType, schemaData])

  return null
}
