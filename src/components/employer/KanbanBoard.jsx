import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, X } from 'lucide-react';
import ApplicationCard from './ApplicationCard';

export default function KanbanBoard({ stages, applications, onDragEnd, onDeleteApplication }) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 h-[600px]" dir="rtl">
        {stages.map((stage) => {
          const stageApps = applications.filter(app => app.status === stage.name);
          return (
            <Droppable key={stage.id} droppableId={stage.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-shrink-0 w-80 bg-gray-50 rounded-xl p-4 border border-gray-200 ${
                    snapshot.isDraggingOver ? 'bg-blue-50 border-hhblue' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color || '#ccc' }} />
                    <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-700 mr-auto">
                      {stageApps.length}
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[520px] overflow-y-auto">
                    {stageApps.map((app, index) => (
                      <Draggable key={app.id} draggableId={app.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`${
                              snapshot.isDragging ? 'opacity-50' : ''
                            }`}
                          >
                            <ApplicationCard app={app} onDelete={onDeleteApplication} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </div>

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}