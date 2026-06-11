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
  Pie,
  LineChart,
  Line
} from 'recharts';
import { Calendar, TrendingUp, TrendingDown, ClipboardList } from 'lucide-react';
import { DashboardData, LangType, ThemeType } from '../types';
import { fmt, pct, wName, getAvailableYears } from '../utils';
import { themeStyles } from '../theme';

interface YearPageProps {
  data: DashboardData;
  lang: LangType;
  theme: ThemeType;
}

const COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f59e0b', '#f87171', '#a855f7', '#06d6a0', '#fbbf24', '#60a5fa', '#f472b6'];

export function YearPage({ data, lang, theme }: YearPageProps) {
  const isAr = lang === 'ar';
  const availableYears = getAvailableYears(data);
  const styles = themeStyles[theme] || themeStyles.immersive;

  const months = isAr 
    ? ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Year Filters State
  const [selectedWil, setSelectedWil] = useState<string>('ALL');
  const [selectedEstab, setSelectedEstab] = useState<string>('ALL');
  const [selectedYr, setSelectedYr] = useState<string>('ALL');

  // Cascade effect: clear invalid selection if Wilayat changed
  useEffect(() => {
    if (selectedWil !== 'ALL') {
      const estabOptionMap = data.by_wil_estab[selectedWil] || {};
      if (selectedEstab !== 'ALL' && !estabOptionMap[selectedEstab]) {
        setSelectedEstab('ALL');
      }
    }
  }, [selectedWil]);

  // Year values resolution
  const getYearValue = (yr: string) => {
    if (selectedEstab !== 'ALL') {
      return data.by_estab_year[selectedEstab]?.[yr] || 0;
    }
    if (selectedWil !== 'ALL') {
      return data.by_wil_year[selectedWil]?.[yr] || 0;
    }
    return data.by_year[yr] || 0;
  };

  const currentYrVals = availableYears.map(yr => getYearValue(yr));
  const annualAverage = Math.round(currentYrVals.reduce((a, b) => a + b, 0) / (availableYears.length || 1));

  // Chosen years list for display
  const activeYrs = selectedYr === 'ALL' ? availableYears : [selectedYr];
  const chartCompData = activeYrs.map((yr, i) => ({
    name: yr,
    value: getYearValue(yr),
    fill: COLORS[i % COLORS.length]
  }));

  // Line dataset (12 months)
  const monthlySeasonalityData = Array.from({ length: 12 }, (_, i) => {
    const mStr = String(i + 1);
    const row: any = { name: mName(i + 1) };
    activeYrs.forEach(yr => {
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

  function mName(m: number): string {
    return isAr ? months[m] : months[m];
  }

  // Wilayat comparison for chosen years
  const wils = selectedWil === 'ALL' ? Object.keys(data.by_wilayat) : [selectedWil];
  const wilCompChartData = wils.map(w => {
    const row: any = { name: wName(w, lang) };
    activeYrs.forEach(yr => {
      let v = 0;
      if (selectedEstab !== 'ALL') {
        v = data.by_estab_year[selectedEstab]?.[yr] || 0;
      } else {
        v = data.by_wil_year[w]?.[yr] || 0;
      }
      row[yr] = v;
    });
    return row;
  }).sort((a, b) => {
    const sumA = activeYrs.reduce((acc, yr) => acc + (a[yr] || 0), 0);
    const sumB = activeYrs.reduce((acc, yr) => acc + (b[yr] || 0), 0);
    return sumB - sumA;
  });

  return (
    <div className="space-y-6">
      {/* FILTER CONTROL PANEL */}
      <div className={`${styles.innerCardBg}`}>
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h2 className={`text-xl font-black flex items-center gap-2 ${styles.textMain}`}>
              <Calendar className="w-5 h-5 text-sky-450" />
              <span>{isAr ? 'المترددين حسب السنوات' : 'Visitors by Year'}</span>
            </h2>
            <p className={`text-xs mt-1 ${styles.textMuted}`}>
              {isAr ? 'قياس نسبة التمدد ومعدلات التغير ونمو التراكم السنوي بظفار.' : 'Track clinical checkups growth rate and annual performance shifts.'}
            </p>
          </div>

          {/* Filtering dropdown selects */}
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
              <span className={`text-[10px] font-bold ${styles.textMuted}`}>{isAr ? 'المنشأة الطبية:' : 'Healthcare Unit:'}</span>
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
                value={selectedYr} 
                onChange={(e) => setSelectedYr(e.target.value)}
                className={`bg-transparent text-xs font-bold outline-none cursor-pointer pr-1 ${styles.selectText}`}
              >
                <option value="ALL" className={styles.selectOptionBg}>{isAr ? 'جميع السنوات' : 'All Years'}</option>
                {availableYears.map(yr => (
                  <option key={yr} value={yr} className={styles.selectOptionBg}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Reset button */}
            {(selectedWil !== 'ALL' || selectedEstab !== 'ALL' || selectedYr !== 'ALL') && (
              <button 
                onClick={() => { setSelectedWil('ALL'); setSelectedEstab('ALL'); setSelectedYr('ALL'); }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all cursor-pointer font-sans"
              >
                {isAr ? 'إعادة ضبط' : 'Reset'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ANNUAL KPI COUNTER DOCKS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Render card per Year in database */}
        {availableYears.map((yr, idx) => {
          const val = currentYrVals[idx];
          const prevVal = currentYrVals[idx - 1];
          const diff = prevVal ? ((val - prevVal) / prevVal * 100) : null;
          
          return (
            <div key={yr} className={`relative overflow-hidden transition-all duration-300 ${styles.innerCardBg}`}>
              <div 
                className="absolute top-0 left-0 w-full h-[3px]"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              {diff !== null && (
                <div className={`absolute top-4 left-4 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full select-none ${
                  diff >= 0 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {diff >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span className="font-mono">{Math.abs(diff).toFixed(1)}%</span>
                </div>
              )}
              <div className={`text-xl mb-1 font-bold font-mono ${styles.textMuted}`}>{yr}</div>
              <div className={`text-2xl font-black font-mono tracking-tight leading-none ${styles.textMain}`}>
                {fmt(val)}
              </div>
              <p className={`text-[10px] mt-3 font-semibold select-none ${styles.textMuted}`}>
                {isAr ? `إجمالي الزيارات لعام ${yr}` : `Attendance cases for ${yr}`}
              </p>
            </div>
          );
        })}

        {/* Annual average checkups card */}
        <div className={`relative overflow-hidden transition-all duration-300 ${styles.innerCardBg}`}>
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-400 to-pink-500" />
          <div className="text-xl mb-1">
            <ClipboardList className="w-4 h-4 text-purple-400 inline-block align-text-bottom" />
          </div>
          <div className={`text-2xl font-black font-mono tracking-tight leading-none ${styles.textMain}`}>
            {fmt(annualAverage)}
          </div>
          <p className={`text-[10px] mt-3 font-semibold select-none ${styles.textMuted}`}>
            {isAr ? 'المعدل الطبي السنوي العام' : 'Calculated average flow per fiscal year'}
          </p>
        </div>
      </div>

      {/* CHRONO VISUALIZERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chronological bar comparison */}
        <div className={`${styles.innerCardBg}`}>
          <h4 className={`text-xs font-bold mb-1 ${styles.textMain}`}>
            {isAr ? 'علاوة الطلب والتردد السنوي' : 'Annual Visited volume check'}
          </h4>
          <p className="text-[10px] text-slate-400 mb-3">{isAr ? 'الحجم العام للتردد الطبي تحت الفلترة التراكمية' : 'Case values comparison matching your query'}</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartCompData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={9} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, borderRadius: '8px' }}
                  itemStyle={{ color: styles.tooltipColor, fontSize: '11px' }}
                  formatter={(value: any) => [fmt(value), '']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartCompData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chrono donut values */}
        <div className={`${styles.innerCardBg}`}>
          <h4 className={`text-xs font-bold mb-1 ${styles.textMain}`}>
            {isAr ? 'حصص التوافد الطرازي' : 'In-scope chronological share'}
          </h4>
          <p className="text-[10px] text-slate-400 mb-3">{isAr ? 'انفصال المجموع التشغيلي طبقاً للأعوام' : 'Ratios of selected annual slots'}</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartCompData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {chartCompData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
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
          </div>
        </div>
      </div>

      {/* MONTHLY PERFORMANCE SEASONALITY LINE */}
      <div className={`${styles.innerCardBg}`}>
        <h4 className={`text-xs font-bold mb-1 ${styles.textMain}`}>
          {isAr ? 'الأداء والتدرج الموسمي الشهري للأعوام المحددة' : 'Annual In-Depth Seasonality (Month-by-Month)'}
        </h4>
        <p className="text-[10px] text-slate-400 mb-4">{isAr ? 'مقارنة تذبذب المراجعة الطبية للمحيط الفعال' : 'Seasonal monthly pattern comparing chosen annual patient indices'}</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlySeasonalityData}>
              <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={9} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${v/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, borderRadius: '8px' }}
                itemStyle={{ color: styles.tooltipColor, fontSize: '11px' }}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
              {activeYrs.map((yr, i) => (
                <Line 
                  key={yr}
                  type="monotone" 
                  dataKey={yr} 
                  stroke={COLORS[i % COLORS.length]} 
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* WILAYAT COMPARATIVE BAR MATRIX */}
      <div className={`${styles.innerCardBg}`}>
        <h4 className={`text-xs font-bold mb-1 ${styles.textMain}`}>
          {isAr ? 'مقارنة الولايات تفصيلياً حسب السنة' : 'Wilayat Case comparison by Chronological Target'}
        </h4>
        <p className="text-[10px] text-slate-400 mb-4">{isAr ? 'تشريح تطور الزيارات الجغرافي السنوي المباشر' : 'Annual medical load distribution metrics comparing side-by-side'}</p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wilCompChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
              <YAxis stroke="#64748b" fontSize={9} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${v/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, borderRadius: '8px' }}
                itemStyle={{ color: styles.tooltipColor, fontSize: '11px' }}
              />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
              {activeYrs.map((yr, i) => (
                <Bar key={yr} dataKey={yr} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
