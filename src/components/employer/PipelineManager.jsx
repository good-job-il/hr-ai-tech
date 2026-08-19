import React, { useState } from "react"
import { Plus, Trash2, Edit2, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function PipelineManager({ stages, onAdd, onDelete, onUpdate }) {
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState("#3da8c8")
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState("")

  const handleAdd = () => {
    if (!newName.trim()) return
    onAdd({ name: newName, color: newColor, order: stages.length })
    setNewName("")
    setNewColor("#3da8c8")
  }

  const handleStartEdit = (stage) => {
    setEditingId(stage.id)
    setEditName(stage.name)
  }

  const handleSaveEdit = (id) => {
    if (!editName.trim()) return
    onUpdate(id, { name: editName })
    setEditingId(null)
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-6">
      <h2 className="font-semibold text-gray-900 mb-4">נהול שלבי גיוס</h2>

      <div className="space-y-3 mb-5">
        {stages.map((stage) => (
          <div key={stage.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
            <div className="flex-1 flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full cursor-pointer"
                style={{ backgroundColor: stage.color }}
                title="בחר צבע"
              />
              {editingId === stage.id ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-sm h-8"
                  autoFocus
                />
              ) : (
                <span className="text-sm text-gray-900 font-medium">{stage.name}</span>
              )}
            </div>

            <div className="flex gap-2">
              {editingId === stage.id ? (
                <>
                  <button
                    onClick={() => handleSaveEdit(stage.id)}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1.5 text-gray-400 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleStartEdit(stage)}
                    className="p-1.5 text-gray-400 hover:text-hhblue hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(stage.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="flex-1 flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="שם שלב חדש..."
            className="text-sm h-10"
          />
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="h-10 w-12 rounded-lg cursor-pointer"
          />
        </div>
        <button
          onClick={handleAdd}
          className="bg-hhblue text-white px-4 h-10 rounded-lg hover:bg-hhblue/90 text-sm font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          הוסף שלב
        </button>
      </div>
    </div>
  )
}
