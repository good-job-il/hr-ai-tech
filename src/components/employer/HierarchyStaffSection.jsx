import React, { useState } from 'react';
import { Edit2, Trash2, Plus, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StaffFormModal from '@/components/employer/StaffFormModal';

export default function HierarchyStaffSection({
  staff,
  hiringManager,
  isAdmin,
  onAdd,
  onUpdate,
  onDelete,
  loading
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [expandedManagers, setExpandedManagers] = useState({});

  const handleSubmit = (data) => {
    if (editingStaff) {
      onUpdate({ id: editingStaff.id, data });
    } else {
      onAdd(data);
    }
    setShowModal(false);
    setEditingStaff(null);
  };

  const handleOpenModal = (member = null) => {
    setEditingStaff(member);
    setShowModal(true);
  };

  const toggleManager = (managerId) => {
    setExpandedManagers(prev => ({
      ...prev,
      [managerId]: !prev[managerId]
    }));
  };

  // Get hiring managers (בכירים)
  const hiringManagers = staff.filter(s => s.role === 'hiring_manager');
  // Get team managers (מנהלי צוות)
  const teamManagers = staff.filter(s => s.role === 'team_manager');
  // Get recruiters (רכזי גיוס)
  const recruiters = staff.filter(s => s.role === 'recruiter');

  const getSubordinates = (managerId) => {
    return staff.filter(s => s.manager_email === staff.find(m => m.id === managerId)?.email);
  };

  const StaffCard = ({ member, level = 0, isChild = false }) => (
    <div className={`${isChild ? 'mr-8' : ''}`}>
      <div className={`flex items-start justify-between p-4 rounded-lg border transition-all ${
        isChild ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:border-gray-300'
      }`}>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{member.full_name}</h3>
            <span className={`inline-block px-2 py-1 text-xs rounded font-medium ${
              member.role === 'hiring_manager' 
                ? 'bg-purple-100 text-purple-700' 
                : member.role === 'team_manager'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {member.role === 'hiring_manager' 
                ? '👑 מנהל גיוס' 
                : member.role === 'team_manager'
                ? '👥 מנהל צוות'
                : '👤 רכז גיוס'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{member.email}</p>
          {member.phone && (
            <p className="text-xs text-gray-500 mt-1">📞 {member.phone}</p>
          )}
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

      {/* Subordinates */}
      {(member.role === 'hiring_manager' || member.role === 'team_manager') && (
        <div className="mt-3">
          {getSubordinates(member.id).length > 0 && (
            <div>
              <button
                onClick={() => toggleManager(member.id)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2 mr-8"
              >
                {expandedManagers[member.id] ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                {getSubordinates(member.id).length} תחתונים
              </button>

              {expandedManagers[member.id] && (
                <div className="space-y-3">
                  {getSubordinates(member.id).map(subordinate => (
                    <StaffCard
                      key={subordinate.id}
                      member={subordinate}
                      level={level + 1}
                      isChild={true}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Hiring Managers Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">מנהלי גיוס</h2>
                <p className="text-sm text-gray-500">{hiringManagers.length} בכירים בחברה</p>
              </div>
            </div>
            {(isAdmin || hiringManagers.some(m => m.email === hiringManager?.email)) && (
              <Button
                onClick={() => handleOpenModal()}
                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> הוסף מנהל גיוס
              </Button>
            )}
          </div>
        </div>

        <div className="p-6">
          {hiringManagers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">אין מנהלי גיוס בחברה עדיין</p>
            </div>
          ) : (
            <div className="space-y-4">
              {hiringManagers.map(manager => (
                <StaffCard key={manager.id} member={manager} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team Managers Section */}
      {teamManagers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">מנהלי צוות</h2>
                  <p className="text-sm text-gray-500">{teamManagers.length} מנהלי צוות</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {teamManagers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">אין מנהלי צוות</p>
              </div>
            ) : (
              <div className="space-y-4">
                {teamManagers.map(manager => (
                  <StaffCard key={manager.id} member={manager} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Independent Recruiters Section */}
      {recruiters.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">רכזי גיוס</h2>
                <p className="text-sm text-gray-500">{recruiters.filter(r => !r.manager_email).length} רכזים בלתי תלויים</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-3">
            {recruiters.map(recruiter => (
              <StaffCard key={recruiter.id} member={recruiter} />
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <StaffFormModal
        open={showModal}
        onOpenChange={setShowModal}
        staff={editingStaff}
        teamManagers={teamManagers}
        hiringManager={hiringManager}
        onSubmit={handleSubmit}
        loading={loading}
        showHiringManagerOption={isAdmin}
      />
    </div>
  );
}