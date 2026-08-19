import { useState } from "react"

export default function StaffSection({
  staff,
  teamManagers,
  hiringManager,
  onAdd,
  onUpdate,
  onDelete,
  loading,
}) {
  const [showModal, setShowModal] = useState(false)

  const [editingStaff, setEditingStaff] = useState(null)

  const handleSubmit = (data) => {
    if (editingStaff) {
      onUpdate({ id: editingStaff.id, data })
    } else {
      onAdd(data)
    }

    setShowModal(false)
    setEditingStaff(null)
  }

  const handleOpenModal = (member = null) => {
    setEditingStaff(member)
    setShowModal(true)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-hhblue/10 p-3 rounded-lg">
              <Users className="w-5 h-5 text-hhblue" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">צוות גיוס</h2>
              <p className="text-sm text-gray-500">{staff.length} חברים בצוות</p>
            </div>
          </div>
          <Button
            onClick={() => handleOpenModal()}
            className="bg-hhblue hover:bg-hhblue/90 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> הוסף עובד
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {staff.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">אין עובדים בצוות עדיין</p>
            <Button onClick={() => handleOpenModal()} className="bg-hhblue hover:bg-hhblue/90">
              הוסף עובד ראשון
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {staff.map((member) => (
              <div
                key={member.id}
                className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{member.full_name}</h3>
                  <p className="text-sm text-gray-600">{member.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-block px-2 py-1 bg-hhblue/10 text-hhblue text-xs rounded font-medium">
                      {member.role === "team_manager" ? "👥 מנהל צוות" : "👤 רכז גיוס"}
                    </span>
                    {member.manager_email && (
                      <span className="text-xs text-gray-500">תחת מנהל</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mr-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleOpenModal(member)}
                    className="hover:bg-gray-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onDelete(member.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <StaffFormModal
        open={showModal}
        onOpenChange={setShowModal}
        staff={editingStaff}
        teamManagers={teamManagers}
        hiringManager={hiringManager}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  )
}
