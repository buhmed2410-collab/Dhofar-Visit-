import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Map, Users, Stethoscope, AlertCircle } from 'lucide-react';
import { DashboardData, LangType, ThemeType } from '../types';
import { fmt, pct, wName, getAvailableYears } from '../utils';
import { themeStyles } from '../theme';

interface WilayatPageProps {
  data: DashboardData;
  lang: LangType;
  theme: ThemeType;
}

const COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f59e0b', '#f87171', '#a855f7', '#06d6a0', '#fbbf24', '#60a5fa', '#f472b6'];

export function WilayatPage({ data, lang, theme }: WilayatPageProps) {
  const isAr = lang === 'ar';
  const availableYears = getAvailableYears(data);
  const styles = themeStyles[theme] || themeStyles.immersive;

  // States
  const [selectedWilayat, setSelectedWilayat] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');

  const wilayats = Object.keys(data.by_wilayat);
  const activeWils = selectedWilayat === 'ALL' ? wilayats : [selectedWilayat];

  // Resolve Stats
  const totals = activeWils.reduce((acc, w) => {
    const visits = selectedYear === 'ALL' 
      ? (data.by_wilayat[w] || 0) 
      : (data.by_wil_year[w]?.[selectedYear] || 0);

    const opd = selectedYear === 'ALL'
      ? (data.by_wil_enc[w]?.OPD || 0)
      : (data.by_wil_enc_year[w]?.OPD?.[selectedYear] || 0);

    const ane = selectedYear === 'ALL'
      ? (data.by_wil_enc[w]?.ANE || 0)
      : (data.by_wil_enc_year[w]?.ANE?.[selectedYear] || 0);

    return {
      visits: acc.visits + visits,
      opd: acc.opd + opd,
      ane: acc.ane + ane
    };
  }, { visits: 0, opd: 0, ane: 0 });

  // 1. Wilayat Comparison Chart Data
  const compChartData = activeWils.map(w => ({
    name: wName(w, lang),
    value: selectedYear === 'ALL' ? (data.by_wilayat[w] || 0) : (data.by_wil_year[w]?.[selectedYear] || 0)
  })).sort((a, b) => b.value - a.value);

  // 2. Encounters Stacked Chart Data
  const encChartData = activeWils.map(w => {
    const opd = selectedYear === 'ALL' ? (data.by_wil_enc[w]?.OPD || 0) : (data.by_wil_enc_year[w]?.OPD?.[selectedYear] || 0);
    const ane = selectedYear === 'ALL' ? (data.by_wil_enc[w]?.ANE || 0) : (data.by_wil_enc_year[w]?.ANE?.[selectedYear] || 0);
    const com = selectedYear === 'ALL' ? (data.by_wil_enc[w]?.COMMUNITY || 0) : (data.by_wil_enc_year[w]?.COMMUNITY?.[selectedYear] || 0);
    return {
      name: wName(w, lang),
      [isAr ? 'عيادات خارجية' : 'OPD']: opd,
      [isAr ? 'طوارئ' : 'Emergency']: ane,
      [isAr ? 'مجتمعية' : 'Community']: com
    };
  }).sort((a, b) => {
    const sumA = Object.values(a).filter(val => typeof val === 'number').reduce((x, y) => x + y, 0) as number;
    const sumB = Object.values(b).filter(val => typeof val === 'number').reduce((x, y) => x + y, 0) as number;
    return sumB - sumA;
  });

  // 3. Year Trends Column Data
  const yearTrendData = activeWils.map(w => {
    const row: any = { name: wName(w, lang) };
    availableYears.forEach(yr => {
      row[yr] = data.by_wil_year[w]?.[yr] || 0;
    });
    return row;
  });

  // 4. Ranking values
  const rankingList = wilayats.map(w => ({
    key: w,
    name: wName(w, lang),
    value: selectedYear === 'ALL' ? (data.by_wilayat[w] || 0) : (data.by_wil_year[w]?.[selectedYear] || 0)
  })).sort((a, b) => b.value - a.value);

  const maxRankValue = rankingList[0]?.value || 1;

  return (
    <div className="space-y-6">
      {/* FILTER HEADER CARD */}
      <div className={`${styles.innerCardBg}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className={`text-xl font-black flex items-center gap-2 ${styles.textMain}`}>
              <Map className="w-5 h-5 text-sky-400" />
              <span>{isAr ? 'المترددين بالولايات' : 'Visitors by Wilayat'}</span>
            </h2>
            <p className={`text-xs mt-1 ${styles.textMuted}`}>
              {isAr ? 'مراقبة الكثافة التشغيلية والفوارق الطبية بين ولايات ظفار.' : 'Monitor operational load and regional checkups comparison.'}
            </p>
          </div>

          {/* Selector filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Wilayat Select */}
            <div className={`border rounded-lg px-2.5 py-1 flex items-center gap-2 ${styles.selectBg} ${styles.selectBorder}`}>
              <span className={`text-[10px] font-bold ${styles.textMuted}`}>{isAr ? 'الولاية:' : 'Wilayat:'}</span>
              <select 
                value={selectedWilayat} 
                onChange={(e) => setSelectedWilayat(e.target.value)}
                className={`bg-transparent text-xs font-bold outline-none cursor-pointer pr-1 ${styles.selectText}`}
              >
                <option value="ALL" className={styles.selectOptionBg}>{isAr ? 'جميع الولايات' : 'All Wilayats'}</option>
                {wilayats.map(w => (
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

            {/* Reset Button */}
            {(selectedWilayat !== 'ALL' || selectedYear !== 'ALL') && (
              <button 
                onClick={() => { setSelectedWilayat('ALL'); setSelectedYear('ALL'); }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all cursor-pointer"
              >
                {isAr ? 'إعادة ضبط' : 'Reset'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* REGIONAL KPI COUNTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Visits Checkups */}
        <div className={`transition-all ${styles.innerCardBg}`}>
          <div className={`flex items-center justify-between ${styles.textMuted}`}>
            <span className="text-xs font-bold">{isAr ? 'المترددين حسب الولايات' : 'Visitors by Wilayat'}</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className={`text-xl font-black font-mono mt-1.5 leading-none ${styles.textMain}`}>
            {fmt(totals.visits)}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            {isAr ? 'إجمالي المترددين' : 'Total Visitors'}
          </p>
        </div>

        {/* Count areas included */}
        <div className={`transition-all ${styles.innerCardBg}`}>
          <div className={`flex items-center justify-between ${styles.textMuted}`}>
            <span className="text-xs font-bold">{isAr ? 'الولايات المشمولة' : 'Municipalities Monitored'}</span>
            <Map className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-xl font-black font-mono mt-1.5 leading-none ${styles.textMain}`}>
            {activeWils.length}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            {isAr ? 'عدد المناطق الطبية المصنفة' : 'Number of health jurisdictions in view'}
          </p>
        </div>

        {/* Avg patient flow per Wilayat */}
        <div className={`transition-all ${styles.innerCardBg}`}>
          <div className={`flex items-center justify-between ${styles.textMuted}`}>
            <span className="text-xs font-bold">{isAr ? 'متوسط الزيارات للولاية' : 'Mean Patient Flow Rate'}</span>
            <Stethoscope className="w-4 h-4 text-indigo-400" />
          </div>
          <div className={`text-xl font-black font-mono mt-1.5 leading-none ${styles.textMain}`}>
            {fmt(Math.round(totals.visits / activeWils.length))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            {isAr ? 'معدل التوزيع النسبي لل checkups' : 'Average cases per jurisdiction in view'}
          </p>
        </div>

        {/* Emergency rate proportion */}
        <div className={`transition-all ${styles.innerCardBg}`}>
          <div className={`flex items-center justify-between ${styles.textMuted}`}>
            <span className="text-xs font-bold">{isAr ? 'معدل الحالات الحرجة %' : 'Emergency Incidence Rate'}</span>
            <AlertCircle className="w-4 h-4 text-red-550" />
          </div>
          <div className={`text-xl font-black font-mono mt-1.5 leading-none ${styles.textMain}`}>
            {pct(totals.ane, totals.visits)}
          </div>
          <p className="text-[10px] text-slate-400 font-bold mt-2 flex items-center gap-1">
            <span>{isAr ? 'شكلت طوارئ ANE: ' : 'Total critical triage: ' }</span>
            <span className="text-red-500 font-mono">{fmt(totals.ane)}</span>
          </p>
        </div>
      </div>

      {/* GEOGRAPHIC GRAPH VISUALIZERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Wilayat Checkups Comparison */}
        <div className={`${styles.innerCardBg}`}>
          <h4 className={`text-xs font-bold mb-1 ${styles.textMain}`}>
            {isAr ? 'المترددين حسب الولايات' : 'Visitors by Wilayat'}
          </h4>
          <p className="text-[10px] text-slate-400 mb-3">{isAr ? 'احصائيات التميز الجغرافي المقارن المباشر' : 'Relative loading comparing in-scope areas'}</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, borderRadius: '8px' }}
                  itemStyle={{ color: styles.tooltipColor, fontSize: '11px' }}
                  formatter={(value: any) => [fmt(value), '']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {compChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stacked encounter classifications */}
        <div className={`${styles.innerCardBg}`}>
          <h4 className={`text-xs font-bold mb-1 ${styles.textMain}`}>
            {isAr ? 'المترددين حسب نوع الزيارة' : 'Visitors by Visit Type'}
          </h4>
          <p className="text-[10px] text-slate-400 mb-3">{isAr ? 'نوع الزيارة عيادة خارجية / طوارئ/ رعاية إجتماعية' : 'Visit Type: OPD / Emergency / Community'}</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={encChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, borderRadius: '8px' }}
                  itemStyle={{ color: styles.tooltipColor, fontSize: '11px' }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey={isAr ? 'عيادات خارجية' : 'OPD'} stackId="a" fill="#34d399" radius={[0, 0, 0, 0]} />
                <Bar dataKey={isAr ? 'طوارئ' : 'Emergency'} stackId="a" fill="#f87171" radius={[0, 0, 0, 0]} />
                <Bar dataKey={isAr ? 'مجتمعية' : 'Community'} stackId="a" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TREND STACK CHANGES OVER YEARS */}
      <div className={`${styles.innerCardBg}`}>
        <h4 className={`text-xs font-bold mb-4 ${styles.textMain}`}>
          {isAr ? 'مؤشر الزيارات عبر السنوات' : 'Visits Indicator Over Years'}
        </h4>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
              <YAxis stroke="#64748b" fontSize={9} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${v/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, borderRadius: '8px' }}
                itemStyle={{ color: styles.tooltipColor, fontSize: '11px' }}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
              {availableYears.map((yr, i) => (
                <Bar key={yr} dataKey={yr} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* WILAYAT LEAGUE TABLE RANKINGS */}
      <div className={`${styles.innerCardBg}`}>
        <h4 className={`text-xs font-bold mb-4 ${styles.textMain}`}>
          {isAr ? 'ترتيب الولايات حسب عدد المترددين' : 'Wilayats Ranking by Number of Visitors'}
        </h4>
        
        <div className="space-y-3.5">
          {rankingList.map((item, idx) => (
            <div key={item.key} className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className={styles.textMain}>
                  <span className="text-slate-400 font-mono text-[10px] ltr:mr-2 rtl:ml-2">#{idx+1}</span>
                  {item.name}
                </span>
                <span className="text-sky-400 font-mono">
                  {fmt(item.value)}
                  <span className="text-[10px] text-slate-400 font-normal mr-1.5 font-sans">
                    ({pct(item.value, totals.visits)})
                  </span>
                </span>
              </div>
              <div className={`h-1.5 w-full bg-slate-900 border rounded-full overflow-hidden ${styles.border}`}>
                <div 
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${(item.value / maxRankValue * 100).toFixed(1)}%`,
                    backgroundColor: COLORS[idx % COLORS.length]
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
