import { useState } from "react"
import { useAuth } from "@/lib/AuthContext"
import { authService } from "@/api/services/authService"
import { fileService } from "@/api/services/fileService"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export default function CompanyProfileSettings() {
  const { user } = useAuth()

  const queryClient = useQueryClient()

  const [profileData, setProfileData] = useState({
    company_culture: "",
    benefits: "",
    gallery_urls: [],
    video_url: "",
    testimonials: [],
  })

  const updateCompanyProfileMutation = useMutation({
    mutationFn: async (data) => {
      return authService.updateMe({
        ...data,
        benefits:
          typeof data.benefits === "string"
            ? data.benefits
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean)
            : data.benefits,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-profile"] })
    },
  })

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]

    if (!file) {
      return
    }

    const { file_url } = await fileService.upload(file)

    setProfileData((prev) => ({
      ...prev,
      gallery_urls: [...prev.gallery_urls, file_url],
    }))
  }

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0]

    if (!file) {
      return
    }

    const { file_url } = await fileService.upload(file)

    setProfileData((prev) => ({ ...prev, video_url: file_url }))
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-6" dir="rtl">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">תרבות החברה</label>
        <textarea
          value={profileData.company_culture}
          onChange={(e) => setProfileData((prev) => ({ ...prev, company_culture: e.target.value }))}
          placeholder="תאר את תרבות החברה שלך..."
          rows={4}
          className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-hhblue/30 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">הטבות</label>
        <textarea
          value={profileData.benefits}
          onChange={(e) => setProfileData((prev) => ({ ...prev, benefits: e.target.value }))}
          placeholder="רשום את ההטבות המשכנעות שלך..."
          rows={3}
          className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-hhblue/30 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">גלריה של תמונות</label>
        <label className="flex items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50 transition-colors">
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="w-6 h-6 text-gray-400" />
            <span className="text-sm text-gray-600">העלה תמונות</span>
          </div>
        </label>
        <div className="flex flex-wrap gap-2 mt-3">
          {profileData.gallery_urls.map((url, idx) => (
            <img key={idx} src={url} alt="gallery" className="w-20 h-20 rounded-lg object-cover" />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">סרטון תרבות</label>
        <label className="flex items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50 transition-colors">
          <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
          <div className="flex flex-col items-center gap-2">
            <Video className="w-6 h-6 text-gray-400" />
            <span className="text-sm text-gray-600">העלה סרטון</span>
          </div>
        </label>
      </div>

      <button
        onClick={() => updateCompanyProfileMutation.mutate(profileData)}
        disabled={updateCompanyProfileMutation.isPending}
        className="w-full bg-hhblue text-white py-2 rounded-lg font-semibold hover:bg-hhblue/90 disabled:opacity-50"
      >
        {updateCompanyProfileMutation.isPending ? "שמירה..." : "שמור פרטים"}
      </button>
    </div>
  )
}
