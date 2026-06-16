import React from 'react';
import { 
  BarChart3, 
  Map, 
  Building2, 
  Activity, 
  Calendar, 
  CalendarDays, 
  Clock, 
  FolderOpen,
  Palette,
  Languages,
  Sparkles
} from 'lucide-react';
import { ThemeType, LangType, PageType } from '../types';
import { HealthInfoLogo } from './HealthInfoLogo';

interface SidebarProps {
  currentTab: PageType;
  setTab: (tab: PageType) => void;
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  lang: LangType;
  setLang: (lang: LangType) => void;
  openUpload: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const sidebarThemes = {
  immersive: {
    bg: 'bg-[#0f172a]',
    text: 'text-[#f1f5f9]',
    border: 'border-[#1e293b]',
    headerBorder: 'border-[#1e293b]',
    itemActive: 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-inner',
    itemHover: 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200',
    itemIconActive: 'text-sky-450',
    itemIconInactive: 'text-slate-500',
    controlBg: 'bg-slate-950/20',
    controlSubBg: 'bg-slate-950/50 p-1 rounded-lg border border-white/5',
    pillText: 'text-slate-450 hover:text-slate-200',
    pillActive: 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/10',
    textMuted: 'text-slate-400'
  },
  bento: {
    bg: 'bg-white',
    text: 'text-slate-800',
    border: 'border-slate-200/90',
    headerBorder: 'border-slate-100',
    itemActive: 'bg-blue-50 text-blue-600 border border-blue-100 shadow-xs font-semibold',
    itemHover: 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
    itemIconActive: 'text-blue-500',
    itemIconInactive: 'text-slate-400',
    controlBg: 'bg-slate-50/50',
    controlSubBg: 'bg-slate-100 p-1 rounded-lg border border-slate-200/50',
    pillText: 'text-slate-650 hover:text-slate-900',
    pillActive: 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/10',
    textMuted: 'text-slate-500'
  },
  luxury: {
    bg: 'bg-[#112326]',
    text: 'text-[#fdfcfb]',
    border: 'border-[#244f55]/80',
    headerBorder: 'border-[#1f3f44]/80',
    itemActive: 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-inner',
    itemHover: 'text-[#87a3a6] hover:bg-[#1a3d42]/30 hover:text-[#fdfcfb]',
    itemIconActive: 'text-amber-500',
    itemIconInactive: 'text-[#87a3a6]',
    controlBg: 'bg-[#0e2124]/40',
    controlSubBg: 'bg-[#080d0e] p-1 rounded-lg border border-[#244f55]/30',
    pillText: 'text-[#87a3a6] hover:text-[#fdfcfb]',
    pillActive: 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10',
    textMuted: 'text-[#87a3a6]'
  }
};

export function Sidebar({
  currentTab,
  setTab,
  theme,
  setTheme,
  lang,
  setLang,
  openUpload,
  isMobileOpen,
  onCloseMobile
}: SidebarProps) {
  const isAr = lang === 'ar';
  const sTheme = sidebarThemes[theme] || sidebarThemes.immersive;

  const menuItems = [
    { id: 'overview', icon: <BarChart3 className="w-5 h-5" />, ar: 'المؤشرات العامة', en: 'General Indicators' },
    { id: 'wilayat', icon: <Map className="w-5 h-5" />, ar: 'المترددين حسب الولايات', en: 'Visitors by Wilayat' },
    { id: 'estab', icon: <Building2 className="w-5 h-5" />, ar: 'المترددين حسب المؤسسات', en: 'Visitors by Facilities' },
    { id: 'visit', icon: <Activity className="w-5 h-5" />, ar: 'المترددين حسب نوع الزيارة', en: 'Visitors by Visit Type' },
    { id: 'year', icon: <Calendar className="w-5 h-5" />, ar: 'المترددين حسب السنوات', en: 'Visitors by Year' },
    { id: 'month', icon: <CalendarDays className="w-5 h-5" />, ar: 'المترددين حسب الشهر', en: 'Visitors by Month' },
    { id: 'workday', icon: <Clock className="w-5 h-5" />, ar: 'المترددين حسب أيام العمل والشفت', en: 'Visitors by Work Days & Shifts' },
    { id: 'advanced', icon: <Sparkles className="w-5 h-5 animate-pulse text-amber-500" />, ar: 'مؤشرات الاداء و المقارنة', en: 'Advanced Operational Analytics' },
  ] as const;

  // Responsive dynamic styling for solid layout
  const responsiveClasses = isMobileOpen 
    ? `fixed inset-y-0 z-50 flex flex-col h-screen overflow-y-auto ${isAr ? 'right-0 border-l' : 'left-0 border-r'} shadow-2xl transition-all duration-300 w-64 ${sTheme.bg} ${sTheme.border} ${sTheme.text}`
    : `hidden md:flex md:sticky top-0 h-screen flex-col overflow-y-auto flex-shrink-0 z-30 transition-all w-64 ${isAr ? 'rtl:border-l rtl:border-r-0 ltr:border-r ltr:border-l-0' : 'ltr:border-r ltr:border-l-0 rtl:border-l rtl:border-r-0'} ${sTheme.bg} ${sTheme.border} ${sTheme.text}`;

  return (
    <aside className={responsiveClasses}>
      {/* BRANDING */}
      <div className={`p-6 border-b text-center flex flex-col items-center ${sTheme.headerBorder}`}>
        <div className="bg-white border border-slate-200 p-1.5 rounded-2xl shadow-md mb-3 flex items-center justify-center select-none">
          <HealthInfoLogo size="lg" />
        </div>
        <h2 className="text-sm font-bold leading-relaxed mb-1">
          {isAr ? (
            <>منصة مؤشرات المترددين<br />محافظة ظفار</>
          ) : (
            <>Dhofar Visitors<br />Indicators Platform</>
          )}
        </h2>
        
        <div className={`mt-3 pt-3 border-t w-full flex flex-col gap-1 text-[9px] font-semibold ${sTheme.headerBorder}`}>
          <span className="text-sky-550/95 leading-tight">
            {isAr ? 'المديرية العامة للخدمات الصحية بظفار' : 'Directorate General of Health Services in Dhofar'}
          </span>
          <span className="text-sky-550/90 leading-tight">
            {isAr ? 'دائرة التخطيط والتنظيم الصحي' : 'Department of Planning & Health Organization'}
          </span>
          <span className={`${sTheme.textMuted} leading-tight`}>
            {isAr ? 'إدارة المعلومات الصحية' : 'Health Information Department'}
          </span>
        </div>
      </div>

      {/* NAVIGATION SECTION */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        <div className={`text-[10px] uppercase tracking-wider px-3 font-bold mb-2 ${sTheme.textMuted}`}>
          {isAr ? 'الصفحات' : 'Dashboard Pages'}
        </div>
        
        {menuItems.map((item) => {
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setTab(item.id);
                onCloseMobile?.();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-right ltr:text-left text-sm ${
                active 
                  ? sTheme.itemActive 
                  : sTheme.itemHover
              }`}
            >
              <span className={`transition-transform duration-200 ${active ? sTheme.itemIconActive : sTheme.itemIconInactive}`}>
                {item.icon}
              </span>
              <span className="flex-1 font-medium text-xs">
                {isAr ? item.ar : item.en}
              </span>
            </button>
          );
        })}
      </div>

      {/* SYSTEM CONTROLS */}
      <div className={`p-4 border-t ${sTheme.headerBorder} ${sTheme.controlBg}`}>
        {/* THEME SELECTOR */}
        <div className="mb-4">
          <div className="text-[9px] uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5 justify-center opacity-85">
            <Palette className="w-3 h-3 text-slate-400" />
            <span>{isAr ? 'مظهر المنصة' : 'Dashboard Theme'}</span>
          </div>
          <div className={`grid grid-cols-3 gap-1 p-1 rounded-lg border ${sTheme.controlSubBg}`}>
            {(['immersive', 'bento', 'luxury'] as const).map((t) => {
              const label = t === 'immersive' ? (isAr ? 'داكن' : 'Dark') : t === 'bento' ? (isAr ? 'بنتو' : 'Bento') : (isAr ? 'ذهبي' : 'Gold');
              const active = theme === t;
              return (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`text-[10px] py-1.5 rounded-md transition-all font-medium text-center ${
                    active 
                      ? sTheme.pillActive 
                      : sTheme.pillText
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* LANGUAGE SELECTOR */}
        <div className="mb-4">
          <div className="text-[9px] uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5 justify-center opacity-85">
            <Languages className="w-3 h-3 text-slate-400" />
            <span>{isAr ? 'لغة العرض' : 'Platform Language'}</span>
          </div>
          <div className={`grid grid-cols-2 gap-1 p-1 rounded-lg border ${sTheme.controlSubBg}`}>
            <button
              onClick={() => setLang('ar')}
              className={`text-xs py-1.5 rounded-md transition-all text-center font-medium ${
                isAr 
                  ? sTheme.pillActive 
                  : sTheme.pillText
              }`}
            >
              العربية
            </button>
            <button
              onClick={() => setLang('en')}
              className={`text-xs py-1.5 rounded-md transition-all text-center font-medium ${
                !isAr 
                  ? sTheme.pillActive 
                  : sTheme.pillText
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* UPLOAD Trigger */}
        <button
          onClick={openUpload}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 font-bold text-xs ${
            theme === 'bento'
              ? 'bg-blue-500/10 border border-blue-500/30 hover:border-blue-500/60 text-blue-600 hover:bg-blue-500/15'
              : theme === 'luxury'
              ? 'bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/60 text-amber-500 hover:bg-amber-500/15'
              : 'bg-sky-400/10 border border-sky-400/30 hover:border-sky-400/60 text-sky-400 hover:bg-sky-400/15'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>{isAr ? 'رفع بيانات جديدة' : 'Upload New Data'}</span>
        </button>
      </div>
    </aside>
  );
}
