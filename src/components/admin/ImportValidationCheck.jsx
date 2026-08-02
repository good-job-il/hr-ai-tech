import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react';

export default function ImportValidationCheck({ results, onApprove, onBack }) {
  const checks = results.checks || {};
  const readinessScore = results.readiness_score || 0;
  const isProduction = results.is_production_ready;

  const CheckItem = ({ label, passed, detail }) => (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${
      passed 
        ? 'border-green-200 bg-green-50' 
        : 'border-orange-200 bg-orange-50'
    }`}>
      {passed ? (
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${passed ? 'text-green-900' : 'text-orange-900'}`}>
          {label}
        </p>
        <p className={`text-sm mt-1 ${passed ? 'text-green-700' : 'text-orange-700'}`}>
          {detail}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium mb-4"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה
        </button>
        <h2 className="text-2xl font-bold text-gray-900">בדיקת יכולת ייבוא</h2>
        <p className="text-gray-600 mt-2">בדיקת אמינות הייבוא לפני ייבוא המוני</p>
      </div>

      {/* Readiness Score */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">ניקוד יכולת ייבוא</p>
            <p className="text-4xl font-bold text-purple-600 mt-2">{readinessScore}%</p>
          </div>
          <div className={`px-4 py-2 rounded-lg font-semibold ${
            isProduction
              ? 'bg-green-100 text-green-700'
              : 'bg-orange-100 text-orange-700'
          }`}>
            {isProduction ? '✓ מוכן לייבוא' : '⚠ טיפול נדרש'}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {results.recommendations && results.recommendations.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-900 mb-3">סוגיות שנמצאו</p>
              <ul className="space-y-2">
                {results.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-orange-800">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Checks */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">בדיקות פירוט</h3>
        <div className="space-y-3">
          <CheckItem
            label="העלאת קורות חיים"
            passed={checks.resume_upload?.passed}
            detail={`${checks.resume_upload?.success || 0} / ${checks.resume_upload?.total || 0} הוצלחו`}
          />
          <CheckItem
            label="המרה ל-DOCX"
            passed={checks.docx_conversion?.passed}
            detail={`${checks.docx_conversion?.success || 0} / ${checks.docx_conversion?.total || 0} הוצלחו`}
          />
          <CheckItem
            label="Parsing קורות חיים"
            passed={checks.parsing_success?.passed}
            detail={`${checks.parsing_success?.success || 0} הצליחו, ${checks.parsing_success?.partial || 0} חלקית, ${checks.parsing_success?.failed || 0} כשלו`}
          />
          <CheckItem
            label="אימייל"
            passed={checks.email_validation?.passed}
            detail={`${checks.email_validation?.success || 0} / ${checks.email_validation?.total || 0} עם אימייל`}
          />
          <CheckItem
            label="טלפון"
            passed={checks.phone_validation?.passed}
            detail={`${checks.phone_validation?.success || 0} / ${checks.phone_validation?.total || 0} עם טלפון`}
          />
          <CheckItem
            label="תפקיד"
            passed={checks.role_validation?.passed}
            detail={`${checks.role_validation?.success || 0} / ${checks.role_validation?.total || 0} עם תפקיד`}
          />
          <CheckItem
            label="זיהוי כפילויות"
            passed={checks.duplicate_detection?.passed}
            detail={`${checks.duplicate_detection?.clean || 0} נקיים, ${checks.duplicate_detection?.suspected || 0} חשודים`}
          />
          <CheckItem
            label="הקצאה למגייס"
            passed={checks.recruiter_assignment?.passed}
            detail={`${checks.recruiter_assignment?.assigned || 0} / ${checks.recruiter_assignment?.total || 0} מוקצים`}
          />
          <CheckItem
            label="איכות נתונים"
            passed={checks.data_quality?.passed}
            detail={`ממוצע ${checks.data_quality?.avg_score || 0}% (${checks.data_quality?.excellent || 0} מעולה, ${checks.data_quality?.good || 0} טוב, ${checks.data_quality?.poor || 0} חלש)`}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">סיכום</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">סה״כ מועמדים</p>
            <p className="text-2xl font-bold text-gray-900">{results.summary?.total_candidates || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">כפילויות חשודות</p>
            <p className="text-2xl font-bold text-red-600">{results.summary?.duplicates_suspected || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">בעיות parsing</p>
            <p className="text-2xl font-bold text-orange-600">{results.summary?.parsing_issues || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">חסר אימייל</p>
            <p className="text-2xl font-bold text-red-600">{results.summary?.missing_data?.email || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">חסר טלפון</p>
            <p className="text-2xl font-bold text-red-600">{results.summary?.missing_data?.phone || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">חסר תפקיד</p>
            <p className="text-2xl font-bold text-orange-600">{results.summary?.missing_data?.role || 0}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 sticky bottom-0 bg-white p-4 border-t border-gray-200 rounded-b-2xl">
        <button
          onClick={onBack}
          className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all"
        >
          ביטול
        </button>
        <button
          onClick={onApprove}
          disabled={!isProduction}
          className={`flex-1 px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
            isProduction
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          {isProduction ? 'אישור ייבוא' : 'בדיקות נכשלו'}
        </button>
      </div>
    </div>
  );
}
