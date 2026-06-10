import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Merge, 
  RefreshCw,
  Undo,
  Trash2,
  Database
} from 'lucide-react';
import { LangType, DashboardData } from '../types';
import { getAvailableYears, mName } from '../utils';

interface UploadModalProps {
  onClose: () => void;
  lang: LangType;
  onDataApplied: (newData: DashboardData, meta: {
    savedAt: string;
    mode: 'merge' | 'replace';
    addedRows: number;
    total: number;
  }) => void;
  currentData: DashboardData;
  onDeleteMonthYear: (year: string, month: string) => boolean;
  onUndoLastAction: () => boolean;
  hasBackup: boolean;
  onResetFactory: () => void;
}

const REQUIRED_COLS = [
  'Total Visit',
  'Year',
  'Month',
  'REGION',
  'WILAYAT',
  'ESTABLISHMENT',
  'ENCOUNTER_TYPE',
  'HOLIDAY_YN',
  'SHIFT',
  'DEPARTMENT'
];

export function UploadModal({ 
  onClose, 
  lang, 
  onDataApplied,
  currentData,
  onDeleteMonthYear,
  onUndoLastAction,
  hasBackup,
  onResetFactory
}: UploadModalProps) {
  const isAr = lang === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Tab within the modal: 'upload' for imports, 'manage' for archives/deletion/undo
  const [activeTab, setActiveTab2] = useState<'upload' | 'manage'>('upload');

  // Month & Year deletion state
  const [selectedDeleteYear, setSelectedDeleteYear] = useState<string>('');
  const [selectedDeleteMonth, setSelectedDeleteMonth] = useState<string>('');
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [undoSuccess, setUndoSuccess] = useState<string | null>(null);

  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[] | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [showProgress, setShowProgress] = useState(false);
  const [warnings, setWarnings] = useState<string | null>(null);
  const [colsDetected, setColsDetected] = useState<string[]>([]);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [step, setStep] = useState<'upload' | 'success'>('upload');
  const [successInfo, setSuccessInfo] = useState({ rows: 0, total: 0 });

  // Compute live available years & months from the reactive database state
  const availableYears = getAvailableYears(currentData);
  const availableMonths = selectedDeleteYear && currentData.by_year_month?.[selectedDeleteYear]
    ? Object.keys(currentData.by_year_month[selectedDeleteYear]).sort((a,b) => parseInt(a)-parseInt(b))
    : [];

  const handleUndo = () => {
    const ok = onUndoLastAction();
    if (ok) {
      setUndoSuccess(
        isAr 
          ? '🇸🇴 تم التراجع عن آخر عملية واسترداد الحالة المستقرة السابقة بنجاح!' 
          : '✅ Last uploads successfully undone & previous stable state restored!'
      );
      setTimeout(() => setUndoSuccess(null), 6000);
    }
  };

  const handleDeleteMonth = () => {
    if (!selectedDeleteYear || !selectedDeleteMonth) return;
    const confirmed = window.confirm(
      isAr 
        ? `هل أنت متأكد من رغبتك في حذف كافة بيانات الشهر المحدد (${selectedDeleteMonth}/${selectedDeleteYear}) نهائياً؟ يمكنك التراجع عن هذا الإجراء لاحقاً.` 
        : `Are you sure you want to permanently delete all data for ${selectedDeleteMonth}/${selectedDeleteYear}? You can undo this action if needed.`
    );
    if (!confirmed) return;

    const ok = onDeleteMonthYear(selectedDeleteYear, selectedDeleteMonth);
    if (ok) {
      const monthLabel = isAr ? `الشهر ${selectedDeleteMonth}` : `Month ${selectedDeleteMonth}`;
      const yearLabel = selectedDeleteYear;
      setDeleteSuccess(
        isAr 
          ? `🗑️ تم حذف بيانات ${monthLabel} لعام ${yearLabel} بنجاح من لوحة البيانات!` 
          : `🗑️ Successfully deleted data for ${monthLabel} / ${yearLabel} from dashboard!`
      );
      setSelectedDeleteMonth('');
      setTimeout(() => setDeleteSuccess(null), 7000);
    }
  };

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  }

  function splitCSVLine(line: string): string[] {
    const result: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQ = !inQ;
      } else if (c === ',' && !inQ) {
        result.push(cur);
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur);
    return result;
  }

  function processFile(selectedFile: File) {
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setWarnings(isAr ? '⚠️ يجب أن يكون الملف بصيغة CSV' : '⚠️ File must be in CSV format');
      return;
    }
    
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length === 0) {
          setWarnings(isAr ? '⚠️ الملف فارغ' : '⚠️ File is empty');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        setColsDetected(headers);

        const missingCols = REQUIRED_COLS.filter(c => !headers.includes(c));
        if (missingCols.length > 0) {
          setWarnings(
            (isAr ? '⚠️ أعمدة مفرودة مفقودة: ' : '⚠️ Missing required columns: ') + 
            missingCols.join(', ')
          );
        } else {
          setWarnings(null);
        }

        const rows: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const vals = splitCSVLine(lines[i]);
          if (vals.length < headers.length) continue;
          const row: any = {};
          headers.forEach((h, j) => {
            row[h] = vals[j]?.trim().replace(/^"|"$/g, '') || '';
          });
          if (row['Total Visit'] && row['WILAYAT']) {
            rows.push(row);
          }
        }

        setParsedRows(rows);
      } catch (err: any) {
        setWarnings((isAr ? '⚠️ خطأ في قراءة الملف: ' : '⚠️ Error reading file: ') + err.message);
      }
    };
    reader.readAsText(selectedFile, 'UTF-8');
  }

  function calculateStats() {
    if (!parsedRows) return { visits: 0, years: '—' };
    const visits = parsedRows.reduce((a, r) => a + (parseInt(r['Total Visit']) || 0), 0);
    const years = Array.from(new Set(parsedRows.map(r => r['Year']))).sort().join(', ');
    return { visits, years };
  }

  function buildAggregations(rows: any[]): DashboardData {
    const agg: DashboardData = {
      total: 0,
      by_wilayat: {},
      by_year: {},
      by_month: {},
      by_enc: { OPD: 0, ANE: 0, COMMUNITY: 0 },
      by_shift: { '1ST SHIFT (MORNING)': 0, '2nd SHIFT (AFTERNOON)': 0, '3RD SHIFT (NIGHT)': 0 },
      by_holiday: { 'WORKING DAY': 0, 'HOLIDAY': 0 },
      by_wil_year: {},
      by_wil_enc: {},
      by_wil_shift: {},
      by_wil_holiday: {},
      by_wil_estab: {},
      by_estab_year: {},
      by_estab_enc: {},
      by_estab_shift: {},
      by_estab_holiday: {},
      by_estab_month: {},
      by_wil_month: {},
      by_year_month: {},
      by_wil_year_month: {},
      by_estab_year_month: {},
      by_wil_enc_year: {},
      by_estab_enc_year: {},
      by_wil_shift_year: {},
      by_estab_shift_year: {},
      by_wil_holiday_year: {},
      by_estab_holiday_year: {}
    };

    const inc = (obj: any, ...keys: any[]) => {
      let cur = obj;
      for (let i = 0; i < keys.length - 2; i++) {
        if (!cur[keys[i]]) cur[keys[i]] = {};
        cur = cur[keys[i]];
      }
      const last = keys[keys.length - 2];
      const val = keys[keys.length - 1];
      cur[last] = (cur[last] || 0) + val;
    };

    rows.forEach(r => {
      const v = parseInt(r['Total Visit']) || 0;
      const w = r['WILAYAT'];
      const yr = r['Year'];
      const mo = String(parseInt(r['Month']));
      const enc = r['ENCOUNTER_TYPE'] as 'OPD' | 'ANE' | 'COMMUNITY';
      const sh = r['SHIFT'] as '1ST SHIFT (MORNING)' | '2nd SHIFT (AFTERNOON)' | '3RD SHIFT (NIGHT)';
      const hol = r['HOLIDAY_YN'] as 'WORKING DAY' | 'HOLIDAY';
      const est = r['ESTABLISHMENT'];

      agg.total += v;
      inc(agg.by_wilayat, w, v);
      inc(agg.by_year, yr, v);
      inc(agg.by_month, mo, v);
      inc(agg.by_enc, enc, v);
      inc(agg.by_shift, sh, v);
      inc(agg.by_holiday, hol, v);
      inc(agg.by_wil_year, w, yr, v);
      inc(agg.by_wil_enc, w, enc, v);
      inc(agg.by_wil_shift, w, sh, v);
      inc(agg.by_wil_holiday, w, hol, v);
      inc(agg.by_wil_estab, w, est, v);
      inc(agg.by_estab_year, est, yr, v);
      inc(agg.by_estab_enc, est, enc, v);
      inc(agg.by_estab_shift, est, sh, v);
      inc(agg.by_estab_holiday, est, hol, v);
      inc(agg.by_estab_month, est, mo, v);
      inc(agg.by_wil_month, w, mo, v);
      inc(agg.by_year_month, yr, mo, v);
      inc(agg.by_wil_year_month, w, yr, mo, v);
      inc(agg.by_estab_year_month, est, yr, mo, v);
      inc(agg.by_wil_enc_year, w, enc, yr, v);
      inc(agg.by_estab_enc_year, est, enc, yr, v);
      inc(agg.by_wil_shift_year, w, sh, yr, v);
      inc(agg.by_estab_shift_year, est, sh, yr, v);
      inc(agg.by_wil_holiday_year, w, hol, yr, v);
      inc(agg.by_estab_holiday_year, est, hol, yr, v);
    });

    return agg;
  }

  function applyData() {
    if (!parsedRows || parsedRows.length === 0) return;

    setShowProgress(true);
    setProgress(15);

    setTimeout(() => {
      setProgress(50);
      try {
        const newAgg = buildAggregations(parsedRows);
        setProgress(85);

        // Notify parent to save and update state
        onDataApplied(newAgg, {
          savedAt: new Date().toISOString(),
          mode: mode,
          addedRows: parsedRows.length,
          total: newAgg.total
        });

        setProgress(100);
        setTimeout(() => {
          setSuccessInfo({
            rows: parsedRows.length,
            total: newAgg.total
          });
          setStep('success');
        }, 300);
      } catch (err: any) {
        setWarnings((isAr ? '⚠️ خطأ في معالجة البيانات: ' : '⚠️ Processing error: ') + err.message);
        setShowProgress(false);
      }
    }, 400);
  }

  const { visits: totalVisits, years: yearsCovered } = calculateStats();
  const fileSelected = !!file && parsedRows !== null;
  const isReadyToApply = fileSelected && REQUIRED_COLS.every(c => colsDetected.includes(c));

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-[580px] max-w-full shadow-2xl relative overflow-hidden flex flex-col font-sans">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 bg-white/5 border border-white/10 text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 p-2 rounded-lg cursor-pointer transition-all duration-200 z-10 ltr:left-auto ltr:right-4"
        >
          <X className="w-4 h-4" />
        </button>

        {step === 'upload' ? (
          <div className="p-6 md:p-8 flex flex-col h-full">
            {/* Elegant Selector tabs */}
            <div className="flex bg-slate-950/60 p-1 rounded-xl mb-6 border border-white/5">
              <button
                type="button"
                onClick={() => setActiveTab2('upload')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isAr ? 'رفع ملف جديد' : 'Upload Data File'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab2('manage');
                  setDeleteSuccess(null);
                  setUndoSuccess(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'manage'
                    ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>{isAr ? 'إدارة الأرشيف والتراجع' : 'Manage Data & Backups'}</span>
              </button>
            </div>

            {activeTab === 'manage' ? (
              <div className="space-y-4 text-right ltr:text-left">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-1 justify-start">
                    ⚙️ {isAr ? 'إدارة البيانات والأرشيف' : 'Database & Archival Settings'}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed justify-start">
                    {isAr 
                      ? 'يمكنك التراجع عن آخر عمليات رفع تم إجراؤها أو حذف شهر محدد من اللوحة لتنظيم البيانات.' 
                      : 'Undo the last upload or selectively delete any specific month from the dashboard aggregated records.'}
                  </p>
                </div>

                {/* Status Messages */}
                {deleteSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3.5 rounded-xl flex items-start gap-2.5 leading-relaxed font-bold">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                    <span>{deleteSuccess}</span>
                  </div>
                )}

                {undoSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3.5 rounded-xl flex items-start gap-2.5 leading-relaxed font-bold">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                    <span>{undoSuccess}</span>
                  </div>
                )}

                {/* Symmetrical Undo Block */}
                <div className={`p-4 rounded-xl border transition-all ${hasBackup ? 'border-sky-500/30 bg-sky-500/5' : 'border-white/5 bg-white/5 opacity-80'}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-xs text-slate-100 mb-1 flex items-center gap-1.5 justify-start">
                        <Undo className="w-4 h-4 text-sky-400" />
                        {isAr ? 'التراجع عن الإجراء الأخير' : 'Undo Last Upload Action'}
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed max-w-sm text-start">
                        {isAr
                          ? 'يقوم هذا الإجراء بالتراجع عن عمليات الرفع أو التعديلات الأخيرة التي قمت بها منذ القيام بآخر تحديث.'
                          : 'Reverts the aggregates back to the state held prior to your very last dataset integration.'}
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      disabled={!hasBackup}
                      onClick={handleUndo}
                      className={`py-2 px-3.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 border flex-shrink-0 ${
                        hasBackup
                          ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 border-sky-450 active:scale-95'
                          : 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed'
                      }`}
                    >
                      <Undo className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تراجع الآن 🇴🇲' : 'Undo Action 🇴🇲'}</span>
                    </button>
                  </div>
                </div>

                {/* Selective Month Deletion Panel */}
                <div className="p-4 rounded-xl border border-white/5 bg-slate-950/40 space-y-4">
                  <div>
                    <h4 className="font-bold text-xs text-slate-100 mb-1 flex items-center gap-1.5 justify-start">
                      <Trash2 className="w-4 h-4 text-red-400" />
                      {isAr ? 'حذف بيانات شهر محدد' : 'Delete Specific Month'}
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed text-start">
                      {isAr
                        ? 'حدد السنة والشهر الذي ترغب بحذف كافة بياناته ونسبه من اللوحة بالكامل.'
                        : 'Symmetrically clears out and subtracts statistical indices for your chosen month.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-right">
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">{isAr ? 'السنة' : 'Year'}</label>
                      <select
                        value={selectedDeleteYear}
                        onChange={(e) => {
                          setSelectedDeleteYear(e.target.value);
                          setSelectedDeleteMonth('');
                        }}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-red-500 transition-all font-mono"
                      >
                        <option value="">{isAr ? '--- اختر السنة ---' : '--- Choose Year ---'}</option>
                        {availableYears.map(yr => (
                          <option key={yr} value={yr}>{yr}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">{isAr ? 'الشهر' : 'Month'}</label>
                      <select
                        value={selectedDeleteMonth}
                        disabled={!selectedDeleteYear}
                        onChange={(e) => setSelectedDeleteMonth(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-red-500 transition-all font-mono disabled:opacity-50"
                      >
                        <option value="">{isAr ? '--- اختر الشهر ---' : '--- Choose Month ---'}</option>
                        {availableMonths.map(m => {
                          const monthNum = parseInt(m);
                          const label = isAr ? `${mName(monthNum, 'ar')} (${m})` : `${mName(monthNum, 'en')} (${m})`;
                          return (
                            <option key={m} value={m}>{label}</option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!selectedDeleteYear || !selectedDeleteMonth}
                    onClick={handleDeleteMonth}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      selectedDeleteYear && selectedDeleteMonth
                        ? 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500 hover:text-white active:scale-[0.99] cursor-pointer shadow-lg shadow-red-500/5'
                        : 'bg-white/5 text-slate-500 border-white/10 cursor-not-allowed'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'حذف بيانات الشهر المحدد نهائياً' : 'Delete Selected Month Data'}</span>
                  </button>
                </div>

                {/* System Reset */}
                <div className="p-4 rounded-xl border border-red-550/15 bg-red-950/20 flex items-center justify-between gap-4">
                  <div className="text-start">
                    <h4 className="font-bold text-xs text-red-400 mb-0.5">{isAr ? 'إعادة ضبط المصنع' : 'System Reset'}</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      {isAr
                        ? 'استبدال كافة البيانات المستوردة والمدمجة بالقيم الحكومية الافتراضية بمحافظة ظفار.'
                        : 'Wipe all uploads and restore the default MOH Omani indicators.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const ok = window.confirm(
                        isAr
                          ? 'هل أنت متأكد من رغبتك في حذف كل التعديلات المضافة والعودة لبيانات عمان الافتراضية؟'
                          : 'Are you sure you want to revert everything to the original default dataset?'
                      );
                      if (ok) {
                        onResetFactory();
                        setDeleteSuccess(isAr ? '🔄 تمت إعادة ضبط المصنع بنجاح!' : '🔄 Successfully reset to default Omani MOH statistics!');
                        setTimeout(() => setDeleteSuccess(null), 5000);
                      }
                    }}
                    className="py-2 px-3 bg-red-950/50 hover:bg-red-900/60 border border-red-550/30 text-red-300 hover:text-white rounded-xl text-[10px] font-bold cursor-pointer transition-all active:scale-95 flex-shrink-0"
                  >
                    {isAr ? 'ضبط المصنع' : 'Factory Reset'}
                  </button>
                </div>

                {/* Exit Footer */}
                <div className="flex justify-end pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 hover:text-slate-100 hover:border-white/10 text-slate-400 border border-white/5 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    {isAr ? 'إغلاق' : 'Close'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-1 justify-start">
                  📂 {isAr ? 'رفع ودمج قاعدة البيانات' : 'Upload and Sync Dataset'}
                </h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed text-start">
                  {isAr 
                    ? 'تدعم اللوحة ملفات الـ CSV مسبقة التبويب للمؤشرات الطبية والصحية في عمان.' 
                    : 'Upload Omani MOH structured CSV healthcare indicator documents.'}
                </p>

                {/* Drag and Drop Zone */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 mb-5 relative group ${
                    dragOver 
                      ? 'border-sky-500 bg-sky-500/5' 
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <Upload className={`w-10 h-10 mx-auto mb-3 transition-transform duration-300 group-hover:-translate-y-1 ${
                    dragOver ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-400'
                  }`} />
                  <div className="font-bold text-sm text-slate-200 mb-1">
                    {isAr ? 'اسحب ملف الـ CSV هنا' : 'Drag & Drop CSV file here'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isAr ? (
                      <>أو <span className="text-sky-400 font-bold underline cursor-pointer">انقر لاختيار ملف من جهازك</span></>
                    ) : (
                      <>or <span className="text-sky-400 font-bold underline cursor-pointer">click to browse local files</span></>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept=".csv" 
                    className="hidden" 
                    onChange={handleFileSelect} 
                  />
                </div>

                {/* Warnings Alert */}
                {warnings && (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs p-3.5 rounded-xl flex items-start gap-2.5 mb-4 leading-relaxed font-medium">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span>{warnings}</span>
                  </div>
                )}

                {/* FILE PREVIEW */}
                {fileSelected && (
                  <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 mb-5">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-3 mb-4">
                      <FileText className="w-8 h-8 text-sky-400 bg-sky-400/10 p-1.5 rounded-lg" />
                      <div className="overflow-hidden text-start">
                        <div className="text-xs font-bold text-slate-200 truncate">{file?.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {(file?.size || 0) / 1024 > 1024 
                            ? `${((file?.size || 0) / (1024 * 1024)).toFixed(2)} MB` 
                            : `${((file?.size || 0) / 1024).toFixed(1)} KB`
                          }
                          {' • '}
                          {isAr ? 'عدد السجلات: ' : 'Records: '} {parsedRows?.length?.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Substats */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                      <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <div className="text-[10px] text-slate-400 mb-0.5">{isAr ? 'عدد السجلات' : 'Rows'}</div>
                        <div className="font-bold text-slate-200 font-mono">{parsedRows?.length?.toLocaleString()}</div>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <div className="text-[10px] text-slate-400 mb-0.5">{isAr ? 'مجموع التردد' : 'Total Visits'}</div>
                        <div className="font-bold text-emerald-400 font-mono">
                          {totalVisits >= 1000000 
                            ? `${(totalVisits / 1000000).toFixed(2)}M` 
                            : totalVisits.toLocaleString()
                          }
                        </div>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <div className="text-[10px] text-slate-400 mb-0.5">{isAr ? 'الأعوام' : 'Years'}</div>
                        <div className="font-bold text-sky-400 font-mono">{yearsCovered || '—'}</div>
                      </div>
                    </div>

                    {/* Columns breakdown */}
                    <div className="text-[10px] text-slate-400 leading-relaxed max-h-16 overflow-y-auto bg-slate-950/50 p-2.5 rounded-lg border border-white/5 font-mono text-start">
                      <span className="font-sans font-bold text-[9px] uppercase text-slate-500 select-none block mb-1">
                        {isAr ? 'أعمدة ومحاور مطابقة:' : 'Detected Columns:'}
                      </span>
                      {colsDetected.join(' · ')}
                    </div>
                  </div>
                )}

                {/* Mode Select */}
                {fileSelected && (
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      type="button"
                      onClick={() => setMode('merge')}
                      className={`flex flex-col items-start p-3 rounded-xl border text-right ltr:text-left transition-all cursor-pointer ${
                        mode === 'merge' 
                          ? 'border-sky-500 bg-sky-500/10 text-sky-400 shadow-sm' 
                          : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Merge className="w-5 h-5 flex-shrink-0" />
                        <span className="font-bold text-xs">{isAr ? 'دمج البيانات وتراكمها' : 'Merge and Append'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-normal">
                        {isAr ? 'تتم إضافة السجلات الجديدة فوق الحالية شهرياً' : 'Adds row indexes seamlessly to historical records.'}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode('replace')}
                      className={`flex flex-col items-start p-3 rounded-xl border text-right ltr:text-left transition-all cursor-pointer ${
                        mode === 'replace' 
                          ? 'border-red-500/50 bg-red-500/10 text-red-400 shadow-sm' 
                          : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <RefreshCw className="w-5 h-5 flex-shrink-0" />
                        <span className="font-bold text-xs">{isAr ? 'استبدال بالكامل' : 'Replace and Overwrite'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-normal">
                        {isAr ? 'يتم مسح قاعدة البيانات الحالية وتعويضها بالملف' : 'Completely overwrites all records with the new file.'}
                      </p>
                    </button>
                  </div>
                )}

                {/* Progress Bar */}
                {showProgress && (
                  <div className="mb-5">
                    <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                      <span>{isAr ? 'جاري تطبيق وتدقيق السجلات...' : 'Applying indices...'}</span>
                      <span className="font-mono">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* ACTIONS */}
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={applyData}
                    disabled={!isReadyToApply || showProgress}
                    className={`flex-1 py-3.5 rounded-xl font-bold text-xs cursor-pointer shadow-lg shadow-sky-500/10 flex items-center justify-center gap-2 ${
                      isReadyToApply && !showProgress
                        ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 active:scale-[0.99] transition-all'
                        : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed shadow-none'
                    }`}
                  >
                    <span>{isAr ? '✅ تطبيق وتحديث اللوحة' : '✅ Apply & Refresh Dashboard'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-3.5 bg-white/5 hover:bg-white/10 hover:text-slate-100 hover:border-white/10 text-slate-400 border border-white/5 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center flex flex-col items-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4 bg-emerald-400/15 p-3 rounded-full shadow-lg shadow-emerald-400/10" />
            <h3 className="text-xl font-black text-slate-100 mb-2">
              {isAr ? 'تم تحديث البيانات بنجاح!' : 'Database Synchronized!'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">
              {isAr 
                ? `تم بنجاح تحميل وفك شفرة ${successInfo.rows.toLocaleString()} سجل طبي. إجمالي التردد على مستوى محافظة ظفار الآن هو ${successInfo.total.toLocaleString()} زيارة.`
                : `Successfully mapped and updated ${successInfo.rows.toLocaleString()} records. Dhofar aggregated clinical visits now total ${successInfo.total.toLocaleString()}.`
              }
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl font-black text-xs active:scale-95 transition-all w-48 shadow-lg shadow-emerald-400/10"
            >
              {isAr ? 'عرض اللوحة' : 'View Dashboard'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
