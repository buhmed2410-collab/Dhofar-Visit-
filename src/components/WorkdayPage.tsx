import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend,
  PieChart,
  Pie
} from 'recharts';
import { Clock, Calendar, Sun, Moon } from 'lucide-react';
import { DashboardData, LangType, ThemeType } from '../types';
import { fmt, pct, wName, getAvailableYears, resolveScope } from '../utils';
import { themeStyles } from '../theme';

interface WorkdayPageProps {
  data: DashboardData;
  lang: LangType;
  theme: ThemeType;
}

export function WorkdayPage({ data, lang, theme }: WorkdayPageProps) {
  const isAr = lang === 'ar';
  const availableYears = getAvailableYears(data);
  const styles = themeStyles[theme] || themeStyles.immersive;

  // Workday Filters State
  const [selectedWil, setSelectedWil] = useState<string>('ALL');
  const [selectedEstab, setSelectedEstab] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedDaytype, setSelectedDaytype] = useState<string>('ALL');
  const [selectedShift, setSelectedShift] = useState<string>('ALL');

  // Cascade effect: clear invalid selection if Wilayat changed
  useEffect(() => {
    if (selectedWil !== 'ALL') {
      const estabOptionMap = data.by_wil_estab[selectedWil] || {};
      if (selectedEstab !== 'ALL' && !estabOptionMap[selectedEstab]) {
        setSelectedEstab('ALL');
      }
    }
  }, [selectedWil]);

  // Extract values
  const scope = resolveScope(data, selectedWil, selectedEstab, selectedYear);
  const { total: scopeTotal, shift, holiday } = scope;

  const morning = shift['1ST SHIFT (MORNING)'] || 0;
  const afternoon = shift['2nd SHIFT (AFTERNOON)'] || 0;
  const night = shift['3RD SHIFT (NIGHT)'] || 0;
  const workDays = holiday['WORKING DAY'] || 0;
  const holidays = holiday['HOLIDAY'] || 0;
  
  const totHol = workDays + holidays || 1;
  const totShift = morning + afternoon + night || 1;

  // Filter values depending on Shift / Daytype Selects
  const plotMorning = (selectedShift === 'ALL' || selectedShift === '1ST SHIFT (MORNING)') ? morning : 0;
  const plotAfternoon = (selectedShift === 'ALL' || selectedShift === '2nd SHIFT (AFTERNOON)') ? afternoon : 0;
  const plotNight = (selectedShift === 'ALL' || selectedShift === '3RD SHIFT (NIGHT)') ? night : 0;

  const plotWorkDays = (selectedDaytype === 'ALL' || selectedDaytype === 'WORKING DAY') ? workDays : 0;
  const plotHolidays = (selectedDaytype === 'ALL' || selectedDaytype === 'HOLIDAY') ? holidays : 0;

  // Pie 1: Shift Distrib
  const shiftPieData = [
    { name: isAr ? 'صباحي' : 'Morning Shift', value: plotMorning, color: '#38bdf8' },
    { name: isAr ? 'مسائي' : 'Afternoon Shift', value: plotAfternoon, color: '#f59e0b' },
    { name: isAr ? 'ليلي' : 'Night Shift', value: plotNight, color: '#818cf8' }
  ].filter(d => d.value > 0);

  // Pie 2: Daytype Distrib
  const daytypePieData = [
    { name: isAr ? 'أيام العمل' : 'Working Days', value: plotWorkDays, color: '#34d399' },
    { name: isAr ? 'أيام الإجازات' : 'Holidays', value: plotHolidays, color: '#f87171' }
  ].filter(d => d.value > 0);

  // Geographic comparison chart data
  const wils = selectedWil === 'ALL' ? Object.keys(data.by_wilayat) : [selectedWil];
  const shiftsToPlot = ['1ST SHIFT (MORNING)', '2nd SHIFT (AFTERNOON)', '3RD SHIFT (NIGHT)'];
  const shiftKeysTranslated = isAr ? ['صباحي', 'مسائي', 'ليلي'] : ['Morning', 'Afternoon', 'Night'];

  const wilShiftData = wils.map(w => {
    const row: any = { name: wName(w, lang) };
    shiftsToPlot.forEach((shKey, idx) => {
      let v = 0;
      if (selectedEstab !== 'ALL') {
        v = selectedYear !== 'ALL' ? (data.by_estab_shift_year[selectedEstab]?.[shKey]?.[selectedYear] || 0) : (data.by_estab_shift[selectedEstab]?.[shKey] || 0);
      } else {
        v = selectedYear !== 'ALL' ? (data.by_wil_shift_year[w]?.[shKey]?.[selectedYear] || 0) : (data.by_wil_shift[w]?.[shKey] || 0);
      }
      
      const plotThis = (selectedShift === 'ALL' || selectedShift === shKey) ? v : 0;
      row[shiftKeysTranslated[idx]] = plotThis;
    });
    return row;
  }).sort((a, b) => {
    const sumA = shiftKeysTranslated.reduce((acc, k) => acc + (a[k] || 0), 0);
    const sumB = shiftKeysTranslated.reduce((acc, k) => acc + (b[k] || 0), 0);
    return sumB - sumA;
  });

  return (
    <div className="space-y-6">
      {/* FILTER HEADER CARD */}
      <div className={`${styles.innerCardBg}`}>
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h2 className={`text-xl font-black flex items-center gap-2 ${styles.textMain}`}>
              <Clock className="w-5 h-5 text-sky-400" />
              <span>{isAr ? 'علاقات وتأثير الشيفتات وتصنيف الأيام' : 'Clinical Workloads & Shift Rotations'}</span>
            </h2>
            <p className={`text-xs mt-1 ${styles.textMuted}`}>
              {isAr ? 'مراقبة الكثافة التشغيلية للشفت الصباحي والمسائي والحرجة في عمان.' : 'Optimize clinic resources by monitoring day matrices and shift allocation rates.'}
            </p>
          </div>

          {/* Slicing filter selector row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Wilayat selector */}
            <div className={`border rounded-lg px-2.5 py-1 flex items-center gap-2 ${styles.selectBg} ${styles.selectBorder}`}>
              <span className={`text-[10px] font-bold ${styles.textMuted}`}>{isAr ? 'الولاية:' : 'Wilayat:'}</span>
              <select 
                value={selectedWil} 
                onChange={(e) => { setSelectedWil(e.target.value); setSelectedEstab('ALL'); }}
                className={`bg-transparent text-xs font-bold outline-none cursor-pointer pr-1 ${styles.selectText}`}
              >
                <option value="ALL" className={styles.selectOptionBg}>{isAr ? 'جميع الولايات' : 'All'}</option>
                {Object.keys(data.by_wil_estab).map(w => (
                  <option key={w} value={w} className={styles.selectOptionBg}>{wName(w, lang)}</option>
                ))}
              </select>
            </div>

            {/* Cascaded health facility selector */}
            <div className={`border rounded-lg px-2.5 py-1 flex items-center gap-2 ${styles.selectBg} ${styles.selectBorder}`}>
              <span className={`text-[10px] font-bold ${styles.textMuted}`}>{isAr ? 'منشأة طبية:' : 'Clinical Hub:'}</span>
              <select 
                value={selectedEstab} 
                onChange={(e) => setSelectedEstab(e.target.value)}
                className={`bg-transparent text-xs font-bold outline-none cursor-pointer pr-1 max-w-[140px] ${styles.selectText}`}
              >
                <option value="ALL" className={styles.selectOptionBg}>{isAr ? 'جميع منشآت الولاية' : 'All in Wilayat'}</option>
                {Object.keys(data.by_wil_estab).map(w => {
                  if (selectedWil !== 'ALL' && w !== selectedWil) return null;
                  return Object.keys(data.by_wil_estab[w] || {}).map(f => (
                    <option key={f} value={f} className={styles.selectOptionBg}>{f.length > 25 ? f.slice(0, 24) + '…' : f}</option>
                  ));
                })}
              </select>
            </div>

            {/* Year selector */}
            <div className={`border rounded-lg px-2.5 py-1 flex items-center gap-2 ${styles.selectBg} ${styles.selectBorder}`}>
              <span className={`text-[10px] font-bold ${styles.textMuted}`}>{isAr ? 'السنة:' : 'Year:'}</span>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className={`bg-transparent text-xs font-bold outline-none cursor-pointer pr-1 ${styles.selectText}`}
              >
                <option value="ALL" className={styles.selectOptionBg}>{isAr ? 'جميع السنوات' : 'All'}</option>
                {availableYears.map(yr => (
                  <option key={yr} value={yr} className={styles.selectOptionBg}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Day type selector */}
            <div className={`border rounded-lg px-2.5 py-1 flex items-center gap-2 ${styles.selectBg} ${styles.selectBorder}`}>
              <span className={`text-[10px] font-bold ${styles.textMuted}`}>{isAr ? 'نوع اليوم:' : 'Day Type:'}</span>
              <select 
                value={selectedDaytype} 
                onChange={(e) => setSelectedDaytype(e.target.value)}
                className={`bg-transparent text-xs font-bold outline-none cursor-pointer pr-1 ${styles.selectText}`}
              >
                <option value="ALL" className={styles.selectOptionBg}>{isAr ? 'الكل' : 'All'}</option>
                <option value="WORKING DAY" className={styles.selectOptionBg}>{isAr ? 'أيام العمل' : 'Working Day'}</option>
                <option value="HOLIDAY" className={styles.selectOptionBg}>{isAr ? 'الإجازات الرسمية' : 'Holiday'}</option>
              </select>
            </div>

            {/* Shift selector */}
            <div className={`border rounded-lg px-2.5 py-1 flex items-center gap-2 ${styles.selectBg} ${styles.selectBorder}`}>
              <span className={`text-[10px] font-bold ${styles.textMuted}`}>{isAr ? 'النوبة (الشفت):' : 'Shift:'}</span>
              <select 
                value={selectedShift} 
                onChange={(e) => setSelectedShift(e.target.value)}
                className={`bg-transparent text-xs font-bold outline-none cursor-pointer pr-1 ${styles.selectText}`}
              >
                <option value="ALL" className={styles.selectOptionBg}>{isAr ? 'جميع النوبات' : 'All Shifts'}</option>
                <option value="1ST SHIFT (MORNING)" className={styles.selectOptionBg}>{isAr ? 'الصباحي' : 'Morning Shift'}</option>
                <option value="2nd SHIFT (AFTERNOON)" className={styles.selectOptionBg}>{isAr ? 'المسائي' : 'Afternoon Shift'}</option>
                <option value="3RD SHIFT (NIGHT)" className={styles.selectOptionBg}>{isAr ? 'الليلي' : 'Night Shift'}</option>
              </select>
            </div>

            {/* Reset button */}
            {(selectedWil !== 'ALL' || selectedEstab !== 'ALL' || selectedYear !== 'ALL' || selectedDaytype !== 'ALL' || selectedShift !== 'ALL') && (
              <button 
                onClick={() => { setSelectedWil('ALL'); setSelectedEstab('ALL'); setSelectedYear('ALL'); setSelectedDaytype('ALL'); setSelectedShift('ALL'); }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all cursor-pointer font-sans"
              >
                {isAr ? 'إعادة ضبط' : 'Reset'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DETAILED DAILY KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Working Day Flow */}
        <div className={`transition-all select-none ${styles.innerCardBg}`}>
          <div className="flex items-center justify-between text-slate-405 mb-1.5">
            <span className={`text-xs font-bold ${styles.textMuted}`}>{isAr ? 'أيام العمل الرسمية' : 'Regular Working Days'}</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-xl font-black font-mono tracking-tight ${styles.textMain}`}>{fmt(workDays)}</div>
          <div className="text-[10px] text-slate-400 font-bold mt-2 flex items-center gap-1.5">
            <span className="bg-emerald-400/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-black">{pct(workDays, totHol)}</span>
            <span>{isAr ? 'من الحصص الإجمالية' : 'of aggregate day matrices'}</span>
          </div>
        </div>

        {/* Holidays flow */}
        <div className={`transition-all select-none ${styles.innerCardBg}`}>
          <div className="flex items-center justify-between text-slate-405 mb-1.5">
            <span className={`text-xs font-bold ${styles.textMuted}`}>{isAr ? 'أيام الإجازات والعطلات' : 'Weekend & Holidays Load'}</span>
            <Calendar className="w-4 h-4 text-red-400" />
          </div>
          <div className={`text-xl font-black font-mono tracking-tight ${styles.textMain}`}>{fmt(holidays)}</div>
          <div className="text-[10px] text-slate-400 font-bold mt-2 flex items-center gap-1.5">
            <span className="bg-red-400/10 text-red-500 px-1.5 py-0.5 rounded font-mono font-black">{pct(holidays, totHol)}</span>
            <span>{isAr ? 'من الحصص الإجمالية' : 'of holiday checkups'}</span>
          </div>
        </div>

        {/* Morning active load */}
        <div className={`transition-all select-none ${styles.innerCardBg}`}>
          <div className="flex items-center justify-between text-slate-405 mb-1.5">
            <span className={`text-xs font-bold ${styles.textMuted}`}>{isAr ? 'نشاط الشفت الصباحي' : 'Morning Shift Routines'}</span>
            <Sun className="w-4 h-4 text-sky-400" />
          </div>
          <div className={`text-xl font-black font-mono tracking-tight ${styles.textMain}`}>{fmt(morning)}</div>
          <div className="text-[10px] text-slate-400 font-bold mt-2 flex items-center gap-1.5">
            <span className="bg-sky-400/10 text-sky-400 px-1.5 py-0.5 rounded font-mono font-black">{pct(morning, totShift)}</span>
            <span>{isAr ? 'تمثيل النوب النهارية' : 'of shift patient waves'}</span>
          </div>
        </div>

        {/* Night active load */}
        <div className={`transition-all select-none ${styles.innerCardBg}`}>
          <div className="flex items-center justify-between text-slate-405 mb-1.5">
            <span className={`text-xs font-bold ${styles.textMuted}`}>{isAr ? 'نشاط الشفت الليلي الحرج' : 'Night Triage Shifts'}</span>
            <Moon className="w-4 h-4 text-indigo-400" />
          </div>
          <div className={`text-xl font-black font-mono tracking-tight ${styles.textMain}`}>{fmt(night)}</div>
          <div className="text-[10px] text-slate-400 font-bold mt-2 flex items-center gap-1.5">
            <span className="bg-indigo-400/10 text-indigo-400 px-1.5 py-0.5 rounded font-mono font-black">{pct(night, totShift)}</span>
            <span>{isAr ? 'معدل الحالات الليلية' : 'of clinical services rendered'}</span>
          </div>
        </div>
      </div>

      {/* SHIFT & WORKDAY COMPOSITION PLOTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Shfiting Pie */}
        <div className={`${styles.innerCardBg}`}>
          <h4 className={`text-xs font-bold mb-1 ${styles.textMain}`}>
            {isAr ? 'الهيكلية النسبية للنوبات (الشفتات)' : 'Daily Shifts Ratio Breakdown'}
          </h4>
          <p className="text-[10px] text-slate-400 mb-3">{isAr ? 'تقسيم ضغط توافد المراجعين بين الشفت الصباحي والمسائي والليل' : 'Clinical load divisions matching select constraints'}</p>
          <div className="h-64">
            {shiftPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shiftPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {shiftPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, borderRadius: '8px' }}
                    itemStyle={{ color: styles.tooltipColor, fontSize: '11px' }}
                    formatter={(value: any) => [fmt(value), '']}
                  />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-405 font-bold p-10">
                {isAr ? 'لا توجد بيانات مطابقة لتصفية النوبة' : 'No available shifts matching current variables'}
              </div>
            )}
          </div>
        </div>

        {/* Daytype Pie */}
        <div className={`${styles.innerCardBg}`}>
          <h4 className={`text-xs font-bold mb-1 ${styles.textMain}`}>
            {isAr ? 'التوزيع بين أيام العمل والعطلات' : 'Days Load Allocation Ratios'}
          </h4>
          <p className="text-[10px] text-slate-400 mb-3">{isAr ? 'تجسيد بياني لمؤشر الضغط طوال أيام الأسبوع' : 'Proportions comparing standard business hours vs emergency gaps'}</p>
          <div className="h-64">
            {daytypePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={daytypePieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {daytypePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, borderRadius: '8px' }}
                    itemStyle={{ color: styles.tooltipColor, fontSize: '11px' }}
                    formatter={(value: any) => [fmt(value), '']}
                  />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-405 font-bold p-10">
                {isAr ? 'لا توجد بيانات مطابقة لتصفية أيام الدام' : 'No active data matching day types'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SHIFTS DISTRIBUTION MATRIX ACROSS WILAYATS */}
      <div className={`${styles.innerCardBg}`}>
        <h4 className={`text-xs font-bold mb-1 ${styles.textMain}`}>
          {isAr ? 'تأثير وعلاقات النوبات العلاجية بالولايات' : 'Clinical Daily Shifts Load Geographies Comparison'}
        </h4>
        <p className="text-[10px] text-slate-400 mb-4">{isAr ? 'تشريح تفصيلي لضغط الشفتات الصباحية والمسائية واليلية بالولاية' : 'Compare shifts pressure concentrations across Dhofar jurisdictions in view'}</p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wilShiftData}>
              <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
              <YAxis stroke="#64748b" fontSize={9} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${v/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, borderRadius: '8px' }}
                itemStyle={{ color: styles.tooltipColor, fontSize: '11px' }}
              />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
              {(selectedShift === 'ALL' || selectedShift === '1ST SHIFT (MORNING)') && (
                <Bar dataKey={isAr ? 'صباحي' : 'Morning'} stackId="a" fill="#38bdf8" />
              )}
              {(selectedShift === 'ALL' || selectedShift === '2nd SHIFT (AFTERNOON)') && (
                <Bar dataKey={isAr ? 'مسائي' : 'Afternoon'} stackId="a" fill="#f59e0b" />
              )}
              {(selectedShift === 'ALL' || selectedShift === '3RD SHIFT (NIGHT)') && (
                <Bar dataKey={isAr ? 'ليلي' : 'Night'} stackId="a" fill="#818cf8" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
