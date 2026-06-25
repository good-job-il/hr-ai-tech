import { Card, CardContent } from '@/components/ui/Card';

export function PipelineBoard({ stages, items }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stages.map((stage) => (
        <div key={stage.id}>
          <h3 className="text-sm font-bold text-[#0F172A] mb-3">{stage.name}</h3>
          <div className="space-y-3">
            {items
              .filter((item) => item.stage === stage.id)
              .map((item) => (
                <Card key={item.id} className="bg-white">
                  <CardContent className="p-4">
                    <p className="text-sm font-bold text-[#0F172A]">{item.name}</p>
                    <p className="text-xs text-[#64748B] mt-1">{item.company}</p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PipelineBoard;