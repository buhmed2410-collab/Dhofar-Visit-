import { DashboardData } from './types';
import { WILAYAT_AR, MONTHS_AR, MONTHS_EN } from './data';

export function fmt(n: number | undefined): string {
  if (n === undefined || isNaN(n)) return '0';
  return n.toLocaleString('en-US');
}

export function pct(n: number | undefined, total: number | undefined): string {
  if (!n || !total) return '0.0%';
  return ((n / total) * 100).toFixed(1) + '%';
}

export function wName(w: string, lang: 'ar' | 'en'): string {
  if (lang === 'ar') {
    return WILAYAT_AR[w] || w;
  }
  return w.replace('SHALIM WA JUZUR AL HALLANIYAT', 'SHALIM & AL HALLANIYAT');
}

export function mName(m: number, lang: 'ar' | 'en'): string {
  return lang === 'ar' ? MONTHS_AR[m] : MONTHS_EN[m];
}

export function getAvailableYears(data: DashboardData): string[] {
  return Object.keys(data.by_year).sort();
}

export interface ResolvedScope {
  total: number;
  shift: {
    '1ST SHIFT (MORNING)': number;
    '2nd SHIFT (AFTERNOON)': number;
    '3RD SHIFT (NIGHT)': number;
  };
  holiday: {
    'WORKING DAY': number;
    'HOLIDAY': number;
  };
  enc: {
    OPD: number;
    ANE: number;
    COMMUNITY: number;
  };
  wils: string[];
  wilEnc: Record<string, { OPD: number; ANE: number; COMMUNITY: number }> | null;
}

export function resolveScope(
  data: DashboardData,
  wilF: string,
  estabF: string,
  yearF: string
): ResolvedScope {
  const wils = wilF === 'ALL' ? Object.keys(data.by_wilayat) : [wilF];
  let total = 0;
  const shift = { '1ST SHIFT (MORNING)': 0, '2nd SHIFT (AFTERNOON)': 0, '3RD SHIFT (NIGHT)': 0 };
  const holiday = { 'WORKING DAY': 0, 'HOLIDAY': 0 };
  const enc = { OPD: 0, ANE: 0, COMMUNITY: 0 };

  if (estabF !== 'ALL') {
    // Single establishment
    if (yearF !== 'ALL') {
      total = data.by_estab_year[estabF]?.[yearF] || 0;
      
      const sy = data.by_estab_shift_year[estabF] || {};
      shift['1ST SHIFT (MORNING)'] = sy['1ST SHIFT (MORNING)']?.[yearF] || 0;
      shift['2nd SHIFT (AFTERNOON)'] = sy['2nd SHIFT (AFTERNOON)']?.[yearF] || 0;
      shift['3RD SHIFT (NIGHT)'] = sy['3RD SHIFT (NIGHT)']?.[yearF] || 0;

      const hy = data.by_estab_holiday_year[estabF] || {};
      holiday['WORKING DAY'] = hy['WORKING DAY']?.[yearF] || 0;
      holiday['HOLIDAY'] = hy['HOLIDAY']?.[yearF] || 0;

      const ey = data.by_estab_enc_year[estabF] || {};
      enc.OPD = ey.OPD?.[yearF] || 0;
      enc.ANE = ey.ANE?.[yearF] || 0;
      enc.COMMUNITY = ey.COMMUNITY?.[yearF] || 0;
    } else {
      total = Object.values(data.by_estab_year[estabF] || {}).reduce((a, b) => a + b, 0);
      
      const s = data.by_estab_shift[estabF] || {};
      shift['1ST SHIFT (MORNING)'] = s['1ST SHIFT (MORNING)'] || 0;
      shift['2nd SHIFT (AFTERNOON)'] = s['2nd SHIFT (AFTERNOON)'] || 0;
      shift['3RD SHIFT (NIGHT)'] = s['3RD SHIFT (NIGHT)'] || 0;

      const h = data.by_estab_holiday[estabF] || {};
      holiday['WORKING DAY'] = h['WORKING DAY'] || 0;
      holiday['HOLIDAY'] = h['HOLIDAY'] || 0;

      const e = data.by_estab_enc[estabF] || {};
      enc.OPD = e.OPD || 0;
      enc.ANE = e.ANE || 0;
      enc.COMMUNITY = e.COMMUNITY || 0;
    }
    return { total, shift, holiday, enc, wils, wilEnc: null };
  } else if (wilF !== 'ALL') {
    // Single wilayat
    if (yearF !== 'ALL') {
      total = data.by_wil_year[wilF]?.[yearF] || 0;

      const sy = data.by_wil_shift_year[wilF] || {};
      shift['1ST SHIFT (MORNING)'] = sy['1ST SHIFT (MORNING)']?.[yearF] || 0;
      shift['2nd SHIFT (AFTERNOON)'] = sy['2nd SHIFT (AFTERNOON)']?.[yearF] || 0;
      shift['3RD SHIFT (NIGHT)'] = sy['3RD SHIFT (NIGHT)']?.[yearF] || 0;

      const hy = data.by_wil_holiday_year[wilF] || {};
      holiday['WORKING DAY'] = hy['WORKING DAY']?.[yearF] || 0;
      holiday['HOLIDAY'] = hy['HOLIDAY']?.[yearF] || 0;

      const ey = data.by_wil_enc_year[wilF] || {};
      enc.OPD = ey.OPD?.[yearF] || 0;
      enc.ANE = ey.ANE?.[yearF] || 0;
      enc.COMMUNITY = ey.COMMUNITY?.[yearF] || 0;
    } else {
      total = data.by_wilayat[wilF] || 0;

      const s = data.by_wil_shift[wilF] || {};
      shift['1ST SHIFT (MORNING)'] = s['1ST SHIFT (MORNING)'] || 0;
      shift['2nd SHIFT (AFTERNOON)'] = s['2nd SHIFT (AFTERNOON)'] || 0;
      shift['3RD SHIFT (NIGHT)'] = s['3RD SHIFT (NIGHT)'] || 0;

      const h = data.by_wil_holiday[wilF] || {};
      holiday['WORKING DAY'] = h['WORKING DAY'] || 0;
      holiday['HOLIDAY'] = h['HOLIDAY'] || 0;

      const e = data.by_wil_enc[wilF] || {};
      enc.OPD = e.OPD || 0;
      enc.ANE = e.ANE || 0;
      enc.COMMUNITY = e.COMMUNITY || 0;
    }
    return { total, shift, holiday, enc, wils, wilEnc: null };
  } else {
    // All wilayats
    if (yearF !== 'ALL') {
      total = data.by_year[yearF] || 0;

      Object.keys(data.by_wil_shift_year).forEach(w => {
        const sy = data.by_wil_shift_year[w] || {};
        shift['1ST SHIFT (MORNING)'] += sy['1ST SHIFT (MORNING)']?.[yearF] || 0;
        shift['2nd SHIFT (AFTERNOON)'] += sy['2nd SHIFT (AFTERNOON)']?.[yearF] || 0;
        shift['3RD SHIFT (NIGHT)'] += sy['3RD SHIFT (NIGHT)']?.[yearF] || 0;
      });

      Object.keys(data.by_wil_holiday_year).forEach(w => {
        const hy = data.by_wil_holiday_year[w] || {};
        holiday['WORKING DAY'] += hy['WORKING DAY']?.[yearF] || 0;
        holiday['HOLIDAY'] += hy['HOLIDAY']?.[yearF] || 0;
      });

      Object.keys(data.by_wil_enc_year).forEach(w => {
        const ey = data.by_wil_enc_year[w] || {};
        enc.OPD += ey.OPD?.[yearF] || 0;
        enc.ANE += ey.ANE?.[yearF] || 0;
        enc.COMMUNITY += ey.COMMUNITY?.[yearF] || 0;
      });
    } else {
      total = data.total;
      shift['1ST SHIFT (MORNING)'] = data.by_shift['1ST SHIFT (MORNING)'] || 0;
      shift['2nd SHIFT (AFTERNOON)'] = data.by_shift['2nd SHIFT (AFTERNOON)'] || 0;
      shift['3RD SHIFT (NIGHT)'] = data.by_shift['3RD SHIFT (NIGHT)'] || 0;

      holiday['WORKING DAY'] = data.by_holiday['WORKING DAY'] || 0;
      holiday['HOLIDAY'] = data.by_holiday['HOLIDAY'] || 0;

      enc.OPD = data.by_enc.OPD || 0;
      enc.ANE = data.by_enc.ANE || 0;
      enc.COMMUNITY = data.by_enc.COMMUNITY || 0;
    }

    const wilEnc: Record<string, { OPD: number; ANE: number; COMMUNITY: number }> = {};
    Object.keys(data.by_wil_enc).forEach(w => {
      if (yearF !== 'ALL') {
        const ey = data.by_wil_enc_year[w] || {};
        wilEnc[w] = {
          OPD: ey.OPD?.[yearF] || 0,
          ANE: ey.ANE?.[yearF] || 0,
          COMMUNITY: ey.COMMUNITY?.[yearF] || 0
        };
      } else {
        const e = data.by_wil_enc[w] || {};
        wilEnc[w] = {
          OPD: e.OPD || 0,
          ANE: e.ANE || 0,
          COMMUNITY: e.COMMUNITY || 0
        };
      }
    });

    return { total, shift, holiday, enc, wils, wilEnc };
  }
}

export function resolveMonthly(
  data: DashboardData,
  wilF: string,
  estabF: string,
  yearF: string
): number[] {
  const years = yearF === 'ALL' ? getAvailableYears(data) : [yearF];
  const result = Array(12).fill(0);

  if (estabF !== 'ALL') {
    years.forEach(yr => {
      for (let m = 1; m <= 12; m++) {
        result[m - 1] += data.by_estab_year_month[estabF]?.[yr]?.[String(m)] || 0;
      }
    });
  } else if (wilF !== 'ALL') {
    years.forEach(yr => {
      for (let m = 1; m <= 12; m++) {
        result[m - 1] += data.by_wil_year_month[wilF]?.[yr]?.[String(m)] || 0;
      }
    });
  } else {
    years.forEach(yr => {
      for (let m = 1; m <= 12; m++) {
        result[m - 1] += data.by_year_month[yr]?.[String(m)] || 0;
      }
    });
  }
  return result;
}
