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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { CalendarDays, TrendingUp, TrendingDown, ClipboardSignature, Activity } from 'lucide-react';
import { DashboardData, LangType, ThemeType } from '../types';
import { fmt, pct, wName, getAvailableYears, resolveMonthly } from '../utils';
import { themeStyles } from '../theme';

interface MonthPageProps {
  data: DashboardData;
  lang: LangType;
  theme: ThemeType;
}

const COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f59e0b', '#f87171', '#a855f7', '#06d6a0', '#fbbf24', '#60a5fa', '#f472b6'];

export function MonthPage({ data, lang, theme }: MonthPageProps) {
  const isAr = lang === 'ar';
  const availableYears = getAvailableYears(data);
  const styles = themeStyles[theme] || themeStyles.immersive;

  const months = isAr 
    ? ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Month Filters State
  const [selectedWil, setSelectedWil] = useState<string>('ALL');
  const [selectedEstab, setSelectedEstab] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');

  // Cascade effect: clear invalid selection if Wilayat changed
  useEffect(() => {
    if (selectedWil !== 'ALL') {
      const estabOptionMap = data.by_wil_estab[selectedWil] || {};
      if (selectedEstab !== 'ALL' && !estabOptionMap[selectedEstab]) {
        setSelectedEstab('ALL');
      }
    }
  }, [selectedWil]);

  // Aggregate monthly values for selected scope
  const aggArr = resolveMonthly(data, selectedWil, selectedEstab, selectedYear);
  
  // Calculate Peak/Low indices
  let maxVal = -1;
  let minVal = Infinity;
  let maxIdx = 1;
  let minIdx = 1;
  let sum = 0;
  let activeCount = 0;

  aggArr.forEach((v, idx) => {
    sum += v;
    if (v > 0) activeCount++;
    if (v > maxVal) {
      maxVal = v;
      maxIdx = idx + 1;
    }
    if (v > 0 && v < minVal) {
      minVal = v;
      minIdx = idx + 1;
    }
  });

  if (minVal === Infinity) minVal = 0;
  const avg = Math.round(sum / (activeCount || 1));
  const peakRange = maxVal - minVal;

  // Highlights Bar Data
  const barData = Array.from({ length: 12 }, (_, i) => {
    const isSelected = selectedMonth === 'ALL' || selectedMonth === String(i + 1);
    return {
      name: months[i + 1],
      value: aggArr[i],
      highlight: isSelected
    };
  });

  // Radar Data
  const radarData = Array.from({ length: 12 }, (_, i) => ({
    subject: months[i + 1],
    value: aggArr[i]
  }));

  // Line multi-series dataset per year
  const lineYears = selectedYear === 'ALL' ? availableYears : [selectedYear];
  const monthlySeasonLineData = Array.from({ length: 12 }, (_, i) => {
    const mStr = String(i + 1);
    const row: any = { name: months[i + 1] };
    lineYears.forEach(yr => {
      let v = 0;
      if (selectedEstab !== 'ALL') {
        v = data.by_estab_year_month[selectedEstab]?.[yr]?.[mStr] || 0;
      } else if (selectedWil !== 'ALL') {
        v = data.by_wil_year_month[selectedWil]?.[yr]?.[mStr] || 0;
      } else {
        v = data.by_year_month[yr]?.[mStr] || 0;
      }
      row[yr] = v;
    });
    return row;
  });

  return (
    <div className="space-y-6">
      {/* HEADER FILTER DOCK */}
      <div className={`${styles.innerCardBg}`}>
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h2 className={`text-xl font-black flex items-center gap-2 ${styles.textMain}`}>
              <CalendarDays className="w-5 h-5 text-sky-450" />
              <span>{isAr ? 'المترددين حسب الشهر' : 'Visitors by Month'}</span>
            </h2>
          </div>

          {/* Filtering dropdown selections */}
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

            {/* Health facility cascading selector */}
            <div className={`border rounded-lg px-2.5 py-1 flex items-center gap-2 ${styles.selectBg} ${styles.selectBorder}`}>
              <span className={`text-[10px] font-bold ${styles.textMuted}`}>{isAr ? 'مؤسسة طبية:' : 'Clinic:'}</span>
              <select 
                value={selectedEstab} 
                onChange={(e) => setSelectedEstab(e.target.value)}
                className={`bg-transparent text-xs font-bold outline-none cursor-pointer pr-1 max-w-[140px] ${styles.selectText}`}
              >
                <option value="ALL" className={styles.selectOptionBg}>{isAr ? 'جميع مؤسسات الولاية' : 'All in Wilayat'}</option>
                {Object.keys(data.by_wil_estab).map(w => {
                  if (selectedWil !== 'ALL' && w !== selectedWil) return null;
                  return Object.keys(data.by_wil_estab[w] || {}).map(f => (
                    <option key={f} value={f} className={styles.selectOptionBg}>{f.length > 25 ? f.slice(0, 24) + '…' : f}</option>
                  ));
                })}
              </select>
            </div>

            {/* Month selector */}
            <div className={`border rounded-lg px-2.5 py-1 flex items-center gap-2 ${styles.selectBg} ${styles.selectBorder}`}>
              <span className={`text-[10px] font-bold ${styles.textMuted}`}>{isAr ? 'الشهر:' : 'Month:'}</span>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`bg-transparent text-xs font-bold outline-none cursor-pointer pr-1 ${styles.selectText}`}
              >
                <option value="ALL" className={styles.selectOptionBg}>{isAr ? 'جميع الأشهر' : 'All'}</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const mVal = String(i + 1);
                  return (
                    <option key={mVal} value={mVal} className={styles.selectOptionBg}>{months[i + 1]}</option>
                  );
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

            {/* Reset button */}
            {(selectedWil !== 'ALL' || selectedEstab !== 'ALL' || selectedMonth !== 'ALL' || selectedYear !== 'ALL') && (
              <button 
                onClick={() => { setSelectedWil('ALL'); setSelectedEstab('ALL'); setSelectedMonth('ALL'); setSelectedYear('ALL'); }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all cursor-pointer font-sans"
              >
                {isAr ? 'إعادة ضبط' : 'Reset'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SEASONAL KPI METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Highest load month */}
        <div className={`transition-all ${styles.innerCardBg}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className={`text-xs font-bold ${styles.textMuted}`}>{isAr ? 'أعلى توافد شهري' : 'Peak Loading Month'}</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-xl font-black font-mono tracking-tight leading-none ${styles.textMain}`}>
            {fmt(maxVal)}
          </div>
          <div className="text-xs text-emerald-400 font-bold mt-2">
            🏷️ {months[maxIdx]}
          </div>
        </div>

        {/* Lowest load month */}
        <div className={`transition-all ${styles.innerCardBg}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className={`text-xs font-bold ${styles.textMuted}`}>{isAr ? 'أدنى توافد شهري' : 'Lowest Attendance Month'}</span>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <div className={`text-xl font-black font-mono tracking-tight leading-none ${styles.textMain}`}>
            {fmt(minVal)}
          </div>
          <div className="text-xs text-red-400 font-bold mt-2">
            🏷️ {months[minIdx]}
          </div>
        </div>

        {/* Average checkup load per month */}
        <div className={`transition-all ${styles.innerCardBg}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className={`text-xs font-bold ${styles.textMuted}`}>{isAr ? 'التردد الشهري العام' : 'Monthly Mean Load'}</span>
            <ClipboardSignature className="w-4 h-4 text-indigo-400" />
          </div>
          <div className={`text-xl font-black font-mono tracking-tight leading-none ${styles.textMain}`}>
            {fmt(avg)}
          </div>
          <p className="text-[10px] text-slate-400 mt-2.5 select-none leading-none">
            {isAr ? 'المتوسط الشهري العام للمحافظة' : 'General average across calculated months'}
          </p>
        </div>

        {/* Range Peak Margin */}
        <div className={`transition-all ${styles.innerCardBg}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className={`text-xs font-bold ${styles.textMuted}`}>{isAr ? 'فارق التدفق المتفاوت' : 'Peak Flow Fluctuations'}</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className={`text-xl font-black font-mono tracking-tight leading-none ${styles.textMain}`}>
            {fmt(peakRange)}
          </div>
          <p className="text-[10px] text-slate-400 mt-2.5 select-none leading-none font-bold">
            {isAr ? 'فارق المراجعات بين الذروة والإنحسار' : 'Margin difference between peak and low checkups'}
          </p>
        </div>
      </div>

      {/* CLIMATIC MONTHLY BAR VISUALIZER */}
      <div className={`${styles.innerCardBg}`}>
        <h4 className={`text-xs font-bold mb-4 ${styles.textMain}`}>
          {isAr ? 'المترددين حسب الشهر' : 'Visitors by Month'}
        </h4>
        <div className="h-68">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} barSize={34}>
              <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
              <YAxis stroke="#64748b" fontSize={9} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${v/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, borderRadius: '8px' }}
                itemStyle={{ color: styles.tooltipColor, fontSize: '11px' }}
                formatter={(value: any) => [fmt(value), '']}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.highlight ? COLORS[index % COLORS.length] : 'rgba(255,255,255,0.08)'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RADAR & SEASONALITY COMPARISON DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Radar checkup mapping */}
        <div className={`${styles.innerCardBg}`}>
          <h4 className={`text-xs font-bold mb-1 ${styles.textMain}`}>
            {isAr ? 'تأطير المترددين الموسمي (Radar)' : 'Attainment Climatic Footprint (Radar Mapping)'}
          </h4>
          <p className="text-[10px] text-slate-400 mb-3">{isAr ? 'تجسيد بياني لمواسم ذروة التوافد الطبي الخريفي' : 'Identifies concentric patient waves on calendar weeks'}</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={9} />
                <PolarRadiusAxis angle={30} domain={[0, maxVal]} stroke="#64748b" fontSize={8} />
                <Radar 
                  name={isAr ? 'زيارات' : 'Visits'} 
                  dataKey="value" 
                  stroke={COLORS[0]} 
                  fill={COLORS[0]} 
                  fillOpacity={0.2} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, borderRadius: '8px' }}
                  itemStyle={{ color: styles.tooltipColor, fontSize: '11px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multi-series seasonality comparison line */}
        <div className={`${styles.innerCardBg}`}>
          <h4 className={`text-xs font-bold mb-4 ${styles.textMain}`}>
            {isAr ? 'مقارنة تذبذب المراجعة الطبية بين السنوات' : 'Year-on-Year Climatic Comparison'}
          </h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySeasonLineData}>
                <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, borderRadius: '8px' }}
                  itemStyle={{ color: styles.tooltipColor, fontSize: '11px' }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                {lineYears.map((yr, i) => (
                  <Line 
                    key={yr}
                    type="monotone" 
                    dataKey={yr} 
                    stroke={COLORS[i % COLORS.length]} 
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
