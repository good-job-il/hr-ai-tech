import { Card, CardContent } from '@/components/ui/Card';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function FilterPanel({ title, filters, onFilterChange }) {
  const [open, setOpen] = useState(true);

  return (
    <Card>
      <CardContent className="p-6">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between mb-4"
        >
          <h3 className="text-lg font-bold text-[#0F172A]">{title}</h3>
          <ChevronDown className={`w-5 h-5 text-[#7C3AED] transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="space-y-3">
            {filters.map((filter) => (
              <label key={filter.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  onChange={(e) => onFilterChange?.(filter.id, e.target.checked)}
                  className="w-4 h-4 rounded accent-[#7C3AED]"
                />
                <span className="text-[#475569] font-medium">{filter.label}</span>
              </label>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FilterPanel;