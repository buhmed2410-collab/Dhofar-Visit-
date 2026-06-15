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
import { Activity, Stethoscope, AlertTriangle, ShieldCheck } from 'lucide-react';
import { DashboardData, LangType, ThemeType } from '../types';
import { fmt, pct, wName, mName, getAvailableYears, resolveScope, resolveMonthly } from '../utils';
import { themeStyles } from '../theme';

interface VisitPageProps {
  data: DashboardData;
  lang: LangType;
  theme: ThemeType;
}

export function VisitPage({ data, lang, theme }: VisitPageProps) {
  const isAr = lang === 'ar';
  const availableYears = getAvailableYears(data);
  const styles = themeStyles[theme] || themeStyles.immersive;

  const months = isAr 
    ? ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Visit Filters State
  const [selectedWil, setSelectedWil] = useState<string>('ALL');
  const [selectedEstab, setSelectedEstab] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedEnc, setSelectedEnc] = useState<string>('ALL');

  // Cascade effect: clear invalid selection if Wilayat changed
  useEffect(() => {
    if (selectedWil !== 'ALL') {
      const estabOptionMap = data.by_wil_estab[selectedWil] || {};
      if (selectedEstab !== 'ALL' && !estabOptionMap[selectedEstab]) {
        setSelectedEstab('ALL');
      }
    }
  }, [selectedWil]);

  // Double Period Comparison States
  const [compYearA, setCompYearA] = useState<string>('2024');
  const [compSubA, setCompSubA] = useState<string>('Q1');
  const [compYearB, setCompYearB] = useState<string>('2025');
  const [compSubB, setCompSubB] = useState<string>('Q1');

  // Helper to compute encounters for high flexibility selection
  const getPeriodData = (yr: string, subset: string) => {
    const scope = resolveScope(data, selectedWil, selectedEstab, yr);
    
    let monthsList: string[] = [];
    if (subset === 'ALL') {
      monthsList = Array.from({ length: 12 }, (_, i) => String(i + 1));
    } else if (subset === 'Q1') {
      monthsList = ['1', '2', '3'];
    } else if (subset === 'Q2') {
      monthsList = ['4', '5', '6'];
    } else if (subset === 'Q3') {
      monthsList = ['7', '8', '9'];
    } else if (subset === 'Q4') {
      monthsList = ['10', '11', '12'];
    } else {
      monthsList = [subset];
    }

    const monthlyVals = resolveMonthly(data, selectedWil, selectedEstab, yr);
    let subsetSum = 0;
    monthsList.forEach(m => {
      subsetSum += monthlyVals[parseInt(m) - 1] || 0;
    });

    const yearSum = Object.values(monthlyVals).reduce((a, b) => a + b, 0) || 1;
    const ratio = yearSum > 0 ? subsetSum / yearSum : 0;

    return {
      opd: Math.round((scope.enc.OPD || 0) * ratio),
      ane: Math.round((scope.enc.ANE || 0) * ratio),
      com: Math.round((scope.enc.COMMUNITY || 0) * ratio),
      total: subsetSum
    };
  };

  const periodDataA = getPeriodData(compYearA, compSubA);
  const periodDataB = getPeriodData(compYearB, compSubB);

  // Prepare Recharts bar chart payload
  const comparisonChartData = [
    {
      name: isAr ? 'عيادات OPD' : 'OPD Clinics',
      valueA: periodDataA.opd,
      valueB: periodDataB.opd
    },
    {
      name: isAr ? 'طوارئ ANE' : 'Emergency ANE',
      valueA: periodDataA.ane,
      valueB: periodDataB.ane
    },
    {
      name: isAr ? 'زيارات مجتمعية' : 'Community Care',
      valueA: periodDataA.com,
      valueB: periodDataB.com
    }
  ];

  const getSubLabel = (s: string) => {
    if (s === 'ALL') return isAr ? 'كامل السنة' : 'Full Year';
    if (s === 'Q1') return isAr ? 'الربع الأول' : 'Q1';
    if (s === 'Q2') return isAr ? 'الربع الثاني' : 'Q2';
    if (s === 'Q3') return isAr ? 'الربع الثالث' : 'Q3';
    if (s === 'Q4') return isAr ? 'الربع الرابع' : 'Q4';
    const mNum = parseInt(s);
    return mName(mNum, lang);
  };

  // Handle data extraction
  const scope = resolveScope(data, selectedWil, selectedEstab, selectedYear);
  let opd = scope.enc.OPD || 0;
  let ane = scope.enc.ANE || 0;
  let com = scope.enc.COMMUNITY || 0;

  // Apply Month proportional scaling if selected
  if (selectedMonth !== 'ALL') {
    const monthlyArr = resolveMonthly(data, selectedWil, selectedEstab, selectedYear);
    const monthTotal = monthlyArr[parseInt(selectedMonth) - 1] || 0;
    const scopeTotal = scope.total || 1;
    const r = monthTotal / scopeTotal;
    opd = Math.round(opd * r);
    ane = Math.round(ane * r);
    com = Math.round(com * r);
  }

  const inScopeTotalSum = opd + ane + com || 1;

  // Filter values depending on Encounter Type select
  const plotOpd = (selectedEnc === 'ALL' || selectedEnc === 'OPD') ? opd : 0;
  const plotAne = (selectedEnc === 'ALL' || selectedEnc === 'ANE') ? ane : 0;
  const plotCom = (selectedEnc === 'ALL' || selectedEnc === 'COMMUNITY') ? com : 0;

  // Pie Data
  const pieData = [
    { name: isAr ? 'عيادات خارجية OPD' : 'Outpatient (OPD)', value: plotOpd, color: '#34d399' },
    { name: isAr ? 'طوارئ ANE' : 'Emergency (ANE)', value: plotAne, color: '#f87171' },
    { name: isAr ? 'حالات الرعاية المجتمعية' : 'Community checkups', value: plotCom, color: '#818cf8' }
  ].filter(d => d.value > 0);

  // Bar Data
  const barData = [
    { name: isAr ? 'عيادات خارجية OPD' : 'Outpatient', value: plotOpd, fill: '#34d399' },
    { name: isAr ? 'طوارئ ANE' : 'Emergency', value: plotAne, fill: '#f87171' },
    { name: isAr ? 'رعاية مجتمعية' : 'Community', value: plotCom, fill: '#818cf8' }
  ];

  // Geodemographic Stacked encounter chart across active Wilayats
  const activeWils = selectedWil === 'ALL' ? Object.keys(data.by_wil_enc) : [selectedWil];
  const stackedWilData = activeWils.map(w => {
    // If specific facility is selected, we only show that facility's score
    let wOpd = 0, wAne = 0, wCom = 0;
    if (selectedEstab !== 'ALL') {
      wOpd = plotOpd; wAne = plotAne; wCom = plotCom;
    } else {
      if (selectedYear !== 'ALL') {
        const ey = data.by_wil_enc_year[w] || {};
        wOpd = ey.OPD?.[selectedYear] || 0;
        wAne = ey.ANE?.[selectedYear] || 0;
        wCom = ey.COMMUNITY?.[selectedYear] || 0;
      } else {
        const e = data.by_wil_enc[w] || {};
        wOpd = e.OPD || 0;
        wAne = e.ANE || 0;
        wCom = e.COMMUNITY || 0;
      }
    }

    // Apply month scaling
    if (selectedMonth !== 'ALL' && selectedEstab === 'ALL') {
      const wMonthly = resolveMonthly(data, w, 'ALL', selectedYear);
      const wMonthTotal = wMonthly[parseInt(selectedMonth) - 1] || 0;
      const wTotalScope = (selectedYear === 'ALL' ? data.by_wilayat[w] : data.by_wil_year[w]?.[selectedYear]) || 1;
      const r = wMonthTotal / wTotalScope;
      wOpd = Math.round(wOpd * r);
      wAne = Math.round(wAne * r);
      wCom = Math.round(wCom * r);
    }

    return {
      name: wName(w, lang),
      opd: (selectedEnc === 'ALL' || selectedEnc === 'OPD') ? wOpd : 0,
      emergency: (selectedEnc === 'ALL' || selectedEnc === 'ANE') ? wAne : 0,
      community: (selectedEnc === 'ALL' || selectedEnc === 'COMMUNITY') ? wCom : 0
    };
  }).sort((a, b) => {
    const sumA = a.opd + a.emergency + a.community;
    const sumB = b.opd + b.emergency + b.community;
    return sumB - sumA;
  });

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className={`${styles.innerCardBg}`}>
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h2 className={`text-xl font-black flex items-center gap-2 ${styles.textMain}`}>
              <Activity className="w-5 h-5 text-sky-450" />
              <span>{isAr ? 'المترددين حسب نوع الزيارة' : 'Visitors by Visit Type'}</span>
            </h2>
          </div>

          {/* Filtering cascading grid */}
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
              <span className={`text-[10px] font-bold ${styles.textMuted}`}>{isAr ? 'المؤسسة المحددة:' : 'Clinic Unit:'}</span>
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

            {/* Year selector */}
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

            {/* Visit Type Select */}
            <div className={`border rounded-lg px-2.5 py-1 flex items-center gap-2 ${styles.selectBg} ${styles.selectBorder}`}>
              <span className={`text-[10px] font-bold ${styles.textMuted}`}>{isAr ? 'نوع الزيارة:' : 'Encounter:'}</span>
              <select 
                value={selectedEnc} 
                onChange={(e) => setSelectedEnc(e.target.value)}
                className={`bg-transparent text-xs font-bold outline-none cursor-pointer pr-1 ${styles.selectText}`}
              >
                <option value="ALL" className={styles.selectOptionBg}>{isAr ? 'الكل' : 'All Classes'}</option>
                <option value="OPD" className={styles.selectOptionBg}>{isAr ? 'عيادات خارجية OPD' : 'Outpatient (OPD)'}</option>
                <option value="ANE" className={styles.selectOptionBg}>{isAr ? 'طوارئ ANE' : 'Emergency (ANE)'}</option>
                <option value="COMMUNITY" className={styles.selectOptionBg}>{isAr ? 'مجتمعية' : 'Community'}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* CLASSIFIED COUNTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* OPD Card */}
        <div className={`transition-all ${styles.innerCardBg}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className={`text-xs font-bold ${styles.textMuted}`}>{isAr ? 'زيارات العيادات الخارجية OPD' : 'Outpatient (OPD) Visits'}</span>
            <Stethoscope className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-xl font-black font-mono tracking-tight ${styles.textMain}`}>{fmt(opd)}</div>
          <div className="text-[10px] text-slate-400 font-bold mt-2 flex items-center gap-2 select-none">
            <span className="bg-emerald-400/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-black">{pct(opd, inScopeTotalSum)}</span>
            <span>{isAr ? 'من المجموع الإجمالي' : 'of cumulative case flows'}</span>
          </div>
        </div>

        {/* ANE Card */}
        <div className={`transition-all ${styles.innerCardBg}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className={`text-xs font-bold ${styles.textMuted}`}>{isAr ? 'حالات الطوارئ والـ Triage ANE' : 'Emergency Triage (ANE)'}</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className={`text-xl font-black font-mono tracking-tight ${styles.textMain}`}>{fmt(ane)}</div>
          <div className="text-[10px] text-slate-400 font-bold mt-2 flex items-center gap-2 select-none">
            <span className="bg-red-400/10 text-red-500 px-1.5 py-0.5 rounded font-mono font-black">{pct(ane, inScopeTotalSum)}</span>
            <span>{isAr ? 'من الحالات المدرجة' : 'of triage records'}</span>
          </div>
        </div>

        {/* COMMUNITY Card */}
        <div className={`transition-all ${styles.innerCardBg}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className={`text-xs font-bold ${styles.textMuted}`}>{isAr ? 'زيارات المجتمع والرعاية المنزلية' : 'Community outreach visits'}</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className={`text-xl font-black font-mono tracking-tight ${styles.textMain}`}>{fmt(com)}</div>
          <div className="text-[10px] text-slate-400 font-bold mt-2 flex items-center gap-2 select-none">
            <span className="bg-indigo-400/10 text-indigo-400 px-1.5 py-0.5 rounded font-mono font-black">{pct(com, inScopeTotalSum)}</span>
            <span>{isAr ? 'نسبة انتشار مجتمعي' : 'of outreach checkups'}</span>
          </div>
        </div>

        {/* SCOPE TOTAL TALLY */}
        <div className={`transition-all ${styles.innerCardBg}`}>
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className={`text-xs font-bold ${styles.textMuted}`}>{isAr ? 'مجموع التردد المشمول بالفلترة' : 'Target Sum Checkups'}</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className={`text-xl font-black font-mono tracking-tight ${styles.textMain}`}>{fmt(inScopeTotalSum)}</div>
          <p className="text-[10px] text-slate-400 mt-2.5 select-none leading-none">
            {isAr ? 'قيمة مراجعات المحيط الفعال بالكامل' : 'Total matching active filter fields'}
          </p>
        </div>
      </div>

      {/* CORE OPERATIONAL ANALYSIS PLOTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Visit Types comparison bar */}
        <div className={`${styles.innerCardBg}`}>
          <h4 className={`text-xs font-bold mb-4 ${styles.textMain}`}>
            {isAr ? 'مقارنة مسارات التردد العلاجي' : 'Checkup Pathways Volume Comparison'}
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={9} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, borderRadius: '8px' }}
                  itemStyle={{ color: styles.tooltipColor, fontSize: '11px' }}
                  formatter={(value: any) => [fmt(value), '']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Visit Ratio sector donut */}
        <div className={`${styles.innerCardBg}`}>
          <h4 className={`text-xs font-bold mb-4 ${styles.textMain}`}>
            {isAr ? 'النسبة الهيكلية' : 'Checkup Allocation Ratios'}
          </h4>
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {pieData.map((entry, index) => (
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
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold p-10">
                {isAr ? 'لا توجد بيانات متاحة' : 'No active proportional dimensions'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CLUSTERED GEOGRAPHIC STACKED COMPARISON */}
      <div className={`${styles.innerCardBg}`}>
        <h4 className={`text-xs font-bold mb-1 ${styles.textMain}`}>
          {isAr ? 'التوزيع حسب نوع الزيارة للولايات' : 'Distribution by Visit Type for Wilayats'}
        </h4>
        <p className="text-[10px] text-slate-400 mb-4">{isAr ? 'تشريح التدخلات والخدمة الطبية لكل ولاية إقليمية' : 'Compare emergency load versus routine outpatient clinics geographically'}</p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stackedWilData}>
              <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={8} interval={0} />
              <YAxis stroke="#64748b" fontSize={9} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${v/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, borderRadius: '8px' }}
                itemStyle={{ color: styles.tooltipColor, fontSize: '11px' }}
              />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="opd" name={isAr ? 'عيادات خارجية OPD' : 'OPD'} stackId="a" fill="#34d399" />
              <Bar dataKey="emergency" name={isAr ? 'طوارئ ANE' : 'Emergency ANE'} stackId="a" fill="#f87171" />
              <Bar dataKey="community" name={isAr ? 'مجتمعية' : 'Community'} stackId="a" fill="#818cf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TIME PERIOD PERFORMANCE COMPARISON (DYNAMIC) */}
      <div className={`${styles.cardBg} border-indigo-400/10`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h4 className={`text-[#818cf8] text-xs font-extrabold tracking-widest uppercase mb-1 flex items-center gap-1.5`}>
              <span>⚖️</span>
              <span>{isAr ? 'مقارنة فترات التردد والمؤشرات' : 'Period Performance Comparison'}</span>
            </h4>
            <h3 className={`text-base font-black ${styles.textMain}`}>
              {isAr ? 'مقارنة الفترات الزمنية المزدوجة' : 'Dual-Period Attendance Breakdown'}
            </h3>
            <p className={`text-[10px] ${styles.textMuted} mt-0.5`}>
              {isAr 
                ? 'قارن أداء فترتين زمنيتين مختلفتين في رسم بياني واحد ومترابط، متضمناً التحليل الحجمي لجميع العيادات والأنماط المرضية.' 
                : 'Compare checkup load across any two eras synchronously for diagnostic trend assessment.'}
            </p>
          </div>
        </div>

        {/* Dynamic Period Inputs Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-700/30 opacity-95">
          {/* Period A Selectors Container */}
          <div className={`p-4 rounded-xl border ${styles.innerCardBg} border-sky-400/10 bg-gradient-to-tr from-sky-500/5 to-transparent`}>
            <span className="text-xs font-black text-sky-400 block mb-2">{isAr ? 'الفترة الأولى (Period A)' : 'Period A Details'}</span>
            <div className="flex flex-wrap gap-2">
              {/* Year selectivity */}
              <div className={`border rounded-lg px-2.5 py-1 flex items-center gap-1.5 ${styles.selectBg} ${styles.selectBorder}`}>
                <span className={`text-[9px] font-bold ${styles.textMuted}`}>{isAr ? 'السنة:' : 'Year:'}</span>
                <select 
                  value={compYearA} 
                  onChange={(e) => setCompYearA(e.target.value)}
                  className={`bg-transparent text-xs font-bold outline-none cursor-pointer ${styles.selectText}`}
                >
                  {availableYears.map(yr => (
                    <option key={yr} value={yr} className={styles.selectOptionBg}>{yr}</option>
                  ))}
                </select>
              </div>

              {/* Sub ranges selectivity */}
              <div className={`border rounded-lg px-2.5 py-1 flex items-center gap-1.5 ${styles.selectBg} ${styles.selectBorder}`}>
                <span className={`text-[9px] font-bold ${styles.textMuted}`}>{isAr ? 'النطاق:' : 'Range:'}</span>
                <select 
                  value={compSubA} 
                  onChange={(e) => setCompSubA(e.target.value)}
                  className={`bg-transparent text-xs font-bold outline-none cursor-pointer ${styles.selectText}`}
                >
                  <option value="ALL" className={styles.selectOptionBg}>{isAr ? 'كامل السنة' : 'Full Year'}</option>
                  <option value="Q1" className={styles.selectOptionBg}>{isAr ? 'الربع الأول (Q1)' : 'Quarter 1 (Q1)'}</option>
                  <option value="Q2" className={styles.selectOptionBg}>{isAr ? 'الربع الثاني (Q2)' : 'Quarter 2 (Q2)'}</option>
                  <option value="Q3" className={styles.selectOptionBg}>{isAr ? 'الربع الثالث (Q3)' : 'Quarter 3 (Q3)'}</option>
                  <option value="Q4" className={styles.selectOptionBg}>{isAr ? 'الربع الرابع (Q4)' : 'Quarter 4 (Q4)'}</option>
                  {Array.from({ length: 12 }, (_, i) => {
                    const mCode = String(i + 1);
                    return <option key={mCode} value={mCode} className={styles.selectOptionBg}>{months[i + 1]}</option>;
                  })}
                </select>
              </div>
            </div>

            {/* Total Indicator in Card */}
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-[#94a3b8] text-[10px] font-bold`}>{isAr ? 'إجمالي المترددين للمطابقة:' : 'Matching Target Sum:'}</span>
              <span className="text-base font-black font-mono text-sky-400">{fmt(periodDataA.total)}</span>
              <span className="text-[10px] text-slate-400">{isAr ? 'زيارة' : 'visits'}</span>
            </div>
          </div>

          {/* Period B Selectors Container */}
          <div className={`p-4 rounded-xl border ${styles.innerCardBg} border-indigo-400/10 bg-gradient-to-tr from-indigo-500/5 to-transparent`}>
            <span className="text-xs font-black text-[#818cf8] block mb-2">{isAr ? 'الفترة الثانية (Period B)' : 'Period B Details'}</span>
            <div className="flex flex-wrap gap-2">
              {/* Year selectivity */}
              <div className={`border rounded-lg px-2.5 py-1 flex items-center gap-1.5 ${styles.selectBg} ${styles.selectBorder}`}>
                <span className={`text-[9px] font-bold ${styles.textMuted}`}>{isAr ? 'السنة:' : 'Year:'}</span>
                <select 
                  value={compYearB} 
                  onChange={(e) => setCompYearB(e.target.value)}
                  className={`bg-transparent text-xs font-bold outline-none cursor-pointer ${styles.selectText}`}
                >
                  {availableYears.map(yr => (
                    <option key={yr} value={yr} className={styles.selectOptionBg}>{yr}</option>
                  ))}
                </select>
              </div>

              {/* Sub ranges selectivity */}
              <div className={`border rounded-lg px-2.5 py-1 flex items-center gap-1.5 ${styles.selectBg} ${styles.selectBorder}`}>
                <span className={`text-[9px] font-bold ${styles.textMuted}`}>{isAr ? 'النطاق:' : 'Range:'}</span>
                <select 
                  value={compSubB} 
                  onChange={(e) => setCompSubB(e.target.value)}
                  className={`bg-transparent text-xs font-bold outline-none cursor-pointer ${styles.selectText}`}
                >
                  <option value="ALL" className={styles.selectOptionBg}>{isAr ? 'كامل السنة' : 'Full Year'}</option>
                  <option value="Q1" className={styles.selectOptionBg}>{isAr ? 'الربع الأول (Q1)' : 'Quarter 1 (Q1)'}</option>
                  <option value="Q2" className={styles.selectOptionBg}>{isAr ? 'الربع الثاني (Q2)' : 'Quarter 2 (Q2)'}</option>
                  <option value="Q3" className={styles.selectOptionBg}>{isAr ? 'الربع الثالث (Q3)' : 'Quarter 3 (Q3)'}</option>
                  <option value="Q4" className={styles.selectOptionBg}>{isAr ? 'الربع الرابع (Q4)' : 'Quarter 4 (Q4)'}</option>
                  {Array.from({ length: 12 }, (_, i) => {
                    const mCode = String(i + 1);
                    return <option key={mCode} value={mCode} className={styles.selectOptionBg}>{months[i + 1]}</option>;
                  })}
                </select>
              </div>
            </div>

            {/* Total Indicator in Card */}
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-[#94a3b8] text-[10px] font-bold`}>{isAr ? 'إجمالي المترددين للمطابقة:' : 'Matching Target Sum:'}</span>
              <span className="text-base font-black font-mono text-[#818cf8]">{fmt(periodDataB.total)}</span>
              <span className="text-[10px] text-slate-400">{isAr ? 'زيارة' : 'visits'}</span>
            </div>
          </div>
        </div>

        {/* Dual Period visual graph & analytical indicators row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
          {/* Analytical summary deltas list */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-4">
            <h4 className={`text-xs font-bold border-b border-slate-700/20 pb-1 ${styles.textMain}`}>
              {isAr ? 'الفروقات والمؤشرات التفصيلية' : 'Detailed Divergences & Trends'}
            </h4>

            {/* Table or segments comparing A vs B */}
            <div className="space-y-3">
              {[
                { title: isAr ? 'عيادات خارجية OPD' : 'Outpatient (OPD)', valA: periodDataA.opd, valB: periodDataB.opd },
                { title: isAr ? 'طوارئ ANE' : 'Emergency (ANE)', valA: periodDataA.ane, valB: periodDataB.ane },
                { title: isAr ? 'مجتمعية Outreach' : 'Community Care', valA: periodDataA.com, valB: periodDataB.com },
                { title: isAr ? 'المجموع الإجمالي للقراءة' : 'Overall Selected Total', valA: periodDataA.total, valB: periodDataB.total }
              ].map((item, idx) => {
                const diff = item.valB - item.valA;
                const percC = item.valA > 0 ? (diff / item.valA) * 100 : 0;
                return (
                  <div key={idx} className={`p-2.5 rounded-lg border ${styles.innerCardBg} flex items-center justify-between gap-2`}>
                    <div>
                      <span className={`text-[11px] font-bold block ${styles.textMain}`}>{item.title}</span>
                      <div className="flex items-center gap-3 mt-1 font-mono text-[10px] text-slate-400 leading-none">
                        <span>A: <strong className="text-sky-400 font-bold">{fmt(item.valA)}</strong></span>
                        <span>B: <strong className="text-[#818cf8] font-bold">{fmt(item.valB)}</strong></span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`text-xs font-mono font-black block ${diff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {diff >= 0 ? '+' : ''}{fmt(diff)}
                      </span>
                      <span className={`text-[9px] font-mono font-bold block mt-0.5 px-1 py-0.5 rounded leading-none ${diff >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {diff >= 0 ? '▲' : '▼'} {Math.abs(percC).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grouped Comparison Chart */}
          <div className="lg:col-span-7 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonChartData} barSize={25}>
                <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, borderRadius: '8px' }}
                  itemStyle={{ fontSize: '11px', color: styles.tooltipColor }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                <Bar 
                  dataKey="valueA" 
                  name={`${isAr ? 'الفترة أ' : 'Period A'} (${compYearA} ${getSubLabel(compSubA)})`} 
                  fill="#38bdf8" 
                  radius={[4, 4, 0, 0]} 
                />
                <Bar 
                  dataKey="valueB" 
                  name={`${isAr ? 'الفترة ب' : 'Period B'} (${compYearB} ${getSubLabel(compSubB)})`} 
                  fill="#818cf8" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
