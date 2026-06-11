import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  Building2, 
  Sun, 
  Clock, 
  CalendarDays,
  TrendingUp,
  Award,
  Zap
} from 'lucide-react';
import { DashboardData, LangType, ThemeType } from '../types';
import { fmt, pct, wName, mName, getAvailableYears } from '../utils';
import { themeStyles } from '../theme';

interface OverviewPageProps {
  data: DashboardData;
  lang: LangType;
  theme: ThemeType;
}

const COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f59e0b', '#f87171', '#a855f7', '#06d6a0', '#fbbf24', '#60a5fa', '#f472b6'];

export function OverviewPage({ data, lang, theme }: OverviewPageProps) {
  const isAr = lang === 'ar';
  const years = getAvailableYears(data);
  const styles = themeStyles[theme] || themeStyles.immersive;

  // Dynamic active health facilities count
  const activeEstablishmentSet = new Set<string>();
  Object.values(data.by_wil_estab || {}).forEach(estabMap => {
    if (estabMap) {
      Object.keys(estabMap).forEach(est => activeEstablishmentSet.add(est));
    }
  });
  const totalFacilities = activeEstablishmentSet.size || 44;

  // Dynamic active wilayats count
  const totalWilayats = Object.keys(data.by_wilayat || {}).length || 10;

  // Narrative 1: Max Wilayat
  let maxWilayatName = '';
  let maxWilayatVisits = 0;
  Object.entries(data.by_wilayat || {}).forEach(([name, val]) => {
    if (val > maxWilayatVisits) {
      maxWilayatVisits = val;
      maxWilayatName = name;
    }
  });
  const maxWilayatPerc = data.total > 0 ? ((maxWilayatVisits / data.total) * 100).toFixed(1) + '%' : '0%';
  const highestWilTitle = isAr ? `الأعلى تردداً: ${wName(maxWilayatName, lang)}` : `Highest Area: ${wName(maxWilayatName, lang)}`;
  const highestWilDesc = isAr 
    ? `تستحوذ ${wName(maxWilayatName, lang)} على ${maxWilayatPerc} من إجمالي المترددين بـ ${fmt(maxWilayatVisits)} زيارة نظراً للكثافة والسعة التشغيلية بها.`
    : `${wName(maxWilayatName, lang)} accounts for ${maxWilayatPerc} of total clinic flows with ${fmt(maxWilayatVisits)} case records.`;

  // Narrative 2: Max & Min Month
  const monthSums = Array(12).fill(0);
  for (let i = 0; i < 12; i++) {
    const mStr = String(i + 1);
    years.forEach(yr => {
      monthSums[i] += data.by_year_month[yr]?.[mStr] || 0;
    });
  }

  let maxMonthIdx = 0;
  let maxMonthVal = -1;
  let minMonthIdx = 0;
  let minMonthVal = Infinity;

  monthSums.forEach((val, idx) => {
    if (val > maxMonthVal) {
      maxMonthVal = val;
      maxMonthIdx = idx;
    }
    if (val > 0 && val < minMonthVal) {
      minMonthVal = val;
      minMonthIdx = idx;
    }
  });
  if (minMonthVal === Infinity) minMonthVal = 0;

  const maxMonthName = mName(maxMonthIdx + 1, lang);
  const minMonthName = mName(minMonthIdx + 1, lang);

  const monthTitle = isAr ? `ذروة التدرج: ${maxMonthName}` : `Peak Month: ${maxMonthName}`;
  const monthDesc = isAr
    ? `يسجل شهر ${maxMonthName} أعلى تدرج للمرضى بـ ${fmt(maxMonthVal)} زيارة، بينما يعتبر شهر ${minMonthName} هو الأدنى بـ ${fmt(minMonthVal)} زيارة.`
    : `${maxMonthName} yields maximum patient volumes with ${fmt(maxMonthVal)} cases, whereas ${minMonthName} experiences the lowest with ${fmt(minMonthVal)}.`;

  // Narrative 3: Max Establishment
  let maxEstabName = '';
  let maxEstabVisits = 0;

  Object.entries(data.by_estab_year || {}).forEach(([estName, yrMap]) => {
    const totalEstVisits = Object.values(yrMap || {}).reduce((a, b) => a + b, 0);
    if (totalEstVisits > maxEstabVisits) {
      maxEstabVisits = totalEstVisits;
      maxEstabName = estName;
    }
  });
  const maxEstabPerc = data.total > 0 ? ((maxEstabVisits / data.total) * 100).toFixed(1) + '%' : '0%';
  const highestEstabTitle = isAr ? 'المرفق الأكثر طلباً' : 'Apex Healthcare Hub';
  const highestEstabDesc = isAr
    ? `يخدم ${maxEstabName} برتبة الصدارة بمجموع ${fmt(maxEstabVisits)} زيارة، يمثل ${maxEstabPerc} من الضغط الاستيعابي للمحافظة.`
    : `${maxEstabName} stands first, bearing ${fmt(maxEstabVisits)} checkups — representing ${maxEstabPerc} of Governorates load.`;

  // Narrative 4: Shifts Load
  const morningVal = data.by_shift['1ST SHIFT (MORNING)'] || 0;
  const afternoonVal = data.by_shift['2nd SHIFT (AFTERNOON)'] || 0;
  const nightVal = data.by_shift['3RD SHIFT (NIGHT)'] || 0;
  const totalShiftsNum = morningVal + afternoonVal + nightVal || 1;

  const morningPerc = ((morningVal / totalShiftsNum) * 100).toFixed(1) + '%';
  const nightPerc = ((nightVal / totalShiftsNum) * 100).toFixed(1) + '%';
  
  const shiftsTitle = isAr ? 'كثافة نوبات العمل (الشفتات)' : 'Clinical Daily Shifts Load';
  const shiftsDesc = isAr
    ? `تستحوذ الشفتات الصباحية على ${morningPerc} من الطاقة الاستيعابية اليومية بـ ${fmt(morningVal)} زيارة، بينما يلتزم الشفت الليلي بخدمة ${nightPerc}.`
    : `Morning routines handle ${morningPerc} of visits (${fmt(morningVal)} records), while night shifts render ${nightPerc}.`;

  // Stats
  const yearsToRender = years.length > 0 ? years.join(' – ') : '2023 – 2025';

  // Wilayat data for Pie
  const wilayatPieData = Object.entries(data.by_wilayat).map(([name, val]) => ({
    name: wName(name, lang),
    value: val
  })).sort((a, b) => b.value - a.value);

  // Year data for Bar
  const yearlyBarData = years.map(yr => ({
    year: yr,
    value: data.by_year[yr] || 0
  }));

  // Encounters for Donut
  const encData = [
    { name: isAr ? 'عيادات خارجية OPD' : 'OPD Visits', value: data.by_enc.OPD || 0, color: '#34d399' },
    { name: isAr ? 'طوارئ ANE' : 'Emergency ANE', value: data.by_enc.ANE || 0, color: '#f87171' },
    { name: isAr ? 'زيارات المجتمع' : 'Community visits', value: data.by_enc.COMMUNITY || 0, color: '#818cf8' },
  ].filter(d => d.value > 0);

  // Shifts for Donut
  const shiftData = [
    { name: isAr ? 'الشفت الصباحي' : 'Morning Shift', value: data.by_shift['1ST SHIFT (MORNING)'] || 0, color: '#38bdf8' },
    { name: isAr ? 'الشفت المسائي' : 'Afternoon Shift', value: data.by_shift['2nd SHIFT (AFTERNOON)'] || 0, color: '#f59e0b' },
    { name: isAr ? 'الشفت الليلي' : 'Night Shift', value: data.by_shift['3RD SHIFT (NIGHT)'] || 0, color: '#818cf8' },
  ].filter(d => d.value > 0);

  // Holidays
  const holidayData = [
    { name: isAr ? 'أيام العمل' : 'Working Days', value: data.by_holiday['WORKING DAY'] || 0, color: '#34d399' },
    { name: isAr ? 'الإجازات الرسمية' : 'Holidays', value: data.by_holiday['HOLIDAY'] || 0, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  // Lines for Months
  // Months are 1..12
  const monthlyLineData = Array.from({ length: 12 }, (_, i) => {
    const mStr = String(i + 1);
    const row: any = { name: mName(i + 1, lang) };
    years.forEach(yr => {
      row[yr] = data.by_year_month[yr]?.[mStr] || 0;
    });
    return row;
  });

  return (
    <div className="space-y-6">
      {/* SECTION TITLE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-black flex items-center gap-2 ${styles.textMain}`}>
            <span>📊</span>
            <span>{isAr ? 'المؤشرات العامة' : 'General Indicators'}</span>
          </h2>
          <p className={`text-xs mt-1 ${styles.textMuted}`}>
            {isAr 
              ? `ملخص المؤشرات الطبية وأرقام المترددين للمقاطعات الطبية لولاية ظفار (${yearsToRender})` 
              : `Operational trends and medical attendance indices for Dhofar Governorate (${yearsToRender})`}
          </p>
        </div>

        {/* Global Overview pill values */}
        <div className="flex items-center gap-2">
          <div className={`rounded-lg border px-3 py-1.5 text-center transition-all ${styles.selectBg} ${styles.selectBorder}`}>
            <span className={`text-[9px] font-bold block ${styles.textMuted}`}>{isAr ? 'إجمالي المترددين' : 'Total Visits'}</span>
            <span className="text-sm font-black text-sky-500 font-mono">{fmt(data.total)}</span>
          </div>
          <div className={`rounded-lg border px-3 py-1.5 text-center transition-all ${styles.selectBg} ${styles.selectBorder}`}>
            <span className={`text-[9px] font-bold block ${styles.textMuted}`}>{isAr ? 'مؤسسة مفعلة' : 'Facilities'}</span>
            <span className="text-sm font-black text-emerald-500 font-mono">{totalFacilities}</span>
          </div>
          <div className={`rounded-lg border px-3 py-1.5 text-center transition-all ${styles.selectBg} ${styles.selectBorder}`}>
            <span className={`text-[9px] font-bold block ${styles.textMuted}`}>{isAr ? 'الولايات المفعلة' : 'Wilayats'}</span>
            <span className="text-sm font-black text-indigo-500 font-mono">{totalWilayats}</span>
          </div>
        </div>
      </div>

      {/* KPI GRID 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Visits */}
        <div className={`relative overflow-hidden transition-all duration-300 ${styles.innerCardBg}`}>
          <div className={`absolute top-0 left-0 w-full h-[3px] ${styles.accentLine}`} />
          <div className="text-xl mb-1.5">🏥</div>
          <div className={`text-xl font-black font-mono tracking-tight leading-none ${styles.textMain}`}>
            {fmt(data.total)}
          </div>
          <div className={`text-xs font-bold mt-2 ${styles.textMuted}`}>
            {isAr ? `إجمالي الزيارات (${yearsToRender})` : `Total Visits (${yearsToRender})`}
          </div>
        </div>

        {/* OPD Visits */}
        <div className={`relative overflow-hidden transition-all duration-300 ${styles.innerCardBg}`}>
          <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500" />
          <div className="absolute top-4 left-4 bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono">
            {pct(data.by_enc.OPD, data.total)}
          </div>
          <div className="text-xl mb-1.5">🩺</div>
          <div className={`text-xl font-black font-mono tracking-tight leading-none ${styles.textMain}`}>
            {fmt(data.by_enc.OPD)}
          </div>
          <div className={`text-xs font-bold mt-2 ${styles.textMuted}`}>
            {isAr ? 'زيارات العيادات الخارجية (OPD)' : 'Outpatient (OPD) Visits'}
          </div>
        </div>

        {/* Emergency Visits */}
        <div className={`relative overflow-hidden transition-all duration-300 ${styles.innerCardBg}`}>
          <div className="absolute top-0 left-0 w-full h-[3px] bg-red-500" />
          <div className="absolute top-4 left-4 bg-red-400/10 text-red-500 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono">
            {pct(data.by_enc.ANE, data.total)}
          </div>
          <div className="text-xl mb-1.5">🚨</div>
          <div className={`text-xl font-black font-mono tracking-tight leading-none ${styles.textMain}`}>
            {fmt(data.by_enc.ANE)}
          </div>
          <div className={`text-xs font-bold mt-2 ${styles.textMuted}`}>
            {isAr ? 'حالات الطوارئ (ANE)' : 'Emergency Cases (ANE)'}
          </div>
        </div>

        {/* Community Visits */}
        <div className={`relative overflow-hidden transition-all duration-300 ${styles.innerCardBg}`}>
          <div className="absolute top-0 left-0 w-full h-[3px] bg-indigo-500" />
          <div className="absolute top-4 left-4 bg-indigo-500/10 text-[#818cf8] px-1.5 py-0.5 rounded text-[9px] font-bold font-mono">
            {pct(data.by_enc.COMMUNITY, data.total)}
          </div>
          <div className="text-xl mb-1.5">👥</div>
          <div className={`text-xl font-black font-mono tracking-tight leading-none ${styles.textMain}`}>
            {fmt(data.by_enc.COMMUNITY)}
          </div>
          <div className={`text-xs font-bold mt-2 ${styles.textMuted}`}>
            {isAr ? 'زيارات الرعاية المجتمعية' : 'Community Care Visits'}
          </div>
        </div>
      </div>

      {/* KPI GRID 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Morning Shift */}
        <div className={`transition-all ${styles.innerCardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${styles.textMuted}`}>{isAr ? 'الشفت الصباحي' : 'Morning Shift'}</span>
            <Sun className="w-4 h-4 text-sky-400" />
          </div>
          <div className={`text-lg font-black mt-1.5 font-mono ${styles.textMain}`}>
            {fmt(data.by_shift['1ST SHIFT (MORNING)'])}
          </div>
          <div className="text-[10px] text-slate-400 font-bold font-mono mt-0.5">
            {pct(data.by_shift['1ST SHIFT (MORNING)'], data.total)}
          </div>
        </div>

        {/* Afternoon Shift */}
        <div className={`transition-all ${styles.innerCardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${styles.textMuted}`}>{isAr ? 'الشفت المسائي' : 'Afternoon Shift'}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-lg font-black mt-1.5 font-mono ${styles.textMain}`}>
            {fmt(data.by_shift['2nd SHIFT (AFTERNOON)'])}
          </div>
          <div className="text-[10px] text-slate-400 font-bold font-mono mt-0.5">
            {pct(data.by_shift['2nd SHIFT (AFTERNOON)'], data.total)}
          </div>
        </div>

        {/* Night Shift */}
        <div className={`transition-all ${styles.innerCardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${styles.textMuted}`}>{isAr ? 'الشفت الليلي' : 'Night Shift'}</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className={`text-lg font-black mt-1.5 font-mono ${styles.textMain}`}>
            {fmt(data.by_shift['3RD SHIFT (NIGHT)'])}
          </div>
          <div className="text-[10px] text-slate-400 font-bold font-mono mt-0.5">
            {pct(data.by_shift['3RD SHIFT (NIGHT)'], data.total)}
          </div>
        </div>

        {/* Regular Work Days */}
        <div className={`transition-all ${styles.innerCardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${styles.textMuted}`}>{isAr ? 'أيام العمل الرسمية' : 'Official Working Days'}</span>
            <CalendarDays className="w-4 h-4 text-emerald-500" />
          </div>
          <div className={`text-lg font-black mt-1.5 font-mono ${styles.textMain}`}>
            {fmt(data.by_holiday['WORKING DAY'])}
          </div>
          <div className="text-[10px] text-slate-400 font-bold font-mono mt-0.5">
            {pct(data.by_holiday['WORKING DAY'], data.total)}
          </div>
        </div>
      </div>

      {/* SYSTEM NARRATIVE MEDICAL INSIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className={`${styles.innerCardBg} flex gap-3`}>
          <Award className="w-7 h-7 text-yellow-500 bg-yellow-500/10 p-1 rounded-lg flex-shrink-0" />
          <div>
            <h4 className={`text-xs font-bold ${styles.textMain}`}>{highestWilTitle}</h4>
            <p className={`text-[10px] leading-relaxed mt-1 ${styles.textMuted}`}>
              {highestWilDesc}
            </p>
          </div>
        </div>

        <div className={`${styles.innerCardBg} flex gap-3`}>
          <TrendingUp className="w-7 h-7 text-sky-500 bg-sky-500/10 p-1 rounded-lg flex-shrink-0" />
          <div>
            <h4 className={`text-xs font-bold ${styles.textMain}`}>{monthTitle}</h4>
            <p className={`text-[10px] leading-relaxed mt-1 ${styles.textMuted}`}>
              {monthDesc}
            </p>
          </div>
        </div>

        <div className={`${styles.innerCardBg} flex gap-3`}>
          <Building2 className="w-7 h-7 text-indigo-500 bg-indigo-500/10 p-1 rounded-lg flex-shrink-0" />
          <div>
            <h4 className={`text-xs font-bold ${styles.textMain}`}>{highestEstabTitle}</h4>
            <p className={`text-[10px] leading-relaxed mt-1 ${styles.textMuted}`}>
              {highestEstabDesc}
            </p>
          </div>
        </div>

        <div className={`${styles.innerCardBg} flex gap-3`}>
          <Zap className="w-7 h-7 text-amber-500 bg-amber-500/10 p-1 rounded-lg flex-shrink-0" />
          <div>
            <h4 className={`text-xs font-bold ${styles.textMain}`}>{shiftsTitle}</h4>
            <p className={`text-[10px] leading-relaxed mt-1 ${styles.textMuted}`}>
              {shiftsDesc}
            </p>
          </div>
        </div>
      </div>

      {/* CORE CHARTS: ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Wilayat Distribution */}
        <div className={`${styles.innerCardBg}`}>
          <h4 className={`text-xs font-bold mb-1 ${styles.textMain}`}>
            {isAr ? 'توزيع المترددين حسب الولايات' : 'Distribution of Visitors by Wilayat'}
          </h4>
          <p className="text-[10px] text-slate-400 mb-3">{isAr ? 'مستويات الضغط في المقاطعات الصحية' : 'Governorate localized operational density'}</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={wilayatPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {wilayatPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, borderRadius: '8px' }}
                  itemStyle={{ color: styles.tooltipColor, fontSize: '11px' }}
                  formatter={(value: any) => [fmt(value), isAr ? 'تردد' : 'Visits']}
                />
                <Legend 
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', color: styles.textMuted }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Yearly Bar Performance */}
        <div className={`${styles.innerCardBg}`}>
          <h4 className={`text-xs font-bold mb-1 ${styles.textMain}`}>
            {isAr ? 'المترددين حسب السنوات' : 'Visitors by Year'}
          </h4>
          <p className="text-[10px] text-slate-400 mb-3">{isAr ? 'محور إجمالي التردد للمسارات الزمنية' : 'Inter-annual comparison of historical database records'}</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyBarData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
                <XAxis dataKey="year" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, borderRadius: '8px' }}
                  itemStyle={{ color: styles.tooltipColor, fontSize: '11px' }}
                  formatter={(value: any) => [fmt(value), isAr ? 'تردد' : 'Visits']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {yearlyBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CORE CHARTS: ROW 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Visit Types */}
        <div className={`${styles.innerCardBg}`}>
          <h4 className={`text-xs font-bold mb-3 ${styles.textMain}`}>
            {isAr ? 'التوزيع حسب نوع الزيارة' : 'Distribution by Visit Type'}
          </h4>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={encData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={55}
                  innerRadius={35}
                >
                  {encData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, borderRadius: '8px' }}
                  itemStyle={{ color: styles.tooltipColor, fontSize: '10px' }}
                  formatter={(value: any) => [fmt(value), '']}
                />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shifts */}
        <div className={`${styles.innerCardBg}`}>
          <h4 className={`text-xs font-bold mb-3 ${styles.textMain}`}>
            {isAr ? 'التوزيع حسب الشفتات' : 'Distribution by Shifts'}
          </h4>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={shiftData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={55}
                  innerRadius={35}
                >
                  {shiftData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, borderRadius: '8px' }}
                  itemStyle={{ color: styles.tooltipColor, fontSize: '10px' }}
                  formatter={(value: any) => [fmt(value), '']}
                />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Holidays */}
        <div className={`${styles.innerCardBg}`}>
          <h4 className={`text-xs font-bold mb-3 ${styles.textMain}`}>
            {isAr ? 'التوزيع حسب أيام العمل' : 'Distribution by Workdays'}
          </h4>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={holidayData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={55}
                  innerRadius={35}
                >
                  {holidayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, borderRadius: '8px' }}
                  itemStyle={{ color: styles.tooltipColor, fontSize: '10px' }}
                  formatter={(value: any) => [fmt(value), '']}
                />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* LINE CHART: SEASONAL ATTENDANCE */}
      <div className={`${styles.innerCardBg}`}>
        <h4 className={`text-xs font-bold mb-1 ${styles.textMain}`}>
          {isAr ? 'الأداء والتدرج الموسمي الشهري عبر السنوات' : 'Monthly Seasonal Trends Across Years'}
        </h4>
        <p className="text-[10px] text-slate-400 mb-4">
          {isAr ? 'مقارنة تذبذب المراجعة الطبية 2023 - 2024 - 2025' : 'Seasonality fluctuations comparing 2023 vs 2024 vs 2025 patient checkups'}
        </p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyLineData}>
              <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${v/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: styles.tooltipBg, borderColor: styles.tooltipBorder, borderRadius: '8px' }}
                itemStyle={{ color: styles.tooltipColor, fontSize: '11px' }}
                formatter={(value: any) => [fmt(value), '']}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
              {years.map((yr, i) => (
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
    </div>
  );
}
