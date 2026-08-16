import React, { useState } from 'react';
import { candidateImportService } from '@/api/services/candidateImportService';
import { fileService } from '@/api/services/fileService';
import { useAuth } from '@/lib/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { Upload, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ResumeZipUploader from '@/components/admin/ResumeZipUploader';

const CandidateImport = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);

  const { data: batches = [], refetch } = useQuery({
    queryKey: ['import-batches'],
    queryFn: async () => {
      const result = await candidateImportService.list({ sort: 'created_date', order: 'DESC', limit: 50 });
      return result || [];
    },
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json', 'application/zip'];
      if (!validTypes.includes(selectedFile.type)) {
        setUploadError('סוג קובץ לא תומך. בחר CSV, Excel, JSON או ZIP');
        return;
      }
      setFile(selectedFile);
      setUploadError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadError('בחר קובץ קודם');
      return;
    }

    setUploading(true);
    setUploadError('');
    setSuccessMessage('');

    try {
      // Upload file
      const uploadRes = await fileService.upload(file);
      const fileUrl = uploadRes.file_url;

      // Create import batch record
      const batchRes = await candidateImportService.create({
        batch_name: `${file.name.split('.')[0]} - ${new Date().toLocaleDateString('he-IL')}`,
        source_file: file.name,
        file_type: file.type.includes('spreadsheet') ? 'xlsx' : file.type.includes('zip') ? 'zip' : file.type.includes('json') ? 'json' : 'csv',
        recruiter_id: user?.id,
        team_manager_id: user?.role === 'team_manager' ? user.id : user?.team_manager_id,
        recruitment_manager_id: user?.recruitment_manager_id,
        total_records: 0
      });

      // Invoke import function
      const queued = await candidateImportService.queueFileImport(batchRes.id, fileUrl, file.name);
      const importResult = await candidateImportService.waitForJob(queued.id);

      setSuccessMessage(`הייבוא הושלם. ${importResult.message || ''}`);
      setFile(null);
      refetch();
    } catch (err) {
      setUploadError(`שגיאה בעדכון: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6" dir="rtl">
        <h1 className="text-3xl font-bold text-gray-900">ייבוא מועמדים</h1>

        {/* ZIP Resume Uploader */}
        <ResumeZipUploader onImportComplete={() => refetch()} />

        {/* Upload Section - Legacy */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">עדכון קובץ</h2>
            <p className="text-sm text-gray-600">תמוך ב־CSV, Excel, JSON או ZIP של קורות חיים</p>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-500 transition-colors cursor-pointer"
              onClick={() => document.getElementById('fileInput').click()}>
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-900 font-medium">גרור קובץ כאן או לחץ להעלאה</p>
              <p className="text-xs text-gray-500 mt-1">עד 100MB</p>
              <input
                id="fileInput"
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".csv,.xlsx,.json,.zip"
              />
            </div>

            {file && (
              <div className="bg-blue-50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-600">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            )}

            {uploadError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{uploadError}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white h-12 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'מעדכן...' : 'עדכן ויבא'}
            </button>
          </div>
        </div>

        {/* Batches History */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">היסטוריית יבואים</h2>

          {batches.length === 0 ? (
            <p className="text-gray-500 text-center py-8">אין יבואים עדיין</p>
          ) : (
            <div className="space-y-3">
              {batches.map((batch) => (
                <div key={batch.id} className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setSelectedBatch(selectedBatch?.id === batch.id ? null : batch)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{batch.batch_name}</p>
                      <p className="text-sm text-gray-600 mt-1">קובץ: {batch.source_file}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(batch.created_date).toLocaleDateString('he-IL')}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {batch.status === 'completed' && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                      {batch.status === 'in_progress' && (
                        <Clock className="w-5 h-5 text-yellow-600 animate-spin" />
                      )}
                      {batch.status === 'failed' && (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      )}
                      {batch.status === 'pending' && (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {selectedBatch?.id === batch.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{batch.successful_imports || 0}</p>
                        <p className="text-xs text-gray-600 mt-1">נקלטו</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{batch.failed_imports || 0}</p>
                        <p className="text-xs text-gray-600 mt-1">נכשלו</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-600">{batch.duplicate_found || 0}</p>
                        <p className="text-xs text-gray-600 mt-1">כפילויות</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">{batch.missing_email || 0}</p>
                        <p className="text-xs text-gray-600 mt-1">בלי אימייל</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{batch.missing_phone || 0}</p>
                        <p className="text-xs text-gray-600 mt-1">בלי טלפון</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default CandidateImport;
