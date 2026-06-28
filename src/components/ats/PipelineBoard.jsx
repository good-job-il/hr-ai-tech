import React, { useState, useRef, useEffect } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import StageColumn from './StageColumn';

const COLUMN_WIDTH = 300;

export default function PipelineBoard({ stages, applications, onCandidateClick, onMove, userRole, isRTL = true }) {
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef(null);
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

  useEffect(() => {
    if (!containerRef.current || scrollInitialized.current || applications.length === 0) return;

    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      containerRef.current.scrollLeft = isRTL ? 99999 : 0;
      scrollInitialized.current = true;
    }, 100);

    return () => clearTimeout(timer);
  }, [applications.length, isRTL]);

  return (
    <DragDropContext onDragStart={() => setDragging(true)} onDragEnd={onDragEnd}>
      {/* Outer clip — never wider than the page */}
      <div className="w-full min-w-0 overflow-hidden">
        {/* Scroll viewport — bounded to parent width */}
        <div
          ref={containerRef}
          className="pipeline-scroll-container w-full min-w-0 overflow-x-auto overflow-y-hidden pb-4"
          style={{
            direction: isRTL ? 'rtl' : 'ltr',
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style>{`
            .pipeline-scroll-container::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {/* Inner track — as wide as all columns need */}
          <div className="flex flex-nowrap gap-4 items-start w-max min-w-full">
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
        </div>
      </div>
    </DragDropContext>
  );
}
