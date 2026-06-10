import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { UploadModal } from './components/UploadModal';
import { INITIAL_DATA } from './data';
import { DashboardData, LangType, ThemeType, PageType } from './types';
import { themeStyles } from './theme';

// Tab components
import { OverviewPage } from './components/OverviewPage';
import { WilayatPage } from './components/WilayatPage';
import { EstabPage } from './components/EstabPage';
import { VisitPage } from './components/VisitPage';
import { YearPage } from './components/YearPage';
import { MonthPage } from './components/MonthPage';
import { WorkdayPage } from './components/WorkdayPage';

export default function App() {
  // Theme state: default to 'immersive' (High density Dark Slate theme)
  const [theme, setTheme] = useState<ThemeType>('immersive');
  // Language state
  const [lang, setLang] = useState<LangType>('ar');
  // Active Tab state
  const [activeTab, setActiveTab] = useState<PageType>('overview');
  // Upload modal triggered state
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  // Reactive Database state
  const [dashboardData, setDashboardData] = useState<DashboardData>({ ...INITIAL_DATA });

  const isAr = lang === 'ar';

  // Toggle handlers for the language & theme options
  const toggleLang = () => setLang(prev => (prev === 'ar' ? 'en' : 'ar'));
  const toggleTheme = () => setTheme(prev => (prev === 'bento' ? 'immersive' : 'bento'));

  // Reset database state to clean original Omani records
  const resetToFactoryData = () => {
    setDashboardData({ ...INITIAL_DATA });
  };

  // Get active style configuration
  const currentThemeStyles = themeStyles[theme] || themeStyles.immersive;
  const appBg = currentThemeStyles.appBg;
  const headerBg = currentThemeStyles.headerBg;

  // Handler for custom reactive dataset upload
  const handleUploadedDataset = (newParsedData: DashboardData, action: 'merge' | 'replace') => {
    if (action === 'replace') {
      setDashboardData(newParsedData);
    } else {
      // Merge values
      const merged: DashboardData = { ...dashboardData };
      merged.total += newParsedData.total;

      // Merge by_year
      Object.entries(newParsedData.by_year).forEach(([k, v]) => {
        merged.by_year[k] = (merged.by_year[k] || 0) + v;
      });

      // Merge by_wilayat
      Object.entries(newParsedData.by_wilayat).forEach(([k, v]) => {
        merged.by_wilayat[k] = (merged.by_wilayat[k] || 0) + v;
      });

      // Merge by_enc
      Object.entries(newParsedData.by_enc).forEach(([k, v]) => {
        merged.by_enc[k] = (merged.by_enc[k] || 0) + v;
      });

      // Merge by_shift
      Object.entries(newParsedData.by_shift).forEach(([k, v]) => {
        merged.by_shift[k] = (merged.by_shift[k] || 0) + v;
      });

      // Merge by_holiday
      Object.entries(newParsedData.by_holiday).forEach(([k, v]) => {
        merged.by_holiday[k] = (merged.by_holiday[k] || 0) + v;
      });

      // Merge by_wil_year
      Object.entries(newParsedData.by_wil_year).forEach(([w, yrMap]) => {
        if (!merged.by_wil_year[w]) merged.by_wil_year[w] = {};
        Object.entries(yrMap).forEach(([yr, v]) => {
          merged.by_wil_year[w][yr] = (merged.by_wil_year[w][yr] || 0) + v;
        });
      });

      // Merge by_wil_estab
      Object.entries(newParsedData.by_wil_estab).forEach(([w, estMap]) => {
        if (!merged.by_wil_estab[w]) merged.by_wil_estab[w] = {};
        Object.entries(estMap).forEach(([est, v]) => {
          merged.by_wil_estab[w][est] = (merged.by_wil_estab[w][est] || 0) + v;
        });
      });

      // Merge by_estab_year
      Object.entries(newParsedData.by_estab_year).forEach(([est, yrMap]) => {
        if (!merged.by_estab_year[est]) merged.by_estab_year[est] = {};
        Object.entries(yrMap).forEach(([yr, v]) => {
          merged.by_estab_year[est][yr] = (merged.by_estab_year[est][yr] || 0) + v;
        });
      });

      // Merge by_estab_shift
      Object.entries(newParsedData.by_estab_shift).forEach(([est, shMap]) => {
        if (!merged.by_estab_shift[est]) merged.by_estab_shift[est] = {};
        Object.entries(shMap).forEach(([sh, v]) => {
          merged.by_estab_shift[est][sh] = (merged.by_estab_shift[est][sh] || 0) + v;
        });
      });

      // Merge by_wil_shift
      Object.entries(newParsedData.by_wil_shift).forEach(([w, shMap]) => {
        if (!merged.by_wil_shift[w]) merged.by_wil_shift[w] = {};
        Object.entries(shMap).forEach(([sh, v]) => {
          merged.by_wil_shift[w][sh] = (merged.by_wil_shift[w][sh] || 0) + v;
        });
      });

      // Merge by_wil_shift_year
      Object.entries(newParsedData.by_wil_shift_year).forEach(([w, shMap]) => {
        if (!merged.by_wil_shift_year[w]) merged.by_wil_shift_year[w] = {};
        Object.entries(shMap).forEach(([sh, yrMap]) => {
          if (!merged.by_wil_shift_year[w][sh]) merged.by_wil_shift_year[w][sh] = {};
          Object.entries(yrMap).forEach(([yr, v]) => {
            merged.by_wil_shift_year[w][sh][yr] = (merged.by_wil_shift_year[w][sh][yr] || 0) + v;
          });
        });
      });

      // Merge by_estab_shift_year
      Object.entries(newParsedData.by_estab_shift_year).forEach(([est, shMap]) => {
        if (!merged.by_estab_shift_year[est]) merged.by_estab_shift_year[est] = {};
        Object.entries(shMap).forEach(([sh, yrMap]) => {
          if (!merged.by_estab_shift_year[est][sh]) merged.by_estab_shift_year[est][sh] = {};
          Object.entries(yrMap).forEach(([yr, v]) => {
            merged.by_estab_shift_year[est][sh][yr] = (merged.by_estab_shift_year[est][sh][yr] || 0) + v;
          });
        });
      });

      // Merge by_wil_enc
      Object.entries(newParsedData.by_wil_enc).forEach(([w, encMap]) => {
        if (!merged.by_wil_enc[w]) merged.by_wil_enc[w] = {};
        Object.entries(encMap).forEach(([enc, v]) => {
          merged.by_wil_enc[w][enc] = (merged.by_wil_enc[w][enc] || 0) + v;
        });
      });

      // Merge by_wil_enc_year
      Object.entries(newParsedData.by_wil_enc_year).forEach(([w, encMap]) => {
        if (!merged.by_wil_enc_year[w]) merged.by_wil_enc_year[w] = {};
        Object.entries(encMap).forEach(([enc, yrMap]) => {
          if (!merged.by_wil_enc_year[w][enc]) merged.by_wil_enc_year[w][enc] = {};
          Object.entries(yrMap).forEach(([yr, v]) => {
            merged.by_wil_enc_year[w][enc][yr] = (merged.by_wil_enc_year[w][enc][yr] || 0) + v;
          });
        });
      });

      // Merge by_year_month
      Object.entries(newParsedData.by_year_month).forEach(([yr, mMap]) => {
        if (!merged.by_year_month[yr]) merged.by_year_month[yr] = {};
        Object.entries(mMap).forEach(([m, v]) => {
          merged.by_year_month[yr][m] = (merged.by_year_month[yr][m] || 0) + v;
        });
      });

      // Merge by_wil_year_month
      Object.entries(newParsedData.by_wil_year_month).forEach(([w, yrMap]) => {
        if (!merged.by_wil_year_month[w]) merged.by_wil_year_month[w] = {};
        Object.entries(yrMap).forEach(([yr, mMap]) => {
          if (!merged.by_wil_year_month[w][yr]) merged.by_wil_year_month[w][yr] = {};
          Object.entries(mMap).forEach(([m, v]) => {
            merged.by_wil_year_month[w][yr][m] = (merged.by_wil_year_month[w][yr][m] || 0) + v;
          });
        });
      });

      // Merge by_estab_year_month
      Object.entries(newParsedData.by_estab_year_month).forEach(([est, yrMap]) => {
        if (!merged.by_estab_year_month[est]) merged.by_estab_year_month[est] = {};
        Object.entries(yrMap).forEach(([yr, mMap]) => {
          if (!merged.by_estab_year_month[est][yr]) merged.by_estab_year_month[est][yr] = {};
          Object.entries(mMap).forEach(([m, v]) => {
            merged.by_estab_year_month[est][yr][m] = (merged.by_estab_year_month[est][yr][m] || 0) + v;
          });
        });
      });

      setDashboardData(merged);
    }
  };

  return (
    <div 
      className={`min-h-screen flex ${appBg}`} 
      dir={isAr ? 'rtl' : 'ltr'} 
      id="aistudio_dashboard_main_container"
    >
      {/* SIDEBAR NAVIGATION CONTROLS */}
      <Sidebar 
        theme={theme}
        setTheme={setTheme}
        lang={lang}
        setLang={setLang}
        currentTab={activeTab}
        setTab={setActiveTab}
        openUpload={() => setIsUploadOpen(true)}
      />

      {/* MAIN MAIN CONTENT STAGE */}
      <div className="flex-1 flex flex-col md:overflow-y-auto h-screen relative">
        
        {/* GLOBAL HEADER BAR */}
        <header className={`sticky top-0 z-30 px-6 py-4 flex items-center justify-between ${headerBg}`}>
          <div className="flex items-center gap-3">
            <div className={`bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-black p-2 rounded-xl text-lg select-none`}>
              🇴🇲
            </div>
            <div>
              <h1 className={`text-base font-black tracking-tight select-none ${currentThemeStyles.headerText}`}>
                {isAr ? 'تطبيق لوحة مؤشرات صحة ظفار الموثق' : 'Dhofar Health Indicators Dashboard'}
              </h1>
              <p className={`text-[10px] font-bold leading-none mt-0.5 select-none ${currentThemeStyles.headerDesc}`}>
                {isAr ? 'المديرية العامة للخدمات الصحية بمحافظة ظفار' : 'Directorate General of Health Services (DGHS) - Dhofar'}
              </p>
            </div>
          </div>

          {/* Quick toggle headers (Upper pill bar) */}
          <div className="hidden lg:flex items-center gap-2">
            <button 
              onClick={toggleLang} 
              className="bg-slate-500/10 border border-slate-500/20 hover:bg-slate-500/20 text-xs font-black px-3.5 py-1.5 rounded-full cursor-pointer transition-all select-none"
            >
              {isAr ? 'English' : 'العربية'}
            </button>
            <button 
              onClick={toggleTheme} 
              className="bg-slate-500/10 border border-slate-500/20 hover:bg-slate-500/20 text-xs font-black px-3.5 py-1.5 rounded-full cursor-pointer transition-all select-none"
            >
              {theme === 'bento' ? '🌙' : '☀️'}
            </button>
          </div>
        </header>

        {/* CONTAINER DISPLAY GRID */}
        <main className="flex-1 p-4 md:p-5 space-y-5 max-w-7xl mx-auto w-full pb-20">
          
          {/* THEMATIC PAGES RENDER GRID */}
          <div className={`p-4 md:p-5 rounded-xl ${currentThemeStyles.cardBg} transition-all duration-300 shadow-sm`}>
            {activeTab === 'overview' && (
              <OverviewPage data={dashboardData} lang={lang} theme={theme} />
            )}
            {activeTab === 'wilayat' && (
              <WilayatPage data={dashboardData} lang={lang} theme={theme} />
            )}
            {activeTab === 'estab' && (
              <EstabPage data={dashboardData} lang={lang} theme={theme} />
            )}
            {activeTab === 'visit' && (
              <VisitPage data={dashboardData} lang={lang} theme={theme} />
            )}
            {activeTab === 'year' && (
              <YearPage data={dashboardData} lang={lang} theme={theme} />
            )}
            {activeTab === 'month' && (
              <MonthPage data={dashboardData} lang={lang} theme={theme} />
            )}
            {activeTab === 'workday' && (
              <WorkdayPage data={dashboardData} lang={lang} theme={theme} />
            )}
          </div>
        </main>
      </div>

      {/* DYNAMIC REACTIVE CSV LOADER FLOW MODAL */}
      {isUploadOpen && (
        <UploadModal 
          onClose={() => setIsUploadOpen(false)}
          lang={lang}
          onDataApplied={(newData, meta) => handleUploadedDataset(newData, meta.mode)}
        />
      )}
    </div>
  );
}
