import { Card, CardContent } from "@/components/ui/Card"
import { Sparkles } from "lucide-react"

export function AIInsightCard({ title, insight, action }) {
  return (
    <Card
      className="bg-gradient-to-br from-[#F3EFFF] to-[#EAF8FF] border border-[#DDEBFF]"
      hoverable
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-3">
          <Sparkles className="w-5 h-5 text-[#7C3AED] flex-shrink-0 mt-1" />
          <div className="flex-1">
            <p className="font-bold text-[#0F172A]">{title}</p>
            <p className="text-sm text-[#64748B] mt-2">{insight}</p>
          </div>
        </div>
        {action && <div className="mt-4 pt-4 border-t border-[#DDEBFF]">{action}</div>}
      </CardContent>
    </Card>
  )
}

export default AIInsightCard
