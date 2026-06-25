import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import CandidateCard from './CandidateCard';
import { Users } from 'lucide-react';

export default function StageColumn({ stage, applications, onCandidateClick, isDragging, colWidth }) {
  const hasSlaBreaches = applications.some(a => {
    if (!stage.slaHours || !a.stage_entered_at) return false;
    const hours = (Date.now() - new Date(a.stage_entered_at)) / 3600000;
    return hours > stage.slaHours;
  });

  return (
    <div
      className="flex-shrink-0"
      style={{
        // FIXED width - no shrinking, no expanding
        width: `${colWidth}px`,
        minWidth: `${colWidth}px`,
        maxWidth: `${colWidth}px`,
        // Prevent flex compression
        flex: '0 0 auto',
        // RTL spacing
        marginRight: 0,
        marginLeft: '16px',
      }}
    >
      {/* Column Header - STICKY */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 rounded-t-2xl mb-1"
        style={{ 
          background: `${stage.color}14`, 
          borderTop: `3px solid ${stage.color}`,
          // Ensure header stays visible during vertical scroll
          position: 'sticky',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="font-black text-[#0F172A] text-sm">{stage.label}</span>
          {hasSlaBreaches && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="SLA breached" />
          )}
        </div>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
          style={{ background: stage.color }}
        >
          {applications.length}
        </div>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="min-h-[120px] rounded-b-2xl transition-all duration-200 space-y-3 p-2"
            style={{
              background: snapshot.isDraggingOver
                ? `${stage.color}10`
                : 'rgba(255,255,255,0.6)',
              border: snapshot.isDraggingOver
                ? `2px dashed ${stage.color}`
                : '2px solid transparent',
              borderRadius: '0 0 16px 16px',
            }}
          >
            {applications.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="w-8 h-8 text-[#CBD5E1] mb-2] mb-2" />
                <p className="text-xs text-[#CBD5E1] font-semibold">גרור מועמד לכאן</p>
              </div>
            )}

            {applications.map((app, index) => (
              <Draggable key={app.id} draggableId={app.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      ...provided.draggableProps.style,
                      opacity: snapshot.isDragging ? 0.85 : 1,
                    }}
                  >
                    <CandidateCard
                      application={app}
                      stageColor={stage.color}
                      slaHours={stage.slaHours}
                      onClick={() => onCandidateClick(app)}
                      isDragging={snapshot.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}