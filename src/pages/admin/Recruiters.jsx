import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { staffService } from "@/api/services/staffService"

export default function AdminRecruiters() {
  const queryClient = useQueryClient()

  // Load ALL staff across all companies for admin view
  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["admin-all-staff"],
    queryFn: () => staffService.list({ sort: "created_date", order: "DESC", limit: 200 }),
  })

  const addMutation = useMutation({
    mutationFn: (data) => staffService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-all-staff"] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => staffService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-all-staff"] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => staffService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-all-staff"] }),
  })

  // Group staff by company
  const companies = [...new Set(staff.map((s) => s.company_id).filter(Boolean))]

  return (
    <AdminLayout>
      <div className="p-6" dir="rtl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-500" /> מגייסים וצוותים
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            ניהול כלל המגייסים, מנהלי הצוות ומנהלי הגיוס במערכת
          </p>
        </div>

        {/* Summary stats */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm text-center min-w-[100px]">
            <div className="text-xl font-bold text-gray-900">{staff.length}</div>
            <div className="text-xs text-gray-500">סה"כ עובדים</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm text-center min-w-[100px]">
            <div className="text-xl font-bold text-purple-600">
              {staff.filter((s) => s.role === "hiring_manager").length}
            </div>
            <div className="text-xs text-gray-500">מנהלי גיוס</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm text-center min-w-[100px]">
            <div className="text-xl font-bold text-blue-600">
              {staff.filter((s) => s.role === "team_manager").length}
            </div>
            <div className="text-xs text-gray-500">מנהלי צוות</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm text-center min-w-[100px]">
            <div className="text-xl font-bold text-green-600">
              {staff.filter((s) => s.role === "recruiter").length}
            </div>
            <div className="text-xs text-gray-500">רכזי גיוס</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm text-center min-w-[100px]">
            <div className="text-xl font-bold text-gray-700">{companies.length}</div>
            <div className="text-xs text-gray-500">חברות</div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : staff.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">אין עובדים במערכת עדיין</div>
        ) : companies.length > 1 ? (
          // Multiple companies - show grouped by company
          <div className="space-y-8">
            {companies.map((companyId) => {
              const companyStaff = staff.filter((s) => s.company_id === companyId)

              const hm = companyStaff.find((s) => s.role === "hiring_manager")

              return (
                <div key={companyId}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {companyId}
                    </span>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>
                  <HierarchyStaffSection
                    staff={companyStaff}
                    hiringManager={hm}
                    isAdmin={true}
                    onAdd={(data) => addMutation.mutate({ ...data, company_id: companyId })}
                    onUpdate={updateMutation.mutate}
                    onDelete={deleteMutation.mutate}
                    loading={addMutation.isPending || updateMutation.isPending}
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <HierarchyStaffSection
            staff={staff}
            hiringManager={staff.find((s) => s.role === "hiring_manager")}
            isAdmin={true}
            onAdd={(data) => addMutation.mutate(data)}
            onUpdate={updateMutation.mutate}
            onDelete={deleteMutation.mutate}
            loading={addMutation.isPending || updateMutation.isPending}
          />
        )}
      </div>
    </AdminLayout>
  )
}
