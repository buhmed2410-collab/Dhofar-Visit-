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
  Languages
} from 'lucide-react';
import { ThemeType, LangType, PageType } from '../types';

interface SidebarProps {
  currentTab: PageType;
  setTab: (tab: PageType) => void;
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  lang: LangType;
  setLang: (lang: LangType) => void;
  openUpload: () => void;
}

export function Sidebar({
  currentTab,
  setTab,
  theme,
  setTheme,
  lang,
  setLang,
  openUpload
}: SidebarProps) {
  const isAr = lang === 'ar';

  const menuItems = [
    { id: 'overview', icon: <BarChart3 className="w-5 h-5" />, ar: 'المؤشرات الصحية', en: 'Health Indicators' },
    { id: 'wilayat', icon: <Map className="w-5 h-5" />, ar: 'حسب الولاية', en: 'By Wilayat' },
    { id: 'estab', icon: <Building2 className="w-5 h-5" />, ar: 'المؤسسات الصحية', en: 'Health Facilities' },
    { id: 'visit', icon: <Activity className="w-5 h-5" />, ar: 'أنواع الزيارة', en: 'Visit Types' },
    { id: 'year', icon: <Calendar className="w-5 h-5" />, ar: 'حسب السنوات', en: 'By Year' },
    { id: 'month', icon: <CalendarDays className="w-5 h-5" />, ar: 'حسب الأشهر', en: 'By Month' },
    { id: 'workday', icon: <Clock className="w-5 h-5" />, ar: 'أيام العمل والشفتات', en: 'Work Days & Shifts' },
  ] as const;

  return (
    <aside className="w-64 h-screen fixed top-0 right-0 border-l border-white/10 bg-slate-900/90 text-slate-100 flex flex-col z-50 overflow-y-auto ltr:left-0 ltr:right-auto ltr:border-l-0 ltr:border-r ltr:border-white/10">
      {/* BRANDING */}
      <div className="p-6 border-b border-white/10 text-center flex flex-col items-center">
        <div className="w-14 h-14 bg-gradient-to-tr from-sky-400 to-indigo-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-sky-500/20 mb-3">
          🏥
        </div>
        <h2 className="text-sm font-bold leading-relaxed text-slate-100 mb-1">
          {isAr ? (
            <>المؤشرات الصحية<br />محافظة ظفار</>
          ) : (
            <>Health Indicators<br />Dhofar Governorate</>
          )}
        </h2>
        <p className="text-[10px] text-slate-400 font-mono">2023 – 2025</p>
        
        <div className="mt-3 pt-3 border-t border-white/10 w-full flex flex-col gap-0.5 text-[9px] font-semibold text-slate-300">
          <span className="text-sky-400">
            {isAr ? 'دائرة التخطيط والتنظيم الصحي' : 'Planning & Health Org Dept'}
          </span>
          <span className="text-slate-400">
            {isAr ? 'إدارة المعلومات الصحية' : 'Health Information Department'}
          </span>
        </div>
      </div>

      {/* NAVIGATION SECTION */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 px-3 font-bold mb-2">
          {isAr ? 'الصفحات' : 'Dashboard Pages'}
        </div>
        
        {menuItems.map((item) => {
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-right ltr:text-left text-sm ${
                active 
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-inner' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <span className={`transition-transform duration-200 ${active ? 'scale-110 text-sky-400' : 'text-slate-500'}`}>
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
      <div className="p-4 border-t border-white/10 bg-slate-950/20">
        {/* THEME SELECTOR */}
        <div className="mb-4">
          <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2 flex items-center gap-1.5 justify-center">
            <Palette className="w-3 h-3 text-slate-400" />
            <span>{isAr ? 'مظهر المنصة' : 'Dashboard Theme'}</span>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-slate-950/50 p-1 rounded-lg border border-white/5">
            {(['immersive', 'bento', 'luxury'] as const).map((t) => {
              const label = t === 'immersive' ? (isAr ? 'داكن' : 'Dark') : t === 'bento' ? (isAr ? 'بنتو' : 'Bento') : (isAr ? 'ذهبي' : 'Gold');
              const active = theme === t;
              return (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`text-[10px] py-1.5 rounded-md transition-all font-medium text-center ${
                    active 
                      ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/10' 
                      : 'text-slate-400 hover:text-slate-200'
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
          <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2 flex items-center gap-1.5 justify-center">
            <Languages className="w-3 h-3 text-slate-400" />
            <span>{isAr ? 'لغة العرض' : 'Platform Language'}</span>
          </div>
          <div className="grid grid-cols-2 gap-1 bg-slate-950/50 p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setLang('ar')}
              className={`text-xs py-1.5 rounded-md transition-all text-center font-medium ${
                isAr 
                  ? 'bg-sky-500 text-slate-950 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              العربية
            </button>
            <button
              onClick={() => setLang('en')}
              className={`text-xs py-1.5 rounded-md transition-all text-center font-medium ${
                !isAr 
                  ? 'bg-sky-500 text-slate-950 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* UPLOAD Trigger */}
        <button
          onClick={openUpload}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-sky-400/10 to-indigo-500/10 border border-sky-400/30 hover:border-sky-400/60 text-sky-400 hover:bg-sky-400/15 transition-all duration-300 font-bold text-xs"
        >
          <FolderOpen className="w-4 h-4" />
          <span>{isAr ? 'رفع بيانات جديدة' : 'Upload New Data'}</span>
        </button>
      </div>
    </aside>
  );
}
