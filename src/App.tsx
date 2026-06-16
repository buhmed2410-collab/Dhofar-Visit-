import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { UploadModal } from './components/UploadModal';
import { Menu, X, Download } from 'lucide-react';
import { INITIAL_DATA, WILAYAT_AR } from './data';
import { DashboardData, LangType, ThemeType, PageType } from './types';
import { themeStyles } from './theme';
import { HealthInfoLogo } from './components/HealthInfoLogo';
import { jsPDF } from 'jspdf';
import { pct, mName } from './utils';

// OKLCH/OKLAB CSS converters to fix canvas export compatibility
function oklchToRgb(l: number, c: number, h: number, alpha?: string): string {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  let r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  let b_ = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076216850 * s3;

  const f = (x: number) => {
    if (x <= 0.0031308) return 12.92 * x;
    return 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  };

  r = Math.max(0, Math.min(1, f(r)));
  g = Math.max(0, Math.min(1, f(g)));
  b_ = Math.max(0, Math.min(1, f(b_)));

  const r255 = Math.round(r * 255);
  const g255 = Math.round(g * 255);
  const b255 = Math.round(b_ * 255);

  if (alpha !== undefined && alpha !== null && alpha !== '') {
    return `rgba(${r255}, ${g255}, ${b255}, ${alpha})`;
  }
  return `rgb(${r255}, ${g255}, ${b255})`;
}

function oklabToRgb(l: number, a: number, b: number, alpha?: string): string {
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  let r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  let b_ = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076216850 * s3;

  const f = (x: number) => {
    if (x <= 0.0031308) return 12.92 * x;
    return 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  };

  r = Math.max(0, Math.min(1, f(r)));
  g = Math.max(0, Math.min(1, f(g)));
  b_ = Math.max(0, Math.min(1, f(b_)));

  const r255 = Math.round(r * 255);
  const g255 = Math.round(g * 255);
  const b255 = Math.round(b_ * 255);

  if (alpha !== undefined && alpha !== null && alpha !== '') {
    return `rgba(${r255}, ${g255}, ${b255}, ${alpha})`;
  }
  return `rgb(${r255}, ${g255}, ${b255})`;
}

function replaceOklchInCss(cssText: string): string {
  let pos = 0;
  while (true) {
    const startIdx = cssText.indexOf('oklch(', pos);
    if (startIdx === -1) break;

    let depth = 1;
    let endIdx = -1;
    for (let i = startIdx + 6; i < cssText.length; i++) {
      if (cssText[i] === '(') depth++;
      else if (cssText[i] === ')') depth--;

      if (depth === 0) {
        endIdx = i;
        break;
      }
    }

    if (endIdx === -1) {
      pos = startIdx + 6;
      continue;
    }

    const fullMatch = cssText.substring(startIdx, endIdx + 1);
    const inner = cssText.substring(startIdx + 6, endIdx).trim();

    const parts = inner.split('/');
    const lchPart = parts[0].trim();
    const alphaPart = parts[1] ? parts[1].trim() : undefined;

    const lchValues = lchPart.split(/[\s,]+/).filter(Boolean);
    if (lchValues.length >= 3) {
      const lStr = lchValues[0].trim();
      const cStr = lchValues[1].trim();
      const hStr = lchValues[2].trim();

      const l = lStr === 'none' ? 0 : (lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr));
      const c = cStr === 'none' ? 0 : (cStr.endsWith('%') ? parseFloat(cStr) / 100 : parseFloat(cStr));
      const h = hStr === 'none' ? 0 : (hStr.endsWith('%') ? parseFloat(hStr) / 100 : parseFloat(hStr));

      if (!isNaN(l) && !isNaN(c) && !isNaN(h)) {
        let alpha = '1';
        if (alphaPart) {
          if (alphaPart.includes('var(')) {
            alpha = '0.9';
          } else {
            alpha = alphaPart;
          }
        }
        
        try {
          const rgbString = oklchToRgb(l, c, h, alpha);
          cssText = cssText.substring(0, startIdx) + rgbString + cssText.substring(endIdx + 1);
          pos = startIdx + rgbString.length;
          continue;
        } catch (e) {
          // ignore
        }
      }
    }

    const fallback = 'rgb(100, 100, 100)';
    cssText = cssText.substring(0, startIdx) + fallback + cssText.substring(endIdx + 1);
    pos = startIdx + fallback.length;
  }

  return cssText;
}

function replaceOklabInCss(cssText: string): string {
  let pos = 0;
  while (true) {
    const startIdx = cssText.indexOf('oklab(', pos);
    if (startIdx === -1) break;

    let depth = 1;
    let endIdx = -1;
    for (let i = startIdx + 6; i < cssText.length; i++) {
      if (cssText[i] === '(') depth++;
      else if (cssText[i] === ')') depth--;

      if (depth === 0) {
        endIdx = i;
        break;
      }
    }

    if (endIdx === -1) {
      pos = startIdx + 6;
      continue;
    }

    const fullMatch = cssText.substring(startIdx, endIdx + 1);
    const inner = cssText.substring(startIdx + 6, endIdx).trim();

    const parts = inner.split('/');
    const labPart = parts[0].trim();
    const alphaPart = parts[1] ? parts[1].trim() : undefined;

    const labValues = labPart.split(/[\s,]+/).filter(Boolean);
    if (labValues.length >= 3) {
      const lStr = labValues[0].trim();
      const aStr = labValues[1].trim();
      const bStr = labValues[2].trim();

      const l = lStr === 'none' ? 0 : (lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr));
      const a = aStr === 'none' ? 0 : (aStr.endsWith('%') ? parseFloat(aStr) / 100 : parseFloat(aStr));
      const b = bStr === 'none' ? 0 : (bStr.endsWith('%') ? parseFloat(bStr) / 100 : parseFloat(bStr));

      if (!isNaN(l) && !isNaN(a) && !isNaN(b)) {
        let alpha = '1';
        if (alphaPart) {
          if (alphaPart.includes('var(')) {
            alpha = '0.9';
          } else {
            alpha = alphaPart;
          }
        }
        
        try {
          const rgbString = oklabToRgb(l, a, b, alpha);
          cssText = cssText.substring(0, startIdx) + rgbString + cssText.substring(endIdx + 1);
          pos = startIdx + rgbString.length;
          continue;
        } catch (e) {
          // ignore
        }
      }
    }

    const fallback = 'rgb(100, 100, 100)';
    cssText = cssText.substring(0, startIdx) + fallback + cssText.substring(endIdx + 1);
    pos = startIdx + fallback.length;
  }

  return cssText;
}

function replaceOklchAndOklabInCss(cssText: string): string {
  cssText = replaceOklchInCss(cssText);
  cssText = replaceOklabInCss(cssText);
  return cssText;
}

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

  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    const originalStylesheets: { element: HTMLStyleElement; originalText: string }[] = [];
    const temporaryStylesheets: HTMLStyleElement[] = [];
    const disabledLinkStylesheets: HTMLLinkElement[] = [];
    const temporarySpans: { select: HTMLSelectElement; span: HTMLSpanElement }[] = [];
    let pdfOverrideStyle: HTMLStyleElement | null = null;

    const originalGetComputedStyle = window.getComputedStyle;
    const originalDefaultViewGetComputedStyle = document.defaultView ? document.defaultView.getComputedStyle : undefined;

    try {
      const element = document.getElementById("active-tab-content-to-export");
      if (!element) return;

      // Translate modern oklch/oklab styles dynamically to prevent failure in html2canvas library
      const patchedGetComputedStyle = function (this: any, el: any, pseudoEl: any) {
        const originalStyle = originalGetComputedStyle(el, pseudoEl);
        return new Proxy(originalStyle, {
          get(target, prop) {
            const val = Reflect.get(target, prop);
            if (typeof val === 'function') {
              return val.bind(target);
            }
            if (typeof val === 'string') {
              return replaceOklchAndOklabInCss(val);
            }
            return val;
          }
        });
      };

      window.getComputedStyle = patchedGetComputedStyle as any;
      if (document.defaultView) {
        document.defaultView.getComputedStyle = patchedGetComputedStyle as any;
      }

      // 1. Process style tags
      const styleElements = Array.from(document.querySelectorAll('style'));
      for (const styleEl of styleElements) {
        const text = styleEl.textContent || '';
        if (text.includes('oklch(') || text.includes('oklab(')) {
          originalStylesheets.push({
            element: styleEl,
            originalText: text
          });
          styleEl.textContent = replaceOklchAndOklabInCss(text);
        }
      }

      // 2. Process link tags
      const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
      for (const linkEl of linkElements) {
        try {
          const href = linkEl.href;
          if (href) {
            const response = await fetch(href);
            const cssText = await response.text();
            if (cssText.includes('oklch(') || cssText.includes('oklab(')) {
              const patchedCss = replaceOklchAndOklabInCss(cssText);
              const tempStyleEl = document.createElement('style');
              tempStyleEl.setAttribute('id', 'temp-purged-oklch-style-app');
              tempStyleEl.textContent = patchedCss;
              document.head.appendChild(tempStyleEl);
              temporaryStylesheets.push(tempStyleEl);

              linkEl.disabled = true;
              disabledLinkStylesheets.push(linkEl);
            }
          }
        } catch (e) {
          console.warn("Failed to fetch/preprocess external stylesheet for PDF render:", linkEl.href, e);
        }
      }

      // 3. Inject strict PDF Layout Expansion Stylesheet
      pdfOverrideStyle = document.createElement('style');
      pdfOverrideStyle.setAttribute('id', 'temp-pdf-export-layout-expansion-rules');
      pdfOverrideStyle.textContent = `
        /* Force container to wide layout to fit everything and prevent column folding/truncations */
        #active-tab-content-to-export {
          width: 1240px !important;
          max-width: none !important;
          min-width: 1240px !important;
          box-sizing: border-box !important;
          padding: 24px !important;
        }
        /* Completely eliminate scrollbars and expand the elements of lists, tables or charts to be fully visible */
        #active-tab-content-to-export .overflow-y-auto,
        #active-tab-content-to-export .overflow-x-auto,
        #active-tab-content-to-export [class*="overflow-"] {
          overflow: visible !important;
          max-height: none !important;
          min-height: none !important;
        }
        /* Force Recharts containers to have explicit dimensions during html2canvas render to ensure crisp text and layouts */
        #active-tab-content-to-export .recharts-responsive-container {
          width: 100% !important;
          min-width: 550px !important;
          height: 320px !important;
          min-height: 320px !important;
        }
        /* Overrule ellipsis truncation for hospital lists and other fields */
        #active-tab-content-to-export .truncate,
        #active-tab-content-to-export [class*="truncate"] {
          white-space: normal !important;
          overflow: visible !important;
          max-width: none !important;
          text-overflow: unset !important;
        }
        /* Ensure table content has full width without overflow restrictions */
        #active-tab-content-to-export table {
          width: 100% !important;
          table-layout: auto !important;
        }
        /* Clean up filters select display */
        #active-tab-content-to-export select {
          display: none !important;
        }
      `;
      document.head.appendChild(pdfOverrideStyle);

      // Replace all selects inside the container with clean, high-contrast HTML badges so html2canvas renders them perfectly
      const selectElements = Array.from(element.querySelectorAll('select')) as HTMLSelectElement[];
      for (const selectEl of selectElements) {
        const span = document.createElement('span');
        const selectedOption = selectEl.options[selectEl.selectedIndex];
        span.textContent = selectedOption ? selectedOption.text : '';
        
        const computed = window.getComputedStyle(selectEl);
        const isBentoTheme = theme === 'bento';
        
        // Premium, high-contrast, beautiful badges depending on active theme
        if (isBentoTheme) {
          span.style.color = '#0369a1'; // Sky-700
          span.style.backgroundColor = '#f0f9ff'; // Sky-50
          span.style.border = '1px solid #b3e0ff';
        } else {
          span.style.color = '#38bdf8'; // Sky-400
          span.style.backgroundColor = 'rgba(56, 189, 248, 0.15)'; 
          span.style.border = '1px solid rgba(56, 189, 248, 0.3)';
        }
        
        span.style.display = 'inline-block';
        span.style.fontSize = '11px';
        span.style.fontWeight = '900';
        span.style.borderRadius = '6px';
        span.style.padding = '3.5px 9px';
        span.style.margin = '0 4px';
        span.style.fontFamily = computed.fontFamily || 'Inter, sans-serif';
        span.className = 'select-badge-pdf-export';
        
        selectEl.style.display = 'none';
        selectEl.parentNode?.insertBefore(span, selectEl);
        temporarySpans.push({ select: selectEl, span });
      }

      const html2canvas = (await import('html2canvas')).default;

      // Temporarily hide the export bar group so it's not captured in the PDF report
      const exportGroup = document.getElementById("export-action-buttons-group");
      if (exportGroup) {
        exportGroup.style.display = "none";
      }

      const canvas = await html2canvas(element, {
        scale: 2, // High clarity without causing rendering speed bottleneck
        useCORS: true,
        allowTaint: true,
        backgroundColor: theme === 'immersive' ? '#0b1329' : theme === 'luxury' ? '#0d1315' : '#ffffff',
        logging: false
      });

      if (exportGroup) {
        exportGroup.style.display = "";
      }

      const imgData = canvas.toDataURL("image/png");

      const pdfWidth = 210; // A4 standard width in mm
      const pdfHeight = 297; // A4 standard height in mm
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const canvasRatio = canvasWidth / canvasHeight;
      const pageRatio = pdfWidth / pdfHeight;
      
      let imgWidth = pdfWidth;
      let imgHeight = pdfHeight;
      
      // Calculate portrait-fitted dimensions inside standard A4 so it fits into EXACTLY 1 PAGE ONLY
      if (canvasRatio > pageRatio) {
        imgWidth = pdfWidth - 10; // Left & right horizontal margins of 5mm
        imgHeight = imgWidth / canvasRatio;
      } else {
        imgHeight = pdfHeight - 10; // Top & bottom vertical margins of 5mm
        imgWidth = imgHeight * canvasRatio;
      }
      
      // Perfectly center on exactly one PDF standard A4 page
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;

      const doc = new jsPDF("p", "mm", "a4");
      doc.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
      doc.save(`dhofar_${activeTab}_report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("PDF Export failed:", err);
    } finally {
      window.getComputedStyle = originalGetComputedStyle;
      if (document.defaultView && originalDefaultViewGetComputedStyle) {
        document.defaultView.getComputedStyle = originalDefaultViewGetComputedStyle;
      }

      const exportGroup = document.getElementById("export-action-buttons-group");
      if (exportGroup) {
        exportGroup.style.display = "";
      }

      // Remove PDF custom design rulesets
      if (pdfOverrideStyle && pdfOverrideStyle.parentNode) {
        pdfOverrideStyle.parentNode.removeChild(pdfOverrideStyle);
      }

      // Restore all select elements
      for (const item of temporarySpans) {
        item.select.style.display = '';
        if (item.span.parentNode) {
          item.span.parentNode.removeChild(item.span);
        }
      }

      for (const { element, originalText } of originalStylesheets) {
        element.textContent = originalText;
      }
      for (const tempStyleEl of temporaryStylesheets) {
        if (tempStyleEl.parentNode) {
          tempStyleEl.parentNode.removeChild(tempStyleEl);
        }
      }
      for (const linkEl of disabledLinkStylesheets) {
        linkEl.disabled = false;
      }
      setIsExportingPDF(false);
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
          
          {/* EXPORT DATA & REPORTS ACTION BAR */}
          <div 
            id="export-action-buttons-group" 
            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm transition-all ${currentThemeStyles.innerCardBg} ${currentThemeStyles.selectBorder || 'border-slate-200/20'}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-500">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-xs font-black md:text-sm ${currentThemeStyles.textMain}`}>
                  {isAr ? 'مركز تصدير التقارير والبيانات' : 'Data & Reports Export Center'}
                </h3>
                <p className={`text-[10px] md:text-xs mt-0.5 ${currentThemeStyles.textMuted}`}>
                  {isAr ? 'اطبع التقرير الحالي للصفحة النشطة كملف PDF متناسق ومطابق لصفحة واحدة بكامل التفاصيل والرسوم.' : 'Print the active dashboard view as a tailored 1-page PDF report with full clarity and details.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* PDF BUTTON */}
              <button 
                id="export-pdf-button"
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 cursor-pointer bg-sky-600 hover:bg-sky-700 text-white text-xs font-black px-4 py-2 rounded-lg transition-all shadow-md shadow-sky-600/10 ${isExportingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Download className="w-4 h-4" />
                <span>{isExportingPDF ? (isAr ? 'جاري التصدير...' : 'Exporting...') : (isAr ? 'تصدير كتقرير PDF' : 'Export PDF Report')}</span>
              </button>
            </div>
          </div>

          {/* THEMATIC PAGES RENDER GRID */}
          <div id="active-tab-content-to-export" className={`p-4 md:p-5 rounded-xl ${currentThemeStyles.cardBg} transition-all duration-300 shadow-sm`}>
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
