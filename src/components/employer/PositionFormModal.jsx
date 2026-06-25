import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus } from 'lucide-react';

export default function PositionFormModal({ open, onOpenChange, position, onSubmit, loading }) {
  const [formData, setFormData] = useState(position || {
    title: '',
    department: '',
    description: '',
    required_experience: 0,
    skills: [],
    salary_min: null,
    salary_max: null
  });
  const [newSkill, setNewSkill] = useState('');

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setFormData({
        ...formData,
        skills: [...(formData.skills || []), newSkill]
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (index) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>{position ? 'עדכן תפקיד' : 'הוסף תפקיד חדש'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-semibold">כותרת התפקיד *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="למשל: Senior Developer"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold">מחלקה *</Label>
            <Input
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              required
              placeholder="למשל: הנדסה"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold">תיאור התפקיד</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="תיאור מפורט של התפקיד..."
              className="h-24"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-semibold">שנות ניסיון</Label>
              <Input
                type="number"
                min="0"
                value={formData.required_experience || ''}
                onChange={(e) => setFormData({ ...formData, required_experience: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold">שכר מינימום</Label>
              <Input
                type="number"
                value={formData.salary_min || ''}
                onChange={(e) => setFormData({ ...formData, salary_min: parseInt(e.target.value) || null })}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold">שכר מקסימום</Label>
              <Input
                type="number"
                value={formData.salary_max || ''}
                onChange={(e) => setFormData({ ...formData, salary_max: parseInt(e.target.value) || null })}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold">כישורים נדרשים</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                placeholder="הוסף כישור..."
              />
              <Button type="button" onClick={handleAddSkill} variant="outline" size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(formData.skills || []).map((skill, index) => (
                <div key={index} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(index)}
                    className="hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={loading} className="bg-hhblue hover:bg-hhblue/90">
              {loading ? '⏳ שומר...' : 'שמור'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}