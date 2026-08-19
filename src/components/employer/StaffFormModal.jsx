import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ROLE_LABELS = {
  hiring_manager: "מנהל גיוס",
  team_manager: "מנהל צוות",
  recruiter: "רכז גיוס",
}

export default function StaffFormModal({
  open,
  onOpenChange,
  staff,
  teamManagers,
  hiringManager,
  onSubmit,
  loading,
  showHiringManagerOption = false,
}) {
  const [formData, setFormData] = useState(
    staff || {
      full_name: "",
      email: "",
      phone: "",
      role: "recruiter",
      manager_email: "",
    },
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.manager_email && formData.role !== "hiring_manager") {
      alert("יש לבחור מנהל")
      return
    }
    onSubmit(formData)
  }

  // Build list of available managers
  let availableManagers = []

  if (formData.role === "team_manager") {
    // Team managers can report to other team managers or to hiring manager
    availableManagers = teamManagers.filter((m) => m.id !== staff?.id)
  } else if (formData.role === "recruiter") {
    // Recruiters can report to team managers or hiring manager
    availableManagers = teamManagers
  }

  // Add hiring manager to the list if they exist
  if (hiringManager) {
    availableManagers = [
      ...availableManagers,
      { email: hiringManager.email, full_name: hiringManager.full_name || "מנהל הגיוס" },
    ]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>{staff ? "עדכן עובד" : "הוסף עובד חדש"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-semibold">שם מלא *</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              placeholder="למשל: דוד כהן"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold">אימייל *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="david@company.com"
              dir="ltr"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold">טלפון *</Label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              placeholder="050-123-4567"
              dir="ltr"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold">תפקיד *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData({ ...formData, role: value, manager_email: "" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {showHiringManagerOption && (
                  <SelectItem value="hiring_manager">{ROLE_LABELS.hiring_manager}</SelectItem>
                )}
                <SelectItem value="team_manager">{ROLE_LABELS.team_manager}</SelectItem>
                <SelectItem value="recruiter">{ROLE_LABELS.recruiter}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role !== "hiring_manager" && (
            <div>
              <Label className="text-sm font-semibold">מנהל *</Label>
              <Select
                value={formData.manager_email}
                onValueChange={(value) => setFormData({ ...formData, manager_email: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר מנהל" />
                </SelectTrigger>
                <SelectContent>
                  {availableManagers.map((manager) => (
                    <SelectItem key={manager.email} value={manager.email}>
                      {manager.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={loading} className="bg-hhblue hover:bg-hhblue/90">
              {loading ? "⏳ שומר..." : "שמור"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
