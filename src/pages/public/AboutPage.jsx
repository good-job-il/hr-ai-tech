import { PageHeader } from '@/components/common';
import { Card, CardContent } from '@/components/ui/Card';
import PublicLayout from '@/components/layouts/PublicLayout';

export default function AboutPage() {
  return (
    <PublicLayout>
      <div className="max-w-[1600px] mx-auto px-7 py-16">
        <PageHeader
          title="על HeadHunter"
          description="פלטפורמת הגיוס האינטליגנטית בישראל"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: '🎯', title: 'המטרה שלנו', desc: 'להחברת מועמדים לעבודות המשתלמות' },
            { icon: '🚀', title: 'התחייבותנו', desc: 'לעתיד של גיוס חכם ויעיל' },
            { icon: '💡', title: 'הערכים שלנו', desc: 'שקיפות, חדשנות, כנות' },
          ].map((item) => (
            <Card key={item.title} hoverable>
              <CardContent className="p-8 text-center">
                <p className="text-4xl mb-3">{item.icon}</p>
                <h3 className="text-lg font-bold text-[#0F172A] mb-2">{item.title}</h3>
                <p className="text-[#64748B]">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card hoverable>
          <CardContent className="p-8">
            <h3 className="text-2xl font-black text-[#0F172A] mb-4">הסיפור שלנו</h3>
            <p className="text-[#64748B] leading-7">
              HeadHunter נוסדה במטרה להפוך את תהליך הגיוס לחכם, שקוף וגם לטובת המועמדים וגם לטובת המעסיקים.
              אנחנו משתמשים בטכנולוגיית AI מתקדמת כדי להתאים בין מועמדים לעבודות בדיוק מדהים.
            </p>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}