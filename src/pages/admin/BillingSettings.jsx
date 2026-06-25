import { CreditCard, DollarSign, Receipt, TrendingUp, Users, Briefcase } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

function StatCard({ icon: Icon, label, value, color = '#7C3AED' }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: color + '15' }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-black text-gray-900">{value}</div>
        <div className="text-sm font-semibold text-gray-600">{label}</div>
      </div>
    </div>
  );
}

export default function BillingSettings() {
  const { user } = useAuth();

  return (
    <div dir="rtl" className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-black text-gray-900">חיוב ותמחור</h1>
        </div>
        <p className="text-sm text-gray-500">ניהול תוכניות, תשלומים וחשבוניות</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={DollarSign} label="הכנסות חודשיות" value="₪45,280" color="#059669" />
        <StatCard icon={Receipt} label="חשבוניות פתוחות" value="12" color="#EA580C" />
        <StatCard icon={TrendingUp} label="צמיחה חודשית" value="+18%" color="#2563EB" />
      </div>

      {/* Pricing Plans */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">תוכניות מחירים פעילות</h2>
        <div className="grid gap-4">
          <div className="border border-purple-200 rounded-lg p-5 bg-purple-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">תוכנית Enterprise</div>
                  <div className="text-xs text-gray-600">לחברות גדולות עם נפח גיוס גבוה</div>
                </div>
              </div>
              <span className="text-sm font-bold text-purple-700 bg-purple-100 px-3 py-1.5 rounded-full">₪2,999/חודש</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">✓ עד 50 משרות פעילות</span>
              <span className="flex items-center gap-1">✓ AI Matching מתקדם</span>
              <span className="flex items-center gap-1">✓ תמיכה מלאה</span>
            </div>
          </div>

          <div className="border border-blue-200 rounded-lg p-5 bg-blue-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">תוכנית Professional</div>
                  <div className="text-xs text-gray-600">לעסקים בינוניים</div>
                </div>
              </div>
              <span className="text-sm font-bold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full">₪1,499/חודש</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">✓ עד 20 משרות פעילות</span>
              <span className="flex items-center gap-1">✓ AI Matching בסיסי</span>
              <span className="flex items-center gap-1">✓ תמיכה במייל</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-bold text-gray-900 mb-4">חשבוניות אחרונות</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <Receipt className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-bold text-gray-900">חשבונית #INV-2024-001</div>
                <div className="text-xs text-gray-500">ינואר 2024 • Enterprise</div>
              </div>
            </div>
            <div className="text-left">
              <div className="font-bold text-gray-900">₪2,999</div>
              <div className="text-xs text-green-600 font-semibold">שולם</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <Receipt className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-bold text-gray-900">חשבונית #INV-2024-002</div>
                <div className="text-xs text-gray-500">פברואר 2024 • Enterprise</div>
              </div>
            </div>
            <div className="text-left">
              <div className="font-bold text-gray-900">₪2,999</div>
              <div className="text-xs text-green-600 font-semibold">שולם</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border border-orange-100 rounded-lg bg-orange-50">
            <div className="flex items-center gap-3">
              <Receipt className="w-5 h-5 text-orange-400" />
              <div>
                <div className="font-bold text-gray-900">חשבונית #INV-2024-003</div>
                <div className="text-xs text-gray-500">מרץ 2024 • Enterprise</div>
              </div>
            </div>
            <div className="text-left">
              <div className="font-bold text-gray-900">₪2,999</div>
              <div className="text-xs text-orange-600 font-semibold">בהמתנה</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}