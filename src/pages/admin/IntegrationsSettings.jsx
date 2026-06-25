import { useState } from 'react';
import { Plug, Globe, Mail, Calendar, Database, Key, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const INTEGRATIONS = [
  { 
    id: 'gmail', 
    name: 'Gmail', 
    icon: Mail, 
    status: 'connected',
    description: 'קליטת קורות חיים ממיילים, תיוג אוטומטי',
    scopes: ['gmail.readonly', 'gmail.modify']
  },
  { 
    id: 'google-calendar', 
    name: 'Google Calendar', 
    icon: Calendar, 
    status: 'available',
    description: 'תיאום ראיונות, תזכורות אוטומטיות'
  },
  { 
    id: 'linkedin', 
    name: 'LinkedIn', 
    icon: Globe, 
    status: 'coming_soon',
    description: 'יבוא מועמדים, פרסום משרות'
  },
  { 
    id: 'database', 
    name: 'ייבוא נתונים', 
    icon: Database, 
    status: 'available',
    description: 'ייבוא מאקסל, CSV, מערכות חיצוניות'
  },
];

export default function IntegrationsSettings() {
  const { user } = useAuth();
  const [selectedIntegration, setSelectedIntegration] = useState(null);

  return (
    <div dir="rtl" className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Plug className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-black text-gray-900">אינטגרציות וחיבורים</h1>
        </div>
        <p className="text-sm text-gray-500">חבר מערכות חיצוניות וכלים אוטומטיים</p>
      </div>

      <div className="grid gap-4">
        {/* Active Integrations */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            אינטגרציות פעילות
          </h2>
          <div className="space-y-3">
            {INTEGRATIONS.filter(i => i.status === 'connected').map(integration => (
              <div key={integration.id} className="flex items-center justify-between p-4 border border-green-200 rounded-lg bg-green-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                    <integration.icon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{integration.name}</div>
                    <div className="text-xs text-gray-600">{integration.description}</div>
                    {integration.scopes && (
                      <div className="text-[10px] text-gray-500 mt-1">
                        הרשאות: {integration.scopes.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
                <button className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                  נתק
                </button>
              </div>
            ))}
            {INTEGRATIONS.filter(i => i.status === 'connected').length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Plug className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>אין אינטגרציות פעילות כרגע</p>
              </div>
            )}
          </div>
        </div>

        {/* Available Integrations */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-bold text-gray-900 mb-4">אינטגרציות זמינות</h2>
          <div className="grid gap-3">
            {INTEGRATIONS.filter(i => i.status === 'available').map(integration => (
              <div key={integration.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                    <integration.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{integration.name}</div>
                    <div className="text-xs text-gray-600">{integration.description}</div>
                  </div>
                </div>
                <button className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors">
                  חבר
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 opacity-60">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-400" />
            בקרוב
          </h2>
          <div className="grid gap-3">
            {INTEGRATIONS.filter(i => i.status === 'coming_soon').map(integration => (
              <div key={integration.id} className="flex items-center gap-3 p-4 border border-gray-100 rounded-lg bg-gray-50">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                  <integration.icon className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-700">{integration.name}</div>
                  <div className="text-xs text-gray-500">{integration.description}</div>
                </div>
                <span className="text-xs font-semibold text-gray-400 px-3 py-1.5 bg-gray-200 rounded-full">
                  בקרוב
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* API Keys */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" />
            מפתחות API
          </h2>
          <div className="space-y-3">
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Gmail API</span>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">פעיל</span>
              </div>
              <div className="text-xs text-gray-500">משמש לקליטת קורות חיים ממיילים</div>
            </div>
            <button className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-500 text-sm font-semibold rounded-lg hover:border-purple-400 hover:text-purple-600 transition-colors">
              + הוסף מפתח API חדש
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}