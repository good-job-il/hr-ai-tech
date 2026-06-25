import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import EmployerLayout from '@/components/employer/EmployerLayout';
import KanbanBoard from '@/components/employer/KanbanBoard';
import PipelineManager from '@/components/employer/PipelineManager';

export default function KanbanDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: stages = [] } = useQuery({
    queryKey: ['pipeline-stages', user?.email],
    queryFn: () => base44.entities.ApplicationPipeline.filter({ employer_id: user.email }, '-order', 100),
    enabled: !!user?.email,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['applications-kanban', user?.email],
    queryFn: () => base44.entities.Application.filter({ employer_id: user.email }, '-created_date', 500),
    enabled: !!user?.email,
  });

  const addStageMutation = useMutation({
    mutationFn: (data) => base44.entities.ApplicationPipeline.create({ ...data, employer_id: user.email }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] }),
  });

  const deleteStageMutation = useMutation({
    mutationFn: (id) => base44.entities.ApplicationPipeline.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] }),
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ApplicationPipeline.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] }),
  });

  const updateAppStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Application.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications-kanban'] }),
  });

  const deleteApplicationMutation = useMutation({
    mutationFn: (id) => base44.entities.Application.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications-kanban'] }),
  });

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sourceStage = stages.find(s => s.id === source.droppableId);
    const destStage = stages.find(s => s.id === destination.droppableId);

    if (sourceStage.id !== destStage.id) {
      updateAppStatusMutation.mutate({ id: draggableId, status: destStage.name });
    }
  };

  const hasDefaultStages = stages.length === 0;

  return (
    <EmployerLayout>
      <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
        <div className="max-w-[1400px] mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">דשבורד ניהול תהליך הגיוס</h1>

          <PipelineManager
            stages={stages}
            onAdd={(data) => addStageMutation.mutate(data)}
            onDelete={(id) => deleteStageMutation.mutate(id)}
            onUpdate={(id, data) => updateStageMutation.mutate({ id, data })}
          />

          {hasDefaultStages ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <p className="text-gray-600 mb-4">הוסף שלבים כדי להתחיל לנהל מועמדים</p>
              <button
                onClick={async () => {
                  const defaultStages = [
                    { name: 'ממתין לסינון ראשוני', color: '#3da8c8', order: 0 },
                    { name: 'ממתין לראיון טלפוני', color: '#17a2b8', order: 1 },
                    { name: 'תואם רעיון פרונטלי', color: '#0d6efd', order: 2 },
                    { name: 'נשלח מבחן אמינות', color: '#ffc107', order: 3 },
                    { name: 'התקבל העבודה', color: '#28a745', order: 4 },
                  ];
                  for (const stage of defaultStages) {
                    try {
                      await addStageMutation.mutateAsync(stage);
                    } catch (err) {
                      console.error('Error adding stage:', err);
                    }
                  }
                }}
                className="bg-hhblue text-white px-6 py-2 rounded-lg hover:bg-hhblue/90"
              >
                צור שלבים ברירת מחדל
              </button>
            </div>
          ) : (
            <KanbanBoard
              stages={stages}
              applications={applications}
              onDragEnd={handleDragEnd}
              onDeleteApplication={(id) => deleteApplicationMutation.mutate(id)}
            />
          )}
        </div>
      </div>
    </EmployerLayout>
  );
}