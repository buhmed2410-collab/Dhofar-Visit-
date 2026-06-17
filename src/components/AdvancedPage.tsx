import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Map, 
  ArrowLeftRight, 
  Clock, 
  Eye, 
  EyeOff, 
  HelpCircle,
  TrendingUp,
  Activity,
  Award,
  Building2,
  Trash2,
  RefreshCcw,
  BookOpen
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { DashboardData, LangType, ThemeType } from '../types';
import { themeStyles } from '../theme';
import { fmt, pct, wName } from '../utils';
import { WILAYAT_AR } from '../data';

interface AdvancedPageProps {
  data: DashboardData;
  lang: LangType;
  theme: ThemeType;
}

// Coordinate paths for Dhofar Governorates stylized SVG geometric map
// Drawn relative to a viewBox of "0 0 600 420"
const WILAYAT_SVG_SHAPES = [
  {
    id: 'MAQSHIN',
    nameAr: 'مقشن',
    nameEn: 'Maqshin',
    // Northeast far inland
    points: "360,20 480,20 540,110 510,150 420,130 350,90",
    labelX: 440,
    labelY: 70
  },
  {
    id: 'AL MAZYUNAH',
    nameAr: 'المزيونة',
    nameEn: 'Al Mazyunah',
    // West far inland bordering Saudi/Yemen
    points: "25,80 180,80 180,220 100,240 25,240 25,140",
    labelX: 95,
    labelY: 155
  },
  {
    id: 'THUMRAYT',
    nameAr: 'ثمريت',
    nameEn: 'Thumrait',
    // Large center empty quarter inland
    points: "180,80 350,90 420,130 380,200 350,220 220,220 180,180",
    labelX: 285,
    labelY: 160
  },
  {
    id: 'SHALIM WA JUZUR AL HALLANIYAT',
    nameAr: 'شليم وجزر الحلانيات',
    nameEn: 'Shalim & J.H.',
    // Far East coastline & inland
    points: "420,130 510,150 560,110 580,240 500,280 380,240 380,200",
    labelX: 470,
    labelY: 205,
    isShalim: true
  },
  {
    id: 'DALKUT',
    nameAr: 'ضلكوت',
    nameEn: 'Dhalkut',
    // Far South-West coast
    points: "25,240 100,240 85,320 25,320",
    labelX: 60,
    labelY: 285
  },
  {
    id: 'RAKHYUT',
    nameAr: 'رخيوت',
    nameEn: 'Rakhyut',
    // Southwest coast
    points: "100,240 180,240 170,320 85,320",
    labelX: 135,
    labelY: 285
  },
  {
    id: 'SALALAH',
    nameAr: 'صلالة',
    nameEn: 'Salalah',
    // South center coast - Capital
    points: "180,220 270,220 270,300 170,320 180,240",
    labelX: 220,
    labelY: 270
  },
  {
    id: 'TAQAH',
    nameAr: 'طاقة',
    nameEn: 'Taqah',
    // South coast east of Salalah
    points: "270,220 330,220 330,290 270,300",
    labelX: 300,
    labelY: 265
  },
  {
    id: 'MIRBAT',
    nameAr: 'مرباط',
    nameEn: 'Mirbat',
    // South coast east of Taqah
    points: "330,220 380,220 380,280 330,290",
    labelX: 355,
    labelY: 260
  },
  {
    id: 'SADAH',
    nameAr: 'سدح',
    nameEn: 'Sadah',
    // South coast east of Mirbat
    points: "380,220 440,220 440,270 380,280",
    labelX: 410,
    labelY: 255
  }
];

// Hallaniyat islands icons (rendered near Shalim)
const HALLANIYAT_ISLANDS = [
  { cx: 520, cy: 305, r: 8, label: 'المرتفع' },
  { cx: 540, cy: 312, r: 5, label: 'الحاسكية' },
  { cx: 560, cy: 308, r: 6, label: 'القبلية' }
];

export function AdvancedPage({ data, lang, theme }: AdvancedPageProps) {
  const isAr = lang === 'ar';
  const styles = themeStyles[theme] || themeStyles.immersive;

  // Map state
  const [hoveredWilayat, setHoveredWilayat] = useState<string | null>(null);
  const [selectedWilayat, setSelectedWilayat] = useState<string | null>("SALALAH");

  // Comparison State
  const [compareType, setCompareType] = useState<'wilayat' | 'estab'>('wilayat');
  const [entityA, setEntityA] = useState<string>('SALALAH');
  const [entityB, setEntityB] = useState<string>('TAQAH');

  // Heatmap State: select filter if needed
  const [heatmapWilayatFilter, setHeatmapWilayatFilter] = useState<string>('ALL');

  // 🕒 POLISHED COMPONENT-SPECIFIC YEAR FILTERS
  const [mapYearFilter, setMapYearFilter] = useState<string>('ALL');
  const [chart1YearFilter, setChart1YearFilter] = useState<string>('ALL');
  const [chart2YearFilter, setChart2YearFilter] = useState<string>('ALL');
  const [chart3YearFilter, setChart3YearFilter] = useState<string>('ALL');
  const [heatmapYearFilter, setHeatmapYearFilter] = useState<string>('ALL');

  // Custom polished reusable year selection component
  const YearFilter = ({
    value,
    onChange,
    label,
  }: {
    value: string;
    onChange: (val: string) => void;
    label?: string;
  }) => {
    const yearsList = Object.keys(data.by_year).sort();
    return (
      <div className="flex items-center gap-1.5 bg-slate-950/20 border border-white/5 rounded-lg px-2 py-1 select-none">
        {label && <span className="text-[9px] font-black opacity-85 uppercase leading-none" style={{ color: chartColors.textMain }}>{label}</span>}
        <div className="flex gap-1 items-center">
          <button
            onClick={() => onChange('ALL')}
            className={`px-1.5 py-0.5 text-[9px] font-black rounded transition-all cursor-pointer ${
              value === 'ALL'
                ? theme === 'luxury'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : theme === 'immersive'
                  ? 'bg-sky-500 text-slate-950 shadow-xs'
                  : 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-white/5 bg-transparent border-none outline-none'
            }`}
          >
            {isAr ? 'الكل' : 'ALL'}
          </button>
          {yearsList.map(yr => (
            <button
              key={yr}
              onClick={() => onChange(yr)}
              className={`px-1.5 py-0.5 text-[9px] font-black rounded transition-all cursor-pointer ${
                value === yr
                  ? theme === 'luxury'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : theme === 'immersive'
                    ? 'bg-sky-500 text-slate-950 shadow-xs'
                    : 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 bg-transparent border-none outline-none'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Sync compare fields when type shifts
  useEffect(() => {
    if (compareType === 'wilayat') {
      setEntityA('SALALAH');
      setEntityB('TAQAH');
    } else {
      // Find dynamic available establishments
      const ests = getAllFacilities();
      if (ests.length >= 2) {
        setEntityA(ests[0]);
        setEntityB(ests[1]);
      } else if (ests.length > 0) {
        setEntityA(ests[0]);
        setEntityB(ests[0]);
      }
    }
  }, [compareType]);

  // Helper to extract all facilities dynamically compiled from dataset
  function getAllFacilities(): string[] {
    const list: string[] = [];
    Object.values(data.by_wil_estab || {}).forEach(ests => {
      Object.keys(ests).forEach(e => {
        if (!list.includes(e)) list.push(e);
      });
    });
    return list.sort();
  }

  // Calculations for map shading with dynamic mapYearFilter
  const wilayatValues = {} as Record<string, number>;
  Object.keys(data.by_wilayat || {}).forEach(wil => {
    if (mapYearFilter === 'ALL') {
      wilayatValues[wil] = data.by_wilayat[wil] || 0;
    } else {
      wilayatValues[wil] = data.by_wil_year[wil]?.[mapYearFilter] || 0;
    }
  });
  const maxWilayatValue = Math.max(...Object.values(wilayatValues).map(v => Number(v) || 0), 1);

  const getEstabValFiltered = (est: string, yr: string) => {
    if (yr === 'ALL') {
      return Object.values(data.by_estab_year[est] || {}).reduce((sum, v) => sum + (v || 0), 0);
    } else {
      return data.by_estab_year[est]?.[yr] || 0;
    }
  };

  // Dynamic high-contrast palettes based on active theme
  const chartColors = {
    immersive: {
      entityA: '#38bdf8', // Glowing celestial blue
      entityB: '#f43f5e', // Vibrant crimson rose
      gridStroke: 'rgba(255, 255, 255, 0.08)',
      textMain: '#ffffff',
      textMuted: '#94a3b8',
      tooltipBg: '#0f172a',
      tooltipBorder: '#38bdf8',
      tooltipColor: '#ffffff'
    },
    luxury: {
      entityA: '#fbbf24', // Rich Arabic Gold
      entityB: '#10b981', // Vivid Jade Emerald
      gridStroke: 'rgba(251, 191, 36, 0.08)',
      textMain: '#ffffff',
      textMuted: '#cbd5e1',
      tooltipBg: '#112224',
      tooltipBorder: '#fbbf24',
      tooltipColor: '#ffffff'
    },
    bento: {
      entityA: '#1d4ed8', // Dark Royal Blue
      entityB: '#ea580c', // Dark Vibrant Orange
      gridStroke: 'rgba(15, 23, 42, 0.08)',
      textMain: '#020617', // High contrast charcoal black
      textMuted: '#475569',
      tooltipBg: '#ffffff',
      tooltipBorder: '#1d4ed8',
      tooltipColor: '#020617'
    }
  }[theme] || {
    entityA: '#38bdf8',
    entityB: '#f43f5e',
    gridStroke: 'rgba(255, 255, 255, 0.08)',
    textMain: '#ffffff',
    textMuted: '#475569',
    tooltipBg: '#0f172a',
    tooltipBorder: '#38bdf8',
    tooltipColor: '#ffffff'
  };

  // Colors based on theme for map rendering
  const getMapShading = (wilayatId: string) => {
    const value = wilayatValues[wilayatId] || 0;
    const ratio = value / maxWilayatValue; // 0 to 1
    
    // Choose theme colors
    if (theme === 'luxury') {
      // Gold scaling: from faint warm amber to deep gold
      return `rgba(217, 119, 6, ${0.15 + ratio * 0.8})`;
    } else if (theme === 'immersive') {
      // Teal/Sky blue scaling
      return `rgba(14, 165, 233, ${0.15 + ratio * 0.8})`;
    } else {
      // Classical Blue scaling
      return `rgba(37, 99, 235, ${0.12 + ratio * 0.8})`;
    }
  };

  const getBorderColor = (wilayatId: string) => {
    const isHovered = hoveredWilayat === wilayatId;
    const isSelected = selectedWilayat === wilayatId;

    if (isSelected) {
      return theme === 'luxury' ? '#fbbf24' : '#38bdf8';
    }
    if (isHovered) {
      return theme === 'luxury' ? '#f59e0b' : '#60a5fa';
    }

    return theme === 'luxury' 
      ? 'rgba(36, 79, 85, 0.6)' 
      : theme === 'immersive' 
      ? 'rgba(30, 41, 59, 1)' 
      : 'rgba(203, 213, 225, 1)';
  };

  // Fetch metrics for selected map wilayat
  const overallTotal = mapYearFilter === 'ALL' 
    ? data.total 
    : Object.values(wilayatValues).reduce((acc: number, v: any) => acc + (v || 0), 0);

  const activeWilInfo = selectedWilayat || 'SALALAH';
  const activeWilVal = wilayatValues[activeWilInfo] || 0;
  const activeWilPct = pct(activeWilVal, overallTotal);

  // Exact metrics for selected Wilayat from dataset based on mapYearFilter
  const activeWilEnc = {} as Record<string, number>;
  const encKeys = ['OPD', 'ANE', 'COMMUNITY'] as const;
  encKeys.forEach(k => {
    if (mapYearFilter === 'ALL') {
      activeWilEnc[k] = data.by_wil_enc[activeWilInfo]?.[k] || 0;
    } else {
      activeWilEnc[k] = data.by_wil_enc_year[activeWilInfo]?.[k]?.[mapYearFilter] || 0;
    }
  });

  const activeWilShift = {} as Record<string, number>;
  const shiftKeys = ['1ST SHIFT (MORNING)', '2nd SHIFT (AFTERNOON)', '3RD SHIFT (NIGHT)'] as const;
  shiftKeys.forEach(sh => {
    if (mapYearFilter === 'ALL') {
      activeWilShift[sh] = data.by_wil_shift[activeWilInfo]?.[sh] || 0;
    } else {
      activeWilShift[sh] = data.by_wil_shift_year[activeWilInfo]?.[sh]?.[mapYearFilter] || 0;
    }
  });

  const activeWilHoliday = {} as Record<string, number>;
  const holidayKeys = ['WORKING DAY', 'HOLIDAY'] as const;
  holidayKeys.forEach(h => {
    if (mapYearFilter === 'ALL') {
      activeWilHoliday[h] = data.by_wil_holiday[activeWilInfo]?.[h] || 0;
    } else {
      activeWilHoliday[h] = data.by_wil_holiday_year[activeWilInfo]?.[h]?.[mapYearFilter] || 0;
    }
  });

  // Build comparison charts series
  const buildComparisonYearlySeries = () => {
    const years = ['2023', '2024', '2025']; // standard base record spans
    return years.map(yr => {
      let valA = 0;
      let valB = 0;
      if (compareType === 'wilayat') {
        valA = data.by_wil_year[entityA]?.[yr] || 0;
        valB = data.by_wil_year[entityB]?.[yr] || 0;
      } else {
        valA = data.by_estab_year[entityA]?.[yr] || 0;
        valB = data.by_estab_year[entityB]?.[yr] || 0;
      }
      return {
        name: yr,
        [isAr ? `المؤسسة/الولاية (أ)` : `Entity A`]: valA,
        [isAr ? `المؤسسة/الولاية (ب)` : `Entity B`]: valB,
      };
    });
  };

  const buildComparisonMonthlySeries = (selectedYear: string) => {
    return MONTHS.map(month => {
      let valA = 0;
      let valB = 0;
      const mId = month.id;
      if (compareType === 'wilayat') {
        valA = data.by_wil_year_month[entityA]?.[selectedYear]?.[mId] || 0;
        valB = data.by_wil_year_month[entityB]?.[selectedYear]?.[mId] || 0;
      } else {
        valA = data.by_estab_year_month[entityA]?.[selectedYear]?.[mId] || 0;
        valB = data.by_estab_year_month[entityB]?.[selectedYear]?.[mId] || 0;
      }
      return {
        name: isAr ? month.ar : month.en,
        [isAr ? `المؤسسة/الولاية (أ)` : `Entity A`]: valA,
        [isAr ? `المؤسسة/الولاية (ب)` : `Entity B`]: valB,
      };
    });
  };

  const buildComparisonShiftSeries = () => {
    const shifts = [
      { id: '1ST SHIFT (MORNING)', label: isAr ? 'الشفت الصباحي' : 'Morning Shift' },
      { id: '2nd SHIFT (AFTERNOON)', label: isAr ? 'الشفت المسائي' : 'Afternoon Shift' },
      { id: '3RD SHIFT (NIGHT)', label: isAr ? 'الشفت الليلي' : 'Night Shift' }
    ];

    return shifts.map(sh => {
      let valA = 0;
      let valB = 0;
      if (compareType === 'wilayat') {
        if (chart2YearFilter === 'ALL') {
          valA = data.by_wil_shift[entityA]?.[sh.id] || 0;
          valB = data.by_wil_shift[entityB]?.[sh.id] || 0;
        } else {
          valA = data.by_wil_shift_year[entityA]?.[sh.id]?.[chart2YearFilter] || 0;
          valB = data.by_wil_shift_year[entityB]?.[sh.id]?.[chart2YearFilter] || 0;
        }
      } else {
        if (chart2YearFilter === 'ALL') {
          valA = data.by_estab_shift[entityA]?.[sh.id] || 0;
          valB = data.by_estab_shift[entityB]?.[sh.id] || 0;
        } else {
          valA = data.by_estab_shift_year[entityA]?.[sh.id]?.[chart2YearFilter] || 0;
          valB = data.by_estab_shift_year[entityB]?.[sh.id]?.[chart2YearFilter] || 0;
        }
      }
      return {
        name: sh.label,
        [isAr ? `المؤسسة/الولاية (أ)` : `Entity A`]: valA,
        [isAr ? `المؤسسة/الولاية (ب)` : `Entity B`]: valB,
      };
    });
  };

  const buildComparisonVisitTypeSeries = () => {
    const types = [
      { id: 'OPD', label: isAr ? 'العيادات الخارجية' : 'Outpatients (OPD)' },
      { id: 'ANE', label: isAr ? 'الحوادث والطوارئ' : 'Emergency (ANE)' },
      { id: 'COMMUNITY', label: isAr ? 'الخدمات المجتمعية' : 'Community Services' }
    ];

    return types.map(t => {
      let valA = 0;
      let valB = 0;
      if (compareType === 'wilayat') {
        if (chart3YearFilter === 'ALL') {
          valA = data.by_wil_enc[entityA]?.[t.id] || 0;
          valB = data.by_wil_enc[entityB]?.[t.id] || 0;
        } else {
          valA = data.by_wil_enc_year[entityA]?.[t.id]?.[chart3YearFilter] || 0;
          valB = data.by_wil_enc_year[entityB]?.[t.id]?.[chart3YearFilter] || 0;
        }
      } else {
        if (chart3YearFilter === 'ALL') {
          valA = data.by_estab_enc[entityA]?.[t.id] || 0;
          valB = data.by_estab_enc[entityB]?.[t.id] || 0;
        } else {
          valA = data.by_estab_enc_year[entityA]?.[t.id]?.[chart3YearFilter] || 0;
          valB = data.by_estab_enc_year[entityB]?.[t.id]?.[chart3YearFilter] || 0;
        }
      }
      return {
        name: t.label,
        [isAr ? `المؤسسة/الولاية (أ)` : `Entity A`]: valA,
        [isAr ? `المؤسسة/الولاية (ب)` : `Entity B`]: valB,
      };
    });
  };

  // Heatmap generation: Monthly operational density tracking
  const MONTHS = [
    { id: '1', ar: 'يناير', en: 'January' },
    { id: '2', ar: 'فبراير', en: 'February' },
    { id: '3', ar: 'مارس', en: 'March' },
    { id: '4', ar: 'أبريل', en: 'April' },
    { id: '5', ar: 'مايو', en: 'May' },
    { id: '6', ar: 'يونيو', en: 'June' },
    { id: '7', ar: 'يوليو', en: 'July' },
    { id: '8', ar: 'أغسطس', en: 'August' },
    { id: '9', ar: 'سبتمبر', en: 'September' },
    { id: '10', ar: 'أكتوبر', en: 'October' },
    { id: '11', ar: 'نوفمبر', en: 'November' },
    { id: '12', ar: 'ديسمبر', en: 'December' }
  ];

  const filteredMonths = MONTHS;

  const TIME_SLOTS = [
    { labelAr: 'الشفت الصباحي (07:30 - 14:30)', labelEn: 'Morning Shift (07:30 - 14:30)', shiftId: '1ST SHIFT (MORNING)', hourlyRatio: 1.0 },
    { labelAr: 'الشفت المسائي (14:30 - 21:30)', labelEn: 'Afternoon Shift (14:30 - 21:30)', shiftId: '2nd SHIFT (AFTERNOON)', hourlyRatio: 1.0 },
    { labelAr: 'الشفت الليلي (21:30 - 07:30)', labelEn: 'Night Shift (21:30 - 07:30)', shiftId: '3RD SHIFT (NIGHT)', hourlyRatio: 1.0 }
  ];

  // Calculate grid point loading weight by Month
  const calculateHeatmapVal = (monthId: string, timeSlotIndex: number) => {
    const slot = TIME_SLOTS[timeSlotIndex];
    const shiftKey = slot.shiftId as '1ST SHIFT (MORNING)' | '2nd SHIFT (AFTERNOON)' | '3RD SHIFT (NIGHT)';

    const hasYearMonthShift = data.by_year_month_shift && Object.keys(data.by_year_month_shift).length > 0;

    // 1. ALL Wilayat (Governorate-wide)
    if (heatmapWilayatFilter === 'ALL') {
      if (hasYearMonthShift) {
        if (heatmapYearFilter === 'ALL') {
          let sum = 0;
          const years = Object.keys(data.by_year);
          years.forEach(yr => {
            sum += data.by_year_month_shift?.[yr]?.[monthId]?.[shiftKey] || 0;
          });
          return sum;
        } else {
          return data.by_year_month_shift?.[heatmapYearFilter]?.[monthId]?.[shiftKey] || 0;
        }
      }
    }

    // 2. Specific Wilayat
    const wilMap = data.by_wil_year_month_shift?.[heatmapWilayatFilter];
    const hasWilShiftData = wilMap && Object.keys(wilMap).length > 0;

    if (heatmapWilayatFilter !== 'ALL' && hasWilShiftData) {
      if (heatmapYearFilter === 'ALL') {
        let sum = 0;
        const years = Object.keys(data.by_year);
        years.forEach(yr => {
          sum += wilMap?.[yr]?.[monthId]?.[shiftKey] || 0;
        });
        return sum;
      } else {
        return wilMap?.[heatmapYearFilter]?.[monthId]?.[shiftKey] || 0;
      }
    }

    // Proportional estimation fallback (for static fallback, missing keys, or custom data without full split)
    let baseShiftTotal = 0;
    let baseMonthTotal = 0;
    let totalRef = 0;

    if (heatmapWilayatFilter === 'ALL') {
      if (heatmapYearFilter === 'ALL') {
        baseShiftTotal = data.by_shift[shiftKey] || 0;
        baseMonthTotal = data.by_month[monthId] || 0;
        totalRef = data.total;
      } else {
        baseShiftTotal = Object.keys(data.by_wilayat).reduce((acc, w) => {
          return acc + (data.by_wil_shift_year[w]?.[shiftKey]?.[heatmapYearFilter] || 0);
        }, 0);
        baseMonthTotal = data.by_year_month[heatmapYearFilter]?.[monthId] || 0;
        totalRef = data.by_year[heatmapYearFilter] || 0;
      }
    } else {
      if (heatmapYearFilter === 'ALL') {
        baseShiftTotal = data.by_wil_shift[heatmapWilayatFilter]?.[shiftKey] || 0;
        baseMonthTotal = data.by_wil_month[heatmapWilayatFilter]?.[monthId] || 0;
        totalRef = data.by_wilayat[heatmapWilayatFilter] || 0;
      } else {
        baseShiftTotal = data.by_wil_shift_year[heatmapWilayatFilter]?.[shiftKey]?.[heatmapYearFilter] || 0;
        baseMonthTotal = data.by_wil_year_month[heatmapWilayatFilter]?.[heatmapYearFilter]?.[monthId] || 0;
        totalRef = data.by_wil_year[heatmapWilayatFilter]?.[heatmapYearFilter] || 0;
      }
    }

    if (totalRef <= 0) return 0;
    const shiftRatio = baseShiftTotal / totalRef;
    return Math.round(baseMonthTotal * shiftRatio);
  };

  // Compile full matrix to find max cell value for color scale calibration
  const matrix: number[][] = TIME_SLOTS.map((_, rIdx) => 
    MONTHS.map(m => calculateHeatmapVal(m.id, rIdx))
  );

  const flatMatrix = matrix.flat();
  const maxMatrixVal = Math.max(...flatMatrix, 1);

  // Heatmap block background rendering with premium high-contrast theme variations
  const getHeatmapColor = (visits: number) => {
    const ratio = Math.min(visits / maxMatrixVal, 1);
    
    if (ratio === 0) {
      return theme === 'bento' 
        ? 'bg-slate-50 border-slate-200 text-slate-400' 
        : 'bg-[#0b1329] border-[#1e293b]/50 text-slate-600';
    }

    if (theme === 'luxury') {
      // Golden/Amber scale with high contrast text
      if (ratio < 0.2) return 'bg-[#121c24] border-emerald-500/10 text-emerald-400 font-bold';
      if (ratio < 0.4) return 'bg-[#152e32] border-[#244f55] text-amber-400 font-bold';
      if (ratio < 0.6) return 'bg-amber-950/40 border-amber-500/30 text-amber-300 font-extrabold';
      if (ratio < 0.8) return 'bg-amber-900/60 border-amber-500/50 text-amber-200 font-black';
      return 'bg-amber-500 border-amber-400 text-slate-950 font-black';
    } else if (theme === 'immersive') {
      // Deep Teal/Cyan scale with high contrast text
      if (ratio < 0.2) return 'bg-sky-950/30 border-sky-500/10 text-sky-400 font-bold';
      if (ratio < 0.4) return 'bg-sky-950/60 border-sky-500/20 text-sky-350 font-bold';
      if (ratio < 0.6) return 'bg-sky-900/50 border-sky-500/35 text-sky-200 font-extrabold';
      if (ratio < 0.8) return 'bg-sky-700/75 border-sky-450/40 text-sky-100 font-black';
      return 'bg-sky-500 border-sky-400 text-slate-950 font-black';
    } else {
      // Classical deep high-contrast blue scale for bento theme (light)
      if (ratio < 0.2) return 'bg-blue-50 border-blue-200 text-blue-800 font-bold';
      if (ratio < 0.4) return 'bg-blue-100 border-blue-250 text-blue-900 font-bold';
      if (ratio < 0.6) return 'bg-blue-200 border-blue-300 text-blue-950 font-extrabold';
      if (ratio < 0.8) return 'bg-blue-400 border-blue-450 text-white font-black';
      return 'bg-blue-600 border-blue-600 text-white font-black';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION HEADER BLOCK */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className={`text-xl font-extrabold ${styles.textMain}`}>
              {isAr ? 'الرؤى التشغيلية والتحليل الجغرافي' : 'Operational Insights & Geospatial Analysis'}
            </h2>
          </div>
          <p className={`text-xs mt-1 ${styles.textMuted}`}>
            {isAr 
              ? 'تتضمن خارطة الكثافة الجغرافية لمحافظة ظفار، مقارنات ثنائية الأبعاد، ومصفوفة كثافة الزيارات الموزعة شهرياً.' 
              : 'Interactive Dhofar Gov. density map, dual comparative diagnostics, and monthly shift operations matrix.'}
          </p>
        </div>
      </div>

      {/* RENDER ACTIVE MODULES PERMANENTLY (No deletion controls, fully persistent) */}
      
      {/* 2️⃣ DYNAMIC INTERACTIVE GEOSPATIAL VECTOR MAP BLOCK */}
      <div className={`p-5 rounded-xl border relative transition-all duration-300 ${styles.cardBg}`}>
        
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-505/20">
              <Map className="w-4 h-4" />
            </span>
            <h3 className={`text-sm font-extrabold ${styles.textMain}`}>
              {isAr ? 'الخارطة التفاعلية الجغرافية وتوزيع الولايات بمحافظة ظفار' : 'Interactive Geographic Map & Wilayat Distribution of Dhofar Gov.'}
            </h3>
          </div>
          <YearFilter value={mapYearFilter} onChange={setMapYearFilter} label={isAr ? 'فلتر الخارطة:' : 'Map Year:'} />
        </div>

        <div className="flex flex-col gap-6">
          
          {/* Map Section: Stretched to full width and made significantly larger and clearer */}
          <div className={`w-full flex flex-col items-center rounded-xl p-5 border relative ${styles.innerCardBg}`}>
            <div className="text-xs text-center select-none font-extrabold tracking-tight opacity-90 mb-4 flex items-center gap-1.5" style={{ color: chartColors.textMain }}>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
              {isAr 
                ? 'خارطة التوزيع الجغرافي للولايات (انقر على الولاية المحددة لعرض تفاصيلها التشغيلية بالأسفل)' 
                : 'Geospatial Wilayat Distribution (Click on any Wilayat to render individual statistics below)'}
            </div>

            <div className="relative w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl aspect-[600/420]">
              <svg 
                viewBox="0 0 600 420" 
                className="w-full h-full select-none"
              >
                <defs>
                  <filter id="subtle-shadow" x="-5%" y="-5%" width="112%" height="112%">
                    <feDropShadow dx="1" dy="3" stdDeviation="3" floodOpacity="0.4" />
                  </filter>
                </defs>

                {/* GRID ACCENTS */}
                <g stroke="rgba(255,255,255,0.01)" strokeWidth="1" strokeDasharray="3,3">
                  <line x1="100" y1="0" x2="100" y2="420" />
                  <line x1="200" y1="0" x2="200" y2="420" />
                  <line x1="300" y1="0" x2="300" y2="420" />
                  <line x1="400" y1="0" x2="400" y2="420" />
                  <line x1="500" y1="0" x2="500" y2="420" />
                  <line x1="0" y1="100" x2="600" y2="100" />
                  <line x1="0" y1="200" x2="600" y2="200" />
                  <line x1="0" y1="300" x2="600" y2="300" />
                </g>

                {/* DRAW GEOGRAPHIC POLYGONS */}
                {WILAYAT_SVG_SHAPES.map((shp) => {
                  const isHovered = hoveredWilayat === shp.id;
                  const isSelected = selectedWilayat === shp.id;
                  const shading = getMapShading(shp.id);
                  const strokeColor = getBorderColor(shp.id);
                  const strokeWidth = isSelected ? "3.5" : isHovered ? "2.5" : "1.5";

                  return (
                    <g key={shp.id}>
                      <polygon
                        points={shp.points}
                        fill={shading}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        filter="url(#subtle-shadow)"
                        className="cursor-pointer transition-all duration-300 hover:brightness-110"
                        onClick={() => setSelectedWilayat(shp.id)}
                        onMouseEnter={() => setHoveredWilayat(shp.id)}
                        onMouseLeave={() => setHoveredWilayat(null)}
                      />
                      {/* Dynamic Floating Labels inside Shapes with perfect contrast shadow */}
                      <text
                        x={shp.labelX}
                        y={shp.labelY}
                        textAnchor="middle"
                        fill={theme === 'bento' ? '#0f171e' : '#ffffff'}
                        className="text-[10px] pointer-events-none font-black tracking-wide"
                        style={{
                          textShadow: theme === 'bento'
                            ? '0px 1px 1px rgba(255,255,255,0.9)'
                            : '0px 1px 2px rgba(0,0,0,0.9)'
                        }}
                      >
                        {isAr ? shp.nameAr : shp.nameEn}
                      </text>
                    </g>
                  );
                })}

                {/* OCEAN LABELS AND COMPASS SCALES */}
                <text x="80" y="380" className="text-[10px] font-black fill-sky-500 tracking-wider">
                  {isAr ? 'بحر العرب 🌊' : 'Arabian Sea 🌊'}
                </text>
                <text x="485" y="385" className="text-[10px] font-black fill-emerald-500">
                  {isAr ? 'محافظة ظفار' : 'Dhofar Gov.'}
                </text>

                {/* SHALIM ISLANDS INDICATORS */}
                {HALLANIYAT_ISLANDS.map((isld, idx) => (
                  <g key={idx} className="cursor-help" title={`${isld.label} - جزر الحلانيات`}>
                    <circle
                      cx={isld.cx}
                      cy={isld.cy}
                      r={isld.r}
                      fill={getMapShading('SHALIM WA JUZUR AL HALLANIYAT')}
                      stroke={getBorderColor('SHALIM WA JUZUR AL HALLANIYAT')}
                      strokeWidth="1.2"
                    />
                    <line 
                      x1={isld.cx} 
                      y1={isld.cy} 
                      x2={isld.cx + (isAr ? -10 : 10)} 
                      y2={isld.cy + 15} 
                      stroke="rgba(255,255,255,0.15)" 
                      strokeWidth="0.8" 
                    />
                  </g>
                ))}
                
                <text x="540" y="340" textAnchor="middle" className="text-[9px] font-black fill-emerald-500">
                  {isAr ? 'جزر الحلانيات' : 'Al-Hallaniyat'}
                </text>
              </svg>
            </div>

            {/* Dynamic Legend Scale */}
            <div className="mt-4 flex items-center justify-between gap-4 w-full px-4 text-[10px] font-bold opacity-95 border-t border-white/5 pt-3" style={{ color: chartColors.textMain }}>
              <span>{isAr ? 'كثافة زيارات منخفضة ◽' : 'Low Density ◽'}</span>
              <div className="flex-1 h-2 rounded-full mx-2 bg-gradient-to-r from-sky-500/15 to-indigo-600 max-w-sm" />
              <span>{isAr ? '◾ كثافة زيارات مرتفعة' : '◾ High Density'}</span>
            </div>
          </div>

          {/* Under-Map Statistics Grid (Selected Demographic region & Facilities) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Active selection micro details card (8/12 width) */}
            <div className={`lg:col-span-8 p-5 rounded-xl border relative overflow-hidden group ${styles.innerCardBg}`}>
              <div className={`absolute top-0 right-0 w-2 h-full ${styles.accentLine}`} />
              
              <h4 className="text-xs font-black tracking-widest text-indigo-400 mb-1 uppercase">
                {isAr ? 'النطاق الجغرافي المحدد' : 'Selected Demographic profile'}
              </h4>
              <div className="flex items-baseline justify-between flex-wrap gap-1.5">
                <h3 className={`text-lg font-black ${styles.textMain}`}>
                  {isAr ? WILAYAT_AR[activeWilInfo] || activeWilInfo : activeWilInfo}
                </h3>
                <span className="text-xs font-mono font-black text-sky-500">
                  {activeWilPct} {isAr ? 'من إجمالي المحافظة' : 'of total governorate'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-950/20 p-3 rounded-lg border border-white/5">
                  <span className="text-[10px] block opacity-90 font-bold mb-0.5" style={{ color: chartColors.textMain }}>{isAr ? 'إجمالي المترددين بالولاية' : 'Total Wilayat Visits'}</span>
                  <span className="text-base font-black text-sky-500 font-mono">{fmt(activeWilVal)}</span>
                </div>
                <div className="bg-slate-950/20 p-3 rounded-lg border border-white/5">
                  <span className="text-[10px] block opacity-90 font-bold mb-0.5" style={{ color: chartColors.textMain }}>{isAr ? 'المؤسسات الصحية' : 'Clinics & Facilities'}</span>
                  <span className="text-base font-black text-indigo-400 font-mono">
                    {Object.keys(data.by_wil_estab[activeWilInfo] || {}).length} {isAr ? 'مؤسسات' : 'est.'}
                  </span>
                </div>
              </div>

              {/* Vertical segment loads */}
              <div className="mt-5 space-y-3">
               <span className="text-[10px] font-black block" style={{ color: chartColors.textMain }}>
                  {isAr ? 'تفصيل أعباء الشفتات بالولاية' : 'Operating Shifts allocation'}
                </span>
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1 font-extrabold" style={{ color: chartColors.textMain }}>
                    <span>{isAr ? 'الشفت الصباحي' : 'Morning Shift'}</span>
                    <span className="font-mono font-bold text-sky-400">{pct(activeWilShift['1ST SHIFT (MORNING)'], activeWilVal)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-sky-500 transition-all duration-500" 
                      style={{ width: pct(activeWilShift['1ST SHIFT (MORNING)'], activeWilVal) }} 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1 font-extrabold" style={{ color: chartColors.textMain }}>
                    <span>{isAr ? 'الشفت المسائي' : 'Afternoon Shift'}</span>
                    <span className="font-mono font-bold text-indigo-400">{pct(activeWilShift['2nd SHIFT (AFTERNOON)'], activeWilVal)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-500" 
                      style={{ width: pct(activeWilShift['2nd SHIFT (AFTERNOON)'], activeWilVal) }} 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1 font-extrabold" style={{ color: chartColors.textMain }}>
                    <span>{isAr ? 'الشفت الليلي والطارئ' : 'Night Shift'}</span>
                    <span className="font-mono font-bold text-[#fbbf24]">{pct(activeWilShift['3RD SHIFT (NIGHT)'], activeWilVal)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#fbbf24] transition-all duration-500" 
                      style={{ width: pct(activeWilShift['3RD SHIFT (NIGHT)'], activeWilVal) }} 
                    />
                  </div>
                </div>
              </div>

              {/* Bottom visit types distribution */}
              <div className="mt-5 border-t border-white/5 pt-4">
                <span className="text-[10px] font-black block mb-2" style={{ color: chartColors.textMain }}>
                  {isAr ? 'تصنيف المراجعات الصحية بالولاية' : 'Patient Encounter split'}
                </span>
                <div className="grid grid-cols-3 gap-2.5 text-center text-[10px] font-extrabold bg-slate-950/10 p-2.5 rounded-lg border border-white/5">
                  <div className="p-2 bg-slate-900/50 rounded-md border border-white/5">
                    <span className="block text-[8px] opacity-90 truncate" style={{ color: chartColors.textMain }}>{isAr ? 'عيادة خارجية' : 'Outpatient'}</span>
                    <span className="block font-bold text-emerald-400 mt-1 text-xs">{pct(activeWilEnc.OPD, activeWilVal)}</span>
                  </div>
                  <div className="p-2 bg-slate-900/50 rounded-md border border-white/5">
                    <span className="block text-[8px] opacity-90 truncate" style={{ color: chartColors.textMain }}>{isAr ? 'طوارئ' : 'Emergency'}</span>
                    <span className="block font-bold text-red-500 mt-1 text-xs">{pct(activeWilEnc.ANE, activeWilVal)}</span>
                  </div>
                  <div className="p-2 bg-slate-900/50 rounded-md border border-white/5">
                    <span className="block text-[8px] opacity-90 truncate" style={{ color: chartColors.textMain }}>{isAr ? 'الخدمات المجتمعية' : 'Community'}</span>
                    <span className="block font-bold text-purple-400 mt-1 text-xs">{pct(activeWilEnc.COMMUNITY, activeWilVal)}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Establishments breakdown list (4/12 width) */}
            <div className={`lg:col-span-4 p-5 rounded-xl border max-h-[380px] overflow-y-auto space-y-2 ${styles.innerCardBg}`}>
              <span className="text-xs font-black block opacity-95 mb-3 select-none" style={{ color: chartColors.textMain }}>
                {isAr 
                  ? `المرافق والمستشفيات التابعة لولاية (${WILAYAT_AR[activeWilInfo] || activeWilInfo})` 
                  : `Medical Centers under ${activeWilInfo}`}
              </span>
              <div className="space-y-1.5">
                {(() => {
                  const estMap = data.by_wil_estab[activeWilInfo] || {};
                  const list = Object.entries(estMap).map(([estName, cumulativeVal]) => {
                    const val = mapYearFilter === 'ALL'
                      ? (data.by_estab_year[estName]
                          ? Object.values(data.by_estab_year[estName]).reduce((sum, v) => sum + (v || 0), 0)
                          : Number(cumulativeVal || 0))
                      : (data.by_estab_year[estName]?.[mapYearFilter] || 0);
                    return { name: estName, value: val };
                  });

                  // Filter out zero-visit clinics for this year to keep it clean, fallback to all if empty
                  const filteredList = list.filter(item => item.value > 0);
                  const listToRender = filteredList.length > 0 ? filteredList : list;

                  // Sort descending by visit value
                  listToRender.sort((a, b) => b.value - a.value);

                  return listToRender.map(({ name, value }) => (
                    <div key={name} className="flex items-center justify-between text-[11px] border-b border-white/5 pb-1.5 font-bold font-mono animate-fade-in">
                      <span className="text-right font-sans truncate max-w-[200px]" style={{ color: chartColors.textMuted }}>{name}</span>
                      <span className="font-extrabold text-[#f59e0b] font-mono">{fmt(value)}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 3️⃣ DYNAMIC CROSS-COMPARISON MODE BLOCK */}
      <div className={`p-5 rounded-xl border relative transition-all duration-300 ${styles.cardBg}`}>
        
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-505/20">
              <ArrowLeftRight className="w-4 h-4" />
            </span>
            <h3 className={`text-sm font-extrabold ${styles.textMain}`}>
              {isAr ? 'لوحة المقارنة المتقاطعة ثنائية الأبعاد (Benchmark Mode)' : 'Double Benchmark Cross-Comparison Mode'}
            </h3>
          </div>

          {/* Compare Selectors */}
          <div className="flex items-center gap-2 text-xs">
            <span className="opacity-95 font-bold" style={{ color: chartColors.textMain }}>{isAr ? 'مقارنة حسب:' : 'Compare:'}</span>
            <button
              onClick={() => setCompareType('wilayat')}
              className={`px-3 py-1.5 rounded-lg border font-bold cursor-pointer transition-all ${
                compareType === 'wilayat'
                  ? 'bg-sky-500 text-slate-950 border-sky-400'
                  : styles.selectBg + ' ' + styles.textMuted
              }`}
              style={{ color: compareType === 'wilayat' ? '#0f171e' : chartColors.textMuted }}
            >
              {isAr ? 'ولايات' : 'Wilayats'}
            </button>
            <button
              onClick={() => setCompareType('estab')}
              className={`px-3 py-1.5 rounded-lg border font-bold cursor-pointer transition-all ${
                compareType === 'estab'
                  ? 'bg-sky-500 text-slate-950 border-sky-400'
                  : styles.selectBg + ' ' + styles.textMuted
              }`}
              style={{ color: compareType === 'estab' ? '#0f171e' : chartColors.textMuted }}
            >
              {isAr ? 'المراكز والمستشفيات' : 'Health Centers'}
            </button>
          </div>
        </div>

        {/* TWO DROPDOWNS COMPARATIVES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center mb-6 p-4 rounded-xl bg-slate-950/20 border border-white/5">
          {/* Entity A */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400" />
              {isAr ? 'الطرف الأول للمقارنة (المجموعة أ)' : 'Primary Benchmark Subject A'}
            </label>
            <select
              value={entityA}
              onChange={(e) => setEntityA(e.target.value)}
              className={`w-full text-xs font-black rounded-lg px-3 py-2.5 outline-none cursor-pointer border ${styles.selectBg} ${styles.selectText} ${styles.selectBorder}`}
              style={{ color: chartColors.textMain }}
            >
              {compareType === 'wilayat' ? (
                Object.keys(data.by_wilayat).map(w => (
                  <option key={w} value={w} className={styles.selectOptionBg}>{isAr ? WILAYAT_AR[w] || w : w}</option>
                ))
              ) : (
                getAllFacilities().map(f => (
                  <option key={f} value={f} className={styles.selectOptionBg}>{f}</option>
                ))
              )}
            </select>
          </div>

          {/* Entity B */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-pink-400 flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-pink-400" />
              {isAr ? 'الطرف الثاني للمقارنة (المجموعة ب)' : 'Secondary Benchmark Subject B'}
            </label>
            <select
              value={entityB}
              onChange={(e) => setEntityB(e.target.value)}
              className={`w-full text-xs font-black rounded-lg px-3 py-2.5 outline-none cursor-pointer border ${styles.selectBg} ${styles.selectText} ${styles.selectBorder}`}
              style={{ color: chartColors.textMain }}
            >
              {compareType === 'wilayat' ? (
                Object.keys(data.by_wilayat).map(w => (
                  <option key={w} value={w} className={styles.selectOptionBg}>{isAr ? WILAYAT_AR[w] || w : w}</option>
                ))
              ) : (
                getAllFacilities().map(f => (
                  <option key={f} value={f} className={styles.selectOptionBg}>{f}</option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* DYNAMIC METRIC CARDS COMPARATIVES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Chart 1: Yearly Growth Comparison */}
          <div className={`p-4 rounded-xl border ${styles.innerCardBg}`}>
            <div className="flex items-center justify-between gap-1.5 mb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-[11px] font-black opacity-95 text-slate-100" style={{ color: chartColors.textMain }}>
                  {isAr ? 'مقارنة النمو والترند' : 'Growth & Trend Comparison'}
                </span>
              </div>
              <YearFilter value={chart1YearFilter} onChange={setChart1YearFilter} />
            </div>
            <div className="h-[300px] w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart1YearFilter === 'ALL' ? buildComparisonYearlySeries() : buildComparisonMonthlySeries(chart1YearFilter)}>
                  <defs>
                    <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.entityA} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={chartColors.entityA} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.entityB} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={chartColors.entityB} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                  <XAxis 
                    dataKey="name" 
                    stroke={chartColors.textMuted} 
                    tick={{ fill: chartColors.textMain, fontWeight: 'bold' }} 
                    fontSize={10} 
                  />
                  <YAxis 
                    stroke={chartColors.textMuted} 
                    tick={{ fill: chartColors.textMain, fontWeight: 'bold' }} 
                    fontSize={10} 
                    width={38} 
                    tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} 
                  />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder }}
                    labelStyle={{ color: chartColors.tooltipColor, fontWeight: 'bold' }} 
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '5px' }}
                    formatter={(value) => <span className="font-extrabold text-[10px]" style={{ color: chartColors.textMain }}>{value}</span>}
                  />
                  <Area type="monotone" dataKey={isAr ? `المؤسسة/الولاية (أ)` : `Entity A`} stroke={chartColors.entityA} strokeWidth={3.5} fillOpacity={1} fill="url(#colorA)" />
                  <Area type="monotone" dataKey={isAr ? `المؤسسة/الولاية (ب)` : `Entity B`} stroke={chartColors.entityB} strokeWidth={3.5} fillOpacity={1} fill="url(#colorB)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Shift load balance */}
          <div className={`p-4 rounded-xl border ${styles.innerCardBg}`}>
            <div className="flex items-center justify-between gap-1.5 mb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="text-[11px] font-black opacity-95 text-slate-100" style={{ color: chartColors.textMain }}>
                  {isAr ? 'العبء التشغيلي مقارنة بالشفتات' : 'Shift Operating Load Share'}
                </span>
              </div>
              <YearFilter value={chart2YearFilter} onChange={setChart2YearFilter} />
            </div>
            <div className="h-[300px] w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buildComparisonShiftSeries()}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                  <XAxis 
                    dataKey="name" 
                    stroke={chartColors.textMuted} 
                    tick={{ fill: chartColors.textMain, fontWeight: 'bold' }} 
                    fontSize={9} 
                  />
                  <YAxis 
                    stroke={chartColors.textMuted} 
                    tick={{ fill: chartColors.textMain, fontWeight: 'bold' }} 
                    fontSize={10} 
                    width={38} 
                    tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} 
                  />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder }}
                    labelStyle={{ color: chartColors.tooltipColor, fontWeight: 'bold' }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '5px' }}
                    formatter={(value) => <span className="font-extrabold text-[10px]" style={{ color: chartColors.textMain }}>{value}</span>}
                  />
                  <Bar dataKey={isAr ? `المؤسسة/الولاية (أ)` : `Entity A`} fill={chartColors.entityA} radius={[4, 4, 0, 0]} />
                  <Bar dataKey={isAr ? `المؤسسة/الولاية (ب)` : `Entity B`} fill={chartColors.entityB} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Visit type allocation */}
          <div className={`p-4 rounded-xl border ${styles.innerCardBg}`}>
            <div className="flex items-center justify-between gap-1.5 mb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#fbbf24]" />
                <span className="text-[11px] font-black opacity-95 text-slate-100" style={{ color: chartColors.textMain }}>
                  {isAr ? 'تصنيف حالات العيادات والطوارئ' : 'Encounter & Emergency Mix'}
                </span>
              </div>
              <YearFilter value={chart3YearFilter} onChange={setChart3YearFilter} />
            </div>
            <div className="h-[300px] w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buildComparisonVisitTypeSeries()}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridStroke} />
                  <XAxis 
                    dataKey="name" 
                    stroke={chartColors.textMuted} 
                    tick={{ fill: chartColors.textMain, fontWeight: 'bold' }} 
                    fontSize={9} 
                  />
                  <YAxis 
                    stroke={chartColors.textMuted} 
                    tick={{ fill: chartColors.textMain, fontWeight: 'bold' }} 
                    fontSize={10} 
                    width={38} 
                    tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} 
                  />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder }}
                    labelStyle={{ color: chartColors.tooltipColor, fontWeight: 'bold' }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '5px' }}
                    formatter={(value) => <span className="font-extrabold text-[10px]" style={{ color: chartColors.textMain }}>{value}</span>}
                  />
                  <Bar dataKey={isAr ? `المؤسسة/الولاية (أ)` : `Entity A`} fill={chartColors.entityA} radius={[4, 4, 0, 0]} />
                  <Bar dataKey={isAr ? `المؤسسة/الولاية (ب)` : `Entity B`} fill={chartColors.entityB} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        <div className="mt-4 text-[10px] p-2.5 rounded-lg bg-orange-500/5 border border-orange-550/15 flex items-center gap-1.5 opacity-95 select-none" style={{ color: chartColors.textMain }}>
          <span className="p-0.5 rounded bg-orange-500/20 text-orange-400">⚡</span>
          <span className="font-bold">
            {isAr 
              ? `تبين المقارنات التباين في النمو؛ فبالمقارنة يظهر الفرق التشغيلي ونقاط الذروة بوضوح بين الكيانين المحددين لتوجيه الكوادر الصحية.` 
              : `Benchmark clearly highlights core operational and workload variance between your selected entities.`}
          </span>
        </div>

      </div>

      {/* 4️⃣ HOURLY HEATMAP MATRIX BLOCK */}
      <div className={`p-5 rounded-xl border relative transition-all duration-300 ${styles.cardBg}`}>
        
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-505/20">
              <Clock className="w-4 h-4" />
            </span>
            <h3 className={`text-sm font-extrabold ${styles.textMain}`}>
              {isAr ? 'مصفوفة كثافة الزيارات التشغيلية طوال أشهر السنة (Monthly Operational Heatmap)' : 'Interactive Monthly Shifts Operations Heatmap'}
            </h3>
          </div>

          {/* Filter by Wilayat inside Matrix */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="opacity-95 font-bold" style={{ color: chartColors.textMain }}>{isAr ? 'الولاية:' : 'Wilayat:'}</span>
              <select
                value={heatmapWilayatFilter}
                onChange={(e) => setHeatmapWilayatFilter(e.target.value)}
                className={`text-xs font-black rounded-lg px-2 py-1 outline-none cursor-pointer border ${styles.selectBg} ${styles.selectText} ${styles.selectBorder}`}
                style={{ color: chartColors.textMain }}
              >
                <option value="ALL" className={styles.selectOptionBg}>{isAr ? 'محافظة ظفار' : 'Entire Dhofar Governorate'}</option>
                {Object.keys(data.by_wilayat).map(w => (
                  <option key={w} value={w} className={styles.selectOptionBg}>{isAr ? WILAYAT_AR[w] || w : w}</option>
                ))}
              </select>
            </div>
            <YearFilter value={heatmapYearFilter} onChange={setHeatmapYearFilter} label={isAr ? 'السنة:' : 'Year:'} />
          </div>
        </div>

        {/* GRID TABLE CONTAINER */}
        <div className="overflow-x-auto">
          <div className="min-w-[720px] xl:min-w-0 xl:w-full border border-white/5 rounded-xl overflow-hidden p-2.5 bg-slate-950/20">
            
            {/* Table Column headers (Months) */}
            <div 
              className="gap-1 mb-1.5 text-center text-[10px] font-black text-slate-300 w-full"
              style={{ display: 'grid', gridTemplateColumns: `110px repeat(${filteredMonths.length}, minmax(0, 1fr))` }}
            >
              {/* corner placeholder */}
              <div className={`p-1.5 self-center font-extrabold text-right`} style={{ color: chartColors.textMain }}>
                {isAr ? 'فترات الشفت' : 'Shift Periods'}
              </div>
              {filteredMonths.map(month => (
                <div 
                  key={month.id} 
                  className={`p-1.5 rounded-md border font-extrabold flex items-center justify-center ${
                    theme === 'bento' 
                      ? 'bg-slate-100 border-slate-200 text-slate-900' 
                      : 'bg-slate-800/40 border-white/10 text-white'
                  }`}
                  style={{ color: theme === 'bento' ? '#0f171e' : '#ffffff' }}
                >
                  {isAr ? month.ar : month.en}
                </div>
              ))}
            </div>

            {/* Table Rows (Time Intervals) */}
            <div className="space-y-1 w-full">
              {TIME_SLOTS.map((slot, rIdx) => (
                <div 
                  key={rIdx} 
                  className="gap-1 items-center"
                  style={{ display: 'grid', gridTemplateColumns: `110px repeat(${filteredMonths.length}, minmax(0, 1fr))` }}
                >
                  
                  {/* Row Label */}
                  <div className={`text-[10px] font-black leading-tight pr-1.5`} style={{ color: chartColors.textMain }}>
                    {isAr ? slot.labelAr : slot.labelEn}
                    <span className="block text-[8px] text-[#fbbf24] mt-0.5 opacity-90 uppercase leading-none font-sans font-bold select-none">
                      {isAr ? 'مستند للشفت' : 'Anchor:'} {slot.shiftId.split(' ')[0]}
                    </span>
                  </div>

                  {/* Columns Cells */}
                  {filteredMonths.map(month => {
                    const val = calculateHeatmapVal(month.id, rIdx);
                    return (
                      <div
                        key={month.id}
                        className={`p-2 xl:p-1.5 rounded-lg border text-center transition-all duration-200 select-none flex flex-col items-center justify-center cursor-help shadow-xs hover:scale-105 hover:z-10 ${getHeatmapColor(val)}`}
                        title={`${isAr ? 'الشهر:' : 'Month:'} ${isAr ? month.ar : month.en} | ${isAr ? slot.labelAr : slot.labelEn} \n${isAr ? 'العدد التقديري الفعلي:' : 'Estimated visits:'} ${fmt(val)} ${isAr ? 'زيارة' : 'visits'}`}
                      >
                        <span className="text-[10px] font-black font-mono leading-none tracking-tight">
                          {fmt(val)}
                        </span>
                      </div>
                    );
                  })}

                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Matrix description and info */}
        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-[10px] font-extrabold select-none" style={{ color: chartColors.textMain }}>
          <span className="flex items-center gap-1.5">
            <span className="p-0.5 rounded bg-blue-500/20 text-blue-400">💡</span>
            {isAr 
              ? 'ملاحظة: تظهر خارطة مصفوفة الكثافة الشهرية تركز المراجعين بموسم الخريف (يوليو وأغسطس) بفترات الذرة لتدفق السياح لمحافظة ظفار.' 
              : 'Focus metrics reveal extreme peak visitors during Khareef Season (July & August) at peak operational slots.'}
          </span>
          
          {/* Simple heat box indicator */}
          <div className="flex items-center gap-2">
            <span>{isAr ? 'نادر/متدني' : 'Cold'}</span>
            <div className="w-4 h-4 rounded bg-sky-500/10 border border-sky-500/20" />
            <div className="w-4 h-4 rounded bg-sky-500/30 border border-sky-500/35" />
            <div className="w-4 h-4 rounded bg-sky-500/60 border border-sky-400/60" />
            <div className="w-4 h-4 rounded bg-sky-500 border border-sky-350" />
            <span>{isAr ? 'ذروة تشغيلية مطلقة 🔥' : 'Peak 🔥'}</span>
          </div>
        </div>

      </div>

    </div>
  );
}
