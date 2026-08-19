import React from "react"

export default function LoadingSpinner({ text = "טוען...", size = "md" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  const containerSize = {
    sm: "h-32",
    md: "h-64",
    lg: "h-96",
  }

  return (
    <div className={`flex flex-col items-center justify-center ${containerSize[size]}`}>
      <div
        className={`${sizeClasses[size]} border-4 border-gray-200 border-t-hhblue rounded-full animate-spin`}
      />
      {text && <p className="mt-3 text-gray-500 text-sm">{text}</p>}
    </div>
  )
}
