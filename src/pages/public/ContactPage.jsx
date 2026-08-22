
export default function ContactPage() {
  return (
    <PublicLayout>
      <div className="max-w-[1600px] mx-auto px-7 py-16">
        <PageHeader
          title="צור איתנו קשר"
          description="אנחנו כאן לעזור"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card hoverable>
            <CardContent className="p-8">
              <h3 className="text-xl font-black text-[#0F172A] mb-4">שלח לנו הודעה</h3>

              <form className="space-y-4">
                <input placeholder="שמך" className="w-full h-10 px-4 rounded-lg border border-[#E4ECFF]" />

                <input placeholder="דוא״ל" className="w-full h-10 px-4 rounded-lg border border-[#E4ECFF]" />

                <textarea placeholder="הודעה" rows="5" className="w-full px-4 py-3 rounded-lg border border-[#E4ECFF]" />

                <button className="w-full h-10 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#2F80FF] text-white font-bold">
                  שלח הודעה
                </button>
              </form>
            </CardContent>
          </Card>

          <Card hoverable>
            <CardContent className="p-8">
              <h3 className="text-xl font-black text-[#0F172A] mb-6">פרטי יצירת קשר</h3>

              <div className="space-y-6">
                <div>
                  <p className="text-sm font-bold text-[#7C3AED]">אימייל</p>

                  <p className="text-[#0F172A]">hello@headhunter.co.il</p>
                </div>

                <div>
                  <p className="text-sm font-bold text-[#7C3AED]">טלפון</p>

                  <p className="text-[#0F172A]">+972 2 123 4567</p>
                </div>

                <div>
                  <p className="text-sm font-bold text-[#7C3AED]">כתובת</p>

                  <p className="text-[#0F172A]">תל אביב, ישראל</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
}
import { PageHeader } from "@/components/common"
import { Card, CardContent } from "@/components/ui/Card"
import PublicLayout from "@/components/layouts/PublicLayout"
