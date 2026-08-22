import { useState } from "react"
import { Linkedin, MessageCircle, Facebook } from "lucide-react"
import { useAuth } from "@/lib/AuthContext"
import { toast } from "sonner"

export default function ShareButtons({ job }) {
  const { user } = useAuth()

  const [copied, setCopied] = useState(false)

  const jobUrl = typeof window !== "undefined" ? `${window.location.origin}/jobs/${job.id}` : ""

  const getShareText = () => {
    const role = user?.role

    if (role === "admin") {
      return `הזדמנות חדשה באתר headhunter 👇\n${job.title}`
    }

    if (role === "employer" || role === "hiring_manager") {
      return `אנחנו מגייסים לתפקיד ${job.title} 👇`
    }

    if (role === "recruiter") {
      return `אנחנו מגייסים לתפקיד ${job.title} 👇`
    }

    // candidate or not logged in
    return `חברים, תראו איזו משרה מצאתי 👇\n${job.title}`
  }

  const shareText = getShareText()

  const fullMessage = `${shareText}\n${jobUrl}`

  const shareLinks = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`,
      bgColor: "bg-green-500/20",
      hoverColor: "hover:bg-green-500/30",
      textColor: "text-green-300",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}&title=${encodeURIComponent(shareText)}`,
      bgColor: "bg-blue-500/20",
      hoverColor: "hover:bg-blue-500/30",
      textColor: "text-blue-300",
    },
    {
      name: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(jobUrl)}&quote=${encodeURIComponent(shareText)}`,
      bgColor: "bg-blue-600/20",
      hoverColor: "hover:bg-blue-600/30",
      textColor: "text-blue-200",
    },
  ]

  const handleCopyLink = () => {
    navigator.clipboard.writeText(jobUrl)
    setCopied(true)
    toast.success("קישור הועתק")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex gap-3 flex-wrap">
      {shareLinks.map((share) => {
        const IconComponent = share.icon

        return (
          <a
            key={share.name}
            href={share.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${share.bgColor} ${share.hoverColor} ${share.textColor} text-sm font-medium transition-all`}
          >
            <IconComponent className="w-4 h-4" /> {share.name}
          </a>
        )
      })}

      <button
        onClick={handleCopyLink}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 text-sm font-medium transition-all"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}

        {copied ? "הועתק" : "העתק"}
      </button>
    </div>
  )
}
import { Copy, Check } from "lucide-react"
