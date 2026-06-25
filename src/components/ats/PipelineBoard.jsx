import React, { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import CandidateCard from './CandidateCard';
import StageColumn from './StageColumn';

// FIXED column width for true Kanban scroll
const COLUMN_WIDTH = 300;

export default function PipelineBoard({ stages, applications, onCandidateClick, onMove, userRole }) {
  const [dragging, setDragging] = useState(false);
  const containerRef = React.useRef(null);
  const scrollInitialized = useRef(false);

  const getAppsForStage = (stageId) =>
    applications.filter(a => a.status === stageId);

  const onDragEnd = (result) => {
    setDragging(false);
    if (!result.destination) return;
    const { draggableId, destination } = result;
    if (destination.droppableId !== result.source.droppableId) {
      onMove(draggableId, destination.droppableId);
    }
  };

  // Scroll to first stage ("חדש") on initial load - RTL compatible
  useEffect(() => {
    if (!containerRef.current || scrollInitialized.current || applications.length === 0) return;
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // RTL: scroll to max scrollLeft (which is the "start" in RTL)
      containerRef.current.scrollLeft = 99999;
      scrollInitialized.current = true;
    }, 100);
    
    return () => clearTimeout(timer);
  }, [applications.length]);

  return (
    <DragDropContext onDragStart={() => setDragging(true)} onDragEnd={onDragEnd}>
      {/* TRUE horizontal scroll container - RTL compatible */}
      <div
        ref={containerRef}
        className="flex gap-4 items-start pb-4 w-full"
        style={{
          // CRITICAL: True horizontal scroll
          overflowX: 'auto',
          overflowY: 'hidden',
          whiteSpace: 'nowrap',
          // RTL scroll behavior
          direction: 'rtl',
          // Smooth scrolling
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          // Hide scrollbar but keep functionality
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          // Ensure proper flex behavior
          display: 'flex',
          flexWrap: 'nowrap',
          // Min width to prevent compression
          minWidth: 'max-content',
        }}
      >
        {/* Hide scrollbar for Chrome/Safari */}
        <style>{`
          .pipeline-scroll-container::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        {stages.map((stage) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            applications={getAppsForStage(stage.id)}
            onCandidateClick={onCandidateClick}
            isDragging={dragging}
            colWidth={COLUMN_WIDTH}
          />
        ))}
      </div>
    </DragDropContext>
  );
}