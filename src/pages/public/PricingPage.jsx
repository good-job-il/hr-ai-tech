import { PageHeader } from '@/components/common';
import { Card, CardContent } from '@/components/ui/Card';
import PublicLayout from '@/components/layouts/PublicLayout';

export default function PricingPage() {
  return (
    <PublicLayout>
      <div className="max-w-[1600px] mx-auto px-7 py-16">
        <PageHeader
          title="תמחור שקוף"
          description="בחר את התוכנית שמתאימה לך"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Starter', price: '₪0', features: ['גישה בסיסית', 'עד 5 משרות', 'תמיכה בדוא"ל'] },
            { name: 'Pro', price: '₪99/חודש', features: ['הכל ב־Starter', 'עד 50 משרות', 'AI Matching', 'תמיכה עדיפות'] },
            { name: 'Enterprise', price: 'מנויים', features: ['הכל ב־Pro', 'אפליקציות בלתי מוגבלות', 'ייעוץ ייעודי'] },
          ].map((plan) => (
            <Card key={plan.name} hoverable>
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-black text-[#0F172A] mb-2">{plan.name}</h3>
                <p className="text-3xl font-black text-[#7C3AED] mb-6">{plan.price}</p>
                <ul className="space-y-3 mb-6 text-left">
                  {plan.features.map((feature) => (
                    <li key={feature} className="text-sm text-[#64748B]">✓ {feature}</li>
                  ))}
                </ul>
                <button className="w-full h-10 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#2F80FF] text-white font-bold">
                  בחר תוכנית
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}