import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { UploadModal } from './components/UploadModal';
import { Menu, X } from 'lucide-react';
import { INITIAL_DATA } from './data';
import { DashboardData, LangType, ThemeType, PageType } from './types';
import { themeStyles } from './theme';
import { HealthInfoLogo } from './components/HealthInfoLogo';

// Tab components
import { OverviewPage } from './components/OverviewPage';
import { WilayatPage } from './components/WilayatPage';
import { EstabPage } from './components/EstabPage';
import { VisitPage } from './components/VisitPage';
import { YearPage } from './components/YearPage';
import { MonthPage } from './components/MonthPage';
import { WorkdayPage } from './components/WorkdayPage';
import { AdvancedPage } from './components/AdvancedPage';

export default function App() {
  // Theme state: default to 'bento' (Classic Bento Grid theme)
  const [theme, setTheme] = useState<ThemeType>(() => {
    try {
      const saved = localStorage.getItem('dhofar_dashboard_theme');
      if (saved && (saved === 'bento' || saved === 'immersive' || saved === 'luxury')) {
        return saved as ThemeType;
      }
    } catch (e) {
      console.error(e);
    }
    return 'bento';
  });

  // Language state
  const [lang, setLang] = useState<LangType>(() => {
    try {
      const saved = localStorage.getItem('dhofar_dashboard_lang');
      if (saved && (saved === 'ar' || saved === 'en')) {
        return saved as LangType;
      }
    } catch (e) {
      console.error(e);
    }
    return 'ar';
  });

  // Active Tab state
  const [activeTab, setActiveTab] = useState<PageType>('overview');
  // Mobile drawer state
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  // Upload modal triggered state
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  // Track if there is a backup available in localStorage
  const [hasBackup, setHasBackup] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem('dhofar_dashboard_backup');
    } catch (_) {
      return false;
    }
  });
  
  // Reactive Database state with persistent client storage fallback
  const [dashboardData, setDashboardData] = useState<DashboardData>(() => {
    try {
      const saved = localStorage.getItem('dhofar_dashboard_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Force refresh shift matrices from INITIAL_DATA if using the default dataset,
        // or if the cached data lacks correct key depth. This solves old cached structure issue.
        const isDefault = parsed.total === INITIAL_DATA.total;
        if (isDefault || !parsed.by_year_month_shift || Object.keys(parsed.by_year_month_shift).length === 0) {
          parsed.by_year_month_shift = INITIAL_DATA.by_year_month_shift;
        }
        if (isDefault || !parsed.by_wil_year_month_shift || Object.keys(parsed.by_wil_year_month_shift).length < 5) {
          parsed.by_wil_year_month_shift = INITIAL_DATA.by_wil_year_month_shift || {};
        }
        return parsed;
      }
    } catch (e) {
      console.error("Error loading saved dashboard data:", e);
    }
    return { ...INITIAL_DATA };
  });

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dhofar_dashboard_theme', theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('dhofar_dashboard_lang', lang);
    } catch (e) {
      console.error(e);
    }
  }, [lang]);

  useEffect(() => {
    try {
      localStorage.setItem('dhofar_dashboard_data', JSON.stringify(dashboardData));
    } catch (e) {
      console.error("Error saving dashboard data:", e);
    }
  }, [dashboardData]);

  const isAr = lang === 'ar';

  // Toggle handlers for the language & theme options
  const toggleLang = () => setLang(prev => (prev === 'ar' ? 'en' : 'ar'));
  const toggleTheme = () => setTheme(prev => (prev === 'bento' ? 'immersive' : 'bento'));

  // Reset database state to clean original Omani records with backup feature
  const resetToFactoryData = () => {
    try {
      localStorage.setItem('dhofar_dashboard_backup', JSON.stringify(dashboardData));
      setHasBackup(true);
    } catch (_) {}
    setDashboardData({ ...INITIAL_DATA });
  };

  // Revert last uploads or deletes
  const undoLastAction = () => {
    try {
      const backup = localStorage.getItem('dhofar_dashboard_backup');
      if (backup) {
        const parsed = JSON.parse(backup);
        setDashboardData(parsed);
        localStorage.removeItem('dhofar_dashboard_backup');
        setHasBackup(false);
        return true;
      }
    } catch (e) {
      console.error("Error reverting last action:", e);
    }
    return false;
  };

  // Clear a specific month's data and decrement all metrics symmetrically
  const deleteMonthAndYear = (targetYear: string, targetMonth: string) => {
    try {
      // 1. Store backup first
      localStorage.setItem('dhofar_dashboard_backup', JSON.stringify(dashboardData));
      setHasBackup(true);

      const updated = JSON.parse(JSON.stringify(dashboardData)) as DashboardData;
      const monthVisits = updated.by_year_month[targetYear]?.[targetMonth] || 0;
      if (monthVisits <= 0) return false;

      // Decrement main totals
      updated.total = Math.max(0, updated.total - monthVisits);

      if (updated.by_year[targetYear] !== undefined) {
        updated.by_year[targetYear] = Math.max(0, updated.by_year[targetYear] - monthVisits);
        if (updated.by_year[targetYear] === 0) {
          delete updated.by_year[targetYear];
        }
      }

      if (updated.by_month[targetMonth] !== undefined) {
        updated.by_month[targetMonth] = Math.max(0, updated.by_month[targetMonth] - monthVisits);
        if (updated.by_month[targetMonth] === 0) {
          delete updated.by_month[targetMonth];
        }
      }

      // Delete from by_year_month map
      if (updated.by_year_month[targetYear]) {
        delete updated.by_year_month[targetYear][targetMonth];
        if (Object.keys(updated.by_year_month[targetYear]).length === 0) {
          delete updated.by_year_month[targetYear];
        }
      }

      // Subtract from wilayat level stats
      Object.keys(updated.by_wil_year_month || {}).forEach(w => {
        const wMonthVisits = updated.by_wil_year_month[w]?.[targetYear]?.[targetMonth] || 0;
        if (wMonthVisits > 0) {
          if (updated.by_wilayat[w] !== undefined) {
            updated.by_wilayat[w] = Math.max(0, updated.by_wilayat[w] - wMonthVisits);
          }
          if (updated.by_wil_year[w]?.[targetYear] !== undefined) {
            updated.by_wil_year[w][targetYear] = Math.max(0, updated.by_wil_year[w][targetYear] - wMonthVisits);
            if (updated.by_wil_year[w][targetYear] === 0) {
              delete updated.by_wil_year[w][targetYear];
            }
          }
          if (updated.by_wil_month[w]?.[targetMonth] !== undefined) {
            updated.by_wil_month[w][targetMonth] = Math.max(0, updated.by_wil_month[w][targetMonth] - wMonthVisits);
            if (updated.by_wil_month[w][targetMonth] === 0) {
              delete updated.by_wil_month[w][targetMonth];
            }
          }
          delete updated.by_wil_year_month[w][targetYear][targetMonth];
          if (Object.keys(updated.by_wil_year_month[w][targetYear]).length === 0) {
            delete updated.by_wil_year_month[w][targetYear];
          }
        }
      });

      // Subtract from establishment level stats
      Object.keys(updated.by_estab_year_month || {}).forEach(est => {
        const estMonthVisits = updated.by_estab_year_month[est]?.[targetYear]?.[targetMonth] || 0;
        if (estMonthVisits > 0) {
          if (updated.by_estab_year[est]?.[targetYear] !== undefined) {
            updated.by_estab_year[est][targetYear] = Math.max(0, updated.by_estab_year[est][targetYear] - estMonthVisits);
            if (updated.by_estab_year[est][targetYear] === 0) {
              delete updated.by_estab_year[est][targetYear];
            }
          }
          if (updated.by_estab_month[est]?.[targetMonth] !== undefined) {
            updated.by_estab_month[est][targetMonth] = Math.max(0, updated.by_estab_month[est][targetMonth] - estMonthVisits);
            if (updated.by_estab_month[est][targetMonth] === 0) {
              delete updated.by_estab_month[est][targetMonth];
            }
          }
          delete updated.by_estab_year_month[est][targetYear][targetMonth];
          if (Object.keys(updated.by_estab_year_month[est][targetYear]).length === 0) {
            delete updated.by_estab_year_month[est][targetYear];
          }
        }
      });

      // Maintain distribution parity across dimensions
      const ratio = updated.total > 0 && dashboardData.total > 0 ? (updated.total / dashboardData.total) : 0;
      if (ratio > 0) {
        updated.by_enc.OPD = Math.round(updated.by_enc.OPD * ratio);
        updated.by_enc.ANE = Math.round(updated.by_enc.ANE * ratio);
        updated.by_enc.COMMUNITY = Math.round(updated.by_enc.COMMUNITY * ratio);

        updated.by_shift['1ST SHIFT (MORNING)'] = Math.round(updated.by_shift['1ST SHIFT (MORNING)'] * ratio);
        updated.by_shift['2nd SHIFT (AFTERNOON)'] = Math.round(updated.by_shift['2nd SHIFT (AFTERNOON)'] * ratio);
        updated.by_shift['3RD SHIFT (NIGHT)'] = Math.round(updated.by_shift['3RD SHIFT (NIGHT)'] * ratio);

        updated.by_holiday['WORKING DAY'] = Math.round(updated.by_holiday['WORKING DAY'] * ratio);
        updated.by_holiday['HOLIDAY'] = Math.round(updated.by_holiday['HOLIDAY'] * ratio);
      } else {
        updated.by_enc = { OPD: 0, ANE: 0, COMMUNITY: 0 };
        updated.by_shift = { '1ST SHIFT (MORNING)': 0, '2nd SHIFT (AFTERNOON)': 0, '3RD SHIFT (NIGHT)': 0 };
        updated.by_holiday = { 'WORKING DAY': 0, 'HOLIDAY': 0 };
      }

      setDashboardData(updated);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Get active style configuration
  const currentThemeStyles = themeStyles[theme] || themeStyles.immersive;
  const appBg = currentThemeStyles.appBg;
  const headerBg = currentThemeStyles.headerBg;

  // Handler for custom reactive dataset upload
  const handleUploadedDataset = (newParsedData: DashboardData, action: 'merge' | 'replace') => {
    // Generate copy to backup
    try {
      localStorage.setItem('dhofar_dashboard_backup', JSON.stringify(dashboardData));
      setHasBackup(true);
    } catch (_) {}

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

      // Merge by_year_month_shift
      if (!merged.by_year_month_shift) merged.by_year_month_shift = {};
      Object.entries(newParsedData.by_year_month_shift || {}).forEach(([yr, mMap]) => {
        if (!merged.by_year_month_shift[yr]) merged.by_year_month_shift[yr] = {};
        Object.entries(mMap).forEach(([mo, shMap]) => {
          if (!merged.by_year_month_shift[yr][mo]) merged.by_year_month_shift[yr][mo] = {};
          Object.entries(shMap).forEach(([sh, v]) => {
            merged.by_year_month_shift[yr][mo][sh as any] = (merged.by_year_month_shift[yr][mo][sh as any] || 0) + v;
          });
        });
      });

      // Merge by_wil_year_month_shift
      if (!merged.by_wil_year_month_shift) merged.by_wil_year_month_shift = {};
      Object.entries(newParsedData.by_wil_year_month_shift || {}).forEach(([w, yrMap]) => {
        if (!merged.by_wil_year_month_shift[w]) merged.by_wil_year_month_shift[w] = {};
        Object.entries(yrMap).forEach(([yr, mMap]) => {
          if (!merged.by_wil_year_month_shift[w][yr]) merged.by_wil_year_month_shift[w][yr] = {};
          Object.entries(mMap).forEach(([mo, shMap]) => {
            if (!merged.by_wil_year_month_shift[w][yr][mo]) merged.by_wil_year_month_shift[w][yr][mo] = {};
            Object.entries(shMap).forEach(([sh, v]) => {
              merged.by_wil_year_month_shift[w][yr][mo][sh as any] = (merged.by_wil_year_month_shift[w][yr][mo][sh as any] || 0) + v;
            });
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
      {/* MOBILE DRAWERS OVERLAY BACKDROP */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity duration-300" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION CONTROLS */}
      <Sidebar 
        theme={theme}
        setTheme={setTheme}
        lang={lang}
        setLang={setLang}
        currentTab={activeTab}
        setTab={setActiveTab}
        openUpload={() => setIsUploadOpen(true)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* MAIN MAIN CONTENT STAGE */}
      <div className="flex-1 flex flex-col md:overflow-y-auto h-screen relative">
        
        {/* GLOBAL HEADER BAR */}
        <header className={`sticky top-0 z-30 px-6 py-4 flex items-center justify-between ${headerBg}`}>
          <div className="flex items-center gap-3">
            <div className="bg-white/95 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/80 p-1 rounded-xl shadow-md flex items-center justify-center select-none">
              <HealthInfoLogo size="md" />
            </div>
            <div>
              <h1 className={`text-xs md:text-sm lg:text-base font-black tracking-tight select-none ${currentThemeStyles.headerText}`}>
                {isAr ? 'منصة مؤشرات المترددين بمحافظة ظفار' : 'Dhofar Visitors Indicators Platform'}
              </h1>
              <div className="flex flex-col gap-1 mt-1 select-none">
                <p className={`text-[8px] md:text-[9px] lg:text-[10px] font-bold leading-none ${currentThemeStyles.headerDesc}`}>
                  {isAr ? 'المديرية العامة للخدمات الصحية بظفار' : 'Directorate General of Health Services in Dhofar'}
                </p>
                <p className={`text-[8px] md:text-[9px] lg:text-[10px] font-bold leading-none opacity-85 ${currentThemeStyles.headerDesc}`}>
                  {isAr ? 'دائرة التخطيط والتنظيم الصحي' : 'Department of Planning & Health Organization'}
                </p>
                <p className={`text-[8px] md:text-[9px] lg:text-[10px] font-bold leading-none opacity-75 ${currentThemeStyles.headerDesc}`}>
                  {isAr ? 'إدارة المعلومات الصحية' : 'Health Information Department'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick toggle headers & Mobile Switchers */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5">
              <button 
                onClick={toggleLang} 
                className={`border text-[11px] font-bold px-3 py-1.5 rounded-full cursor-pointer transition-all select-none ${
                  theme === 'bento' 
                    ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' 
                    : theme === 'luxury'
                    ? 'bg-[#152e32] border-[#244f55]/85 text-[#87a3a6] hover:bg-[#1a3d42]'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isAr ? 'English' : 'العربية'}
              </button>
              <button 
                onClick={toggleTheme} 
                className={`border text-[11px] font-bold px-3 py-1.5 rounded-full cursor-pointer transition-all select-none ${
                  theme === 'bento' 
                    ? 'bg-slate-100 border-slate-200 text-slate-705 hover:bg-slate-200' 
                    : theme === 'luxury'
                    ? 'bg-[#152e32] border-[#244f55]/85 text-[#87a3a6] hover:bg-[#1a3d42]'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {theme === 'bento' ? '🌙' : '☀️'}
              </button>
            </div>

            {/* Mobile/Tablet Menu Button */}
            <button
              onClick={() => setIsMobileOpen(p => !p)}
              className={`p-2 rounded-xl border md:hidden transition-all duration-200 ${
                theme === 'bento'
                  ? 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
                  : theme === 'luxury'
                  ? 'bg-[#152e32] border-[#244f55]/80 text-[#fdfcfb] hover:bg-[#1a3d42]'
                  : 'bg-[#1c2942]/60 border-[#2d3a54]/50 text-[#f1f5f9] hover:bg-slate-800'
              }`}
              aria-label="Toggle menu"
            >
              {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
            {activeTab === 'advanced' && (
              <AdvancedPage data={dashboardData} lang={lang} theme={theme} />
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
          currentData={dashboardData}
          onDeleteMonthYear={deleteMonthAndYear}
          onUndoLastAction={undoLastAction}
          hasBackup={hasBackup}
          onResetFactory={resetToFactoryData}
        />
      )}
    </div>
  );
}
