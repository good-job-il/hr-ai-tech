import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export function StatCard({ icon: Icon, label, value, change, trend }) {
  return (
    <Card hoverable>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#F3EFFF] to-[#EAF8FF] flex items-center justify-center">
            <Icon className="w-6 h-6 text-[#7C3AED]" />
          </div>
          {trend && (
            <span className={cn('text-xs font-bold', trend === 'up' ? 'text-[#059669]' : 'text-[#DC2626]')}>
              {change}
            </span>
          )}
        </div>
        <p className="text-[#64748B] text-sm font-semibold mb-1">{label}</p>
        <p className="text-3xl font-black text-[#0F172A]">{value}</p>
      </CardContent>
    </Card>
  );
}

export default StatCard;