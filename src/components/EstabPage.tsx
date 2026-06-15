import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { Building2, Search, TableProperties } from 'lucide-react';
import { DashboardData, LangType, ThemeType } from '../types';
import { fmt, pct, wName, getAvailableYears } from '../utils';
import { themeStyles } from '../theme';

interface EstabPageProps {
  data: DashboardData;
  lang: LangType;
  theme: ThemeType;
}

const COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f59e0b', '#f87171', '#a855f7', '#06d6a0', '#fbbf24', '#60a5fa', '#f472b6'];

export function EstabPage({ data, lang, theme }: EstabPageProps) {
  const isAr = lang === 'ar';
  const availableYears = getAvailableYears(data);
  const styles = themeStyles[theme] || themeStyles.immersive;
  
  const months = isAr 
    ? ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Filters State
  const [selectedWil, setSelectedWil] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Gather all facilities under selected Wilayat filter
  const wilayatsToProcess = selectedWil === 'ALL' ? Object.keys(data.by_wil_estab) : [selectedWil];
  const facilityVisitsMap: Record<string, number> = {};

  wilayatsToProcess.forEach(w => {
    const facilities = data.by_wil_estab[w] || {};
    Object.keys(facilities).forEach(f => {
      let v = 0;
      if (selectedMonth !== 'ALL') {
        if (selectedYear !== 'ALL') {
          v = data.by_estab_year_month[f]?.[selectedYear]?.[selectedMonth] || 0;
        } else {
          // Sum across all years for this month
          availableYears.forEach(yr => {
            v += data.by_estab_year_month[f]?.[yr]?.[selectedMonth] || 0;
          });
        }
      } else if (selectedYear !== 'ALL') {
        v = data.by_estab_year[f]?.[selectedYear] || 0;
      } else {
        v = facilities[f] || 0;
      }
      facilityVisitsMap[f] = (facilityVisitsMap[f] || 0) + v;
    });
  });

  // Convert to sorted list
  const sortedFacilities = Object.entries(facilityVisitsMap)
    .filter(([name, v]) => {
      if (v === 0) return false;
      if (searchQuery.trim() === '') return true;
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .map(([name, v]) => {
      // Find parent wilayat
      const parentW = Object.keys(data.by_wil_estab).find(w => data.by_wil_estab[w]?.[name] !== undefined) || 'SALALAH';
      return {
        name,
        value: v,
        wilayat: parentW
      };
    })
    .sort((a, b) => b.value - a.value);

  const totalScopeSum = sortedFacilities.reduce((a, b) => a + b.value, 0) || 1;
  const maxVal = sortedFacilities[0]?.value || 1;

  // Chart data form (renaming if too long) - showing all facilities in descending order
  const chartData = [...sortedFacilities].reverse().map(f => ({
    rawName: f.name,
    displayName: f.name.length > 25 ? f.name.slice(0, 24) + '…' : f.name,
    value: f.value
  }));

  return (
    <div className="space-y-6">
      {/* FILTER CONTROL CARD */}
      <div className={`${styles.innerCardBg}`}>
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h2 className={`text-xl font-black flex items-center gap-2 ${styles.textMain}`}>
              <Building2 className="w-5 h-5 text-sky-400" />
              <span>{isAr ? 'المترددين حسب المؤسسات' : 'Visitors by Facilities'}</span>
            </h2>
          </div>

          {/* Selectors grid */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className={`border rounded-lg px-2.5 py-1 flex items-center gap-2 w-full sm:w-44 ${styles.selectBg} ${styles.selectBorder}`}>
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text"
                placeholder={isAr ? 'بحث عن مؤسسة...' : 'Search facility...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`bg-transparent text-xs font-semibold outline-none py-0.5 w-full ${styles.selectText}`}
              />
            </div>

            {/* Wilayat Select */}
            <div className={`border rounded-lg px-2.5 py-1 flex items-center gap-2 ${styles.selectBg} ${styles.selectBorder}`}>
              <span className={`text-[10px] font-bold ${styles.textMuted}`}>{isAr ? 'الولاية:' : 'Wilayat:'}</span>
              <select 
                value={selectedWil} 
                onChange={(e) => setSelectedWil(e.target.value)}
                className={`bg-transparent text-xs font-bold outline-none cursor-pointer pr-1 ${styles.selectText}`}
              >
                <option value="ALL" className={styles.selectOptionBg}>{isAr ? 'جميع الولايات' : 'All Wilayats'}</option>
                {Object.keys(data.by_wil_estab).map(w => (
                  <option key={w} value={w} className={styles.selectOptionBg}>{wName(w, lang)}</option>
                ))}
              </select>
            </div>

            {/* Year Select */}
            <div className={`border rounded-lg px-2.5 py-1 flex items-center gap-2 ${styles.selectBg} ${styles.selectBorder}`}>
              <span className={`text-[10px] font-bold ${styles.textMuted}`}>{isAr ? 'السنة:' : 'Year:'}</span>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className={`bg-transparent text-xs font-bold outline-none cursor-pointer pr-1 ${styles.selectText}`}
              >
                <option value="ALL" className={styles.selectOptionBg}>{isAr ? 'جميع السنوات' : 'All Years'}</option>
                {availableYears.map(yr => (
                  <option key={yr} value={yr} className={styles.selectOptionBg}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Month Select */}
            <div className={`border rounded-lg px-2.5 py-1 flex items-center gap-2 ${styles.selectBg} ${styles.selectBorder}`}>
              <span className={`text-[10px] font-bold ${styles.textMuted}`}>{isAr ? 'الشهر:' : 'Month:'}</span>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`bg-transparent text-xs font-bold outline-none cursor-pointer pr-1 ${styles.selectText}`}
              >
                <option value="ALL" className={styles.selectOptionBg}>{isAr ? 'جميع الأشهر' : 'All Months'}</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const mVal = String(i + 1);
                  return (
                    <option key={mVal} value={mVal} className={styles.selectOptionBg}>{months[i + 1]}</option>
                  );
                })}
              </select>
            </div>

            {/* Clear button */}
            {(selectedWil !== 'ALL' || selectedYear !== 'ALL' || selectedMonth !== 'ALL' || searchQuery !== '') && (
              <button 
                onClick={() => { setSelectedWil('ALL'); setSelectedYear('ALL'); setSelectedMonth('ALL'); setSearchQuery(''); }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all cursor-pointer font-sans"
              >
                {isAr ? 'إعادة ضبط' : 'Reset'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CHARTS CONTAINER */}
      <div className="flex flex-col gap-4">
        
        {/* Top Facilities Horizontal Bar */}
        <div className={`${styles.innerCardBg} w-full`}>
          <div className="mb-4">
            <h4 className={`text-xs font-bold ${styles.textMain}`}>
              {isAr 
                ? 'أعلى المؤسسات الصحية تردداً' 
                : 'Highest Visited Health Facilities'
              }
            </h4>
          </div>

          <div style={{ height: `${Math.max(550, sortedFacilities.length * 24)}px` }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
                  <XAxis type="number" stroke="#64748b" fontSize={9} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${v/1000}k`} />
                  <YAxis dataKey="displayName" type="category" stroke="#64748b" fontSize={9} width={130} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, borderRadius: '8px' }}
                    itemStyle={{ color: styles.tooltipColor, fontSize: '11px' }}
                    formatter={(value: any, name: any, props: any) => [fmt(value as number), props.payload.rawName]}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold">
                {isAr ? 'لا توجد مؤسسة تطابق محددات البحث' : 'No facilities found matching details'}
              </div>
            )}
          </div>
        </div>

        {/* Capacity Loading Progress indicators */}
        <div className={`${styles.innerCardBg} w-full flex flex-col`}>
          <div className="mb-4">
            <h4 className={`text-xs font-bold ${styles.textMain}`}>{isAr ? 'الترتيب التنازلي التراكمي' : 'Descending Capacity Load'}</h4>
          </div>

          <div className="flex-1 space-y-3 pr-1.5">
            {sortedFacilities.length > 0 ? (
              sortedFacilities.map((f, i) => (
                <div key={f.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className={`truncate max-w-[200px] ${styles.textMain}`} title={f.name}>
                      <span className="text-slate-400 font-mono text-[9px] mr-1.5 inline-block w-4 text-center">#{i+1}</span>
                      {f.name}
                    </span>
                    <span className="text-sky-400 font-mono flex-shrink-0">
                      {fmt(f.value)}
                    </span>
                  </div>
                  <div className={`h-1.5 w-full bg-slate-900 border rounded-full overflow-hidden ${styles.border}`}>
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(f.value / maxVal * 100).toFixed(1)}%`,
                        backgroundColor: COLORS[i % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold p-10">
                {isAr ? 'لا توجد بيانات' : 'No data available'}
              </div>
            )}
          </div>
        </div>

        {/* DETAILED FACILITY STATISTICAL TABLE */}
        <div className={`${styles.innerCardBg} w-full`}>
          <div className={`flex items-center gap-2 mb-4 border-b pb-3 ${styles.border}`}>
            <TableProperties className="w-5 h-5 text-indigo-400" />
            <h4 className={`text-xs font-bold ${styles.textMain}`}>
              {isAr ? 'توزيع المترددين حسب المؤسسات و نسبة المترددين من الاجمالي' : 'Distribution of Visitors by Facilities & % of Total Visitors'}
            </h4>
          </div>

          <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="min-w-full text-xs font-sans">
            <thead>
              <tr className={`border-b text-right ltr:text-left select-none ${styles.border} ${styles.tableThBg}`}>
                <th className={`pb-3 pt-1 px-3 w-12 text-center ${styles.tableThText}`}>#</th>
                <th className={`pb-3 pt-1 px-3 ${styles.tableThText}`}>{isAr ? 'المؤسسة الطبية' : 'Healthcare Complex'}</th>
                <th className={`pb-3 pt-1 px-3 ${styles.tableThText}`}>{isAr ? 'الولاية الطبية' : 'Jurisdiction Wilayat'}</th>
                <th className={`pb-3 pt-1 px-3 text-left ltr:text-right ${styles.tableThText}`}>{isAr ? 'التردد الإجمالي' : 'Attendance Visits'}</th>
                <th className={`pb-3 pt-1 px-3 text-center w-24 ${styles.tableThText}`}>{isAr ? 'معدل الحصة %' : 'Operational Share'}</th>
              </tr>
            </thead>
            <tbody>
              {sortedFacilities.length > 0 ? (
                sortedFacilities.map((f, i) => (
                  <tr key={f.name} className={`border-b transition-all text-right ltr:text-left ${styles.tableTdBorder} ${styles.tableRowHover}`}>
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-center font-bold">#{i+1}</td>
                    <td className={`py-2.5 px-3 font-bold ${styles.textMain}`}>{f.name}</td>
                    <td className="py-2.5 px-3 text-slate-450 font-semibold">{wName(f.wilayat, lang)}</td>
                    <td className="py-2.5 px-3 font-mono text-sky-400 font-extrabold text-left ltr:text-right">{fmt(f.value)}</td>
                    <td className="py-2.5 px-3 font-mono text-indigo-400 text-center font-bold">
                      {pct(f.value, totalScopeSum)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-bold">
                    {isAr ? 'لا تتوفر سجلات تطابق عمليات الترشيح المحددة.' : 'No data aligned with selected filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);
}
