import { useState, useEffect } from "react"
import { userService } from "@/api/services/userService"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/lib/AuthContext"
import { toast } from "sonner"

export default function AdminUsersPage() {
  const { user } = useAuth()

  const qc = useQueryClient()

  const [editingUser, setEditingUser] = useState(null)

  const [editName, setEditName] = useState("")

  const [companyFilter, setCompanyFilter] = useState(null)

  useEffect(() => {
    // Employer sees only users from their company
    if (user?.role === "employer" && user?.data?.company_id) {
      setCompanyFilter(user.data.company_id)
    }
  }, [user])

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users", companyFilter],
    queryFn: async () => {
      const allUsers = await userService.list({ limit: 500 })

      // Admin sees all, employer sees only their company
      if (companyFilter) {
        return allUsers.filter((u) => u.data?.company_id === companyFilter)
      }

      return allUsers
    },
  })

  const updateName = useMutation({
    mutationFn: async ({ userId, newName }) => {
      return await userService.update(userId, { full_name: newName })
    },
    onSuccess: async () => {
      setEditingUser(null)
      await qc.refetchQueries({ queryKey: ["admin-users"] })
      toast.success("שם המשתמש עודכן בהצלחה")
    },
    onError: (error) => {
      toast.error(`שגיאה בעדכון: ${error.message || "נסה שוב"}`)
    },
  })

  const handleSave = async () => {
    if (!editName.trim() || !editingUser) {
      return
    }

    await updateName.mutateAsync({ userId: editingUser.id, newName: editName.trim() })
  }

  const openEdit = (user) => {
    setEditingUser(user)
    setEditName(user.full_name || "")
  }

  return (
    <div dir="rtl" className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">ניהול משתמשים</h1>

            <p className="text-sm text-gray-500 mt-1">
              {companyFilter ? `משתמשי חברה: ${companyFilter}` : "צפייה ועריכת פרטי משתמשים"}
            </p>
          </div>

          {companyFilter && (
            <span className="text-xs font-semibold px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full border border-purple-200">
              חברה: {companyFilter}
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">טוען...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />

          <p>אין משתמשים במערכת</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-black text-gray-500 uppercase">
            <div className="col-span-4">שם</div>

            <div className="col-span-4">אימייל</div>

            <div className="col-span-2">תפקיד</div>

            <div className="col-span-2 text-center">פעולות</div>
          </div>

          {users.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-gray-100 hover:bg-gray-50 items-center"
            >
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  {(user.full_name || user.email)[0].toUpperCase()}
                </div>

                <span className="font-bold text-gray-900">{user.full_name || "—"}</span>
              </div>

              <div className="col-span-4 text-sm text-gray-600 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-gray-400" />

                {user.email}
              </div>

              <div className="col-span-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  {user.role || "user"}
                </span>
              </div>

              <div className="col-span-2 flex items-center justify-center gap-2">
                <button
                  onClick={() => openEdit(user)}
                  className="p-2 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors"
                  title="ערוך שם"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת שם משתמש</DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">שם מלא</label>

              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="שם מלא"
                className="mt-1"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={!editName.trim() || updateName.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {updateName.isPending ? "שומר..." : "שמור"}
              </Button>

              <Button variant="outline" onClick={() => setEditingUser(null)} className="flex-1">
                ביטול
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
