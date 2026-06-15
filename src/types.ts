export interface WilayatData {
  [wilayatName: string]: number;
}

export interface YearData {
  [year: string]: number;
}

export interface MonthData {
  [month: string]: number;
}

export interface EncounterData {
  OPD: number;
  ANE: number;
  COMMUNITY: number;
}

export interface ShiftData {
  '1ST SHIFT (MORNING)': number;
  '2nd SHIFT (AFTERNOON)': number;
  '3RD SHIFT (NIGHT)': number;
}

export interface HolidayData {
  'WORKING DAY': number;
  'HOLIDAY': number;
}

export interface NestedWilayatYear {
  [wilayat: string]: YearData;
}

export interface NestedWilayatEncounter {
  [wilayat: string]: Partial<EncounterData>;
}

export interface NestedWilayatShift {
  [wilayat: string]: Partial<ShiftData>;
}

export interface NestedWilayatHoliday {
  [wilayat: string]: Partial<HolidayData>;
}

export interface NestedWilayatEstab {
  [wilayat: string]: {
    [establishment: string]: number;
  };
}

export interface NestedEstabYear {
  [establishment: string]: YearData;
}

export interface NestedEstabEncounter {
  [establishment: string]: Partial<EncounterData>;
}

export interface NestedEstabShift {
  [establishment: string]: Partial<ShiftData>;
}

export interface NestedEstabHoliday {
  [establishment: string]: Partial<HolidayData>;
}

export interface NestedEstabMonth {
  [establishment: string]: MonthData;
}

export interface NestedWilayatMonth {
  [wilayat: string]: MonthData;
}

export interface NestedYearMonth {
  [year: string]: MonthData;
}

export interface NestedWilayatYearMonth {
  [wilayat: string]: {
    [year: string]: MonthData;
  };
}

export interface NestedEstabYearMonth {
  [establishment: string]: {
    [year: string]: MonthData;
  };
}

export interface NestedWilayatEncYear {
  [wilayat: string]: {
    OPD?: YearData;
    ANE?: YearData;
    COMMUNITY?: YearData;
  };
}

export interface NestedEstabEncYear {
  [establishment: string]: {
    OPD?: YearData;
    ANE?: YearData;
    COMMUNITY?: YearData;
  };
}

export interface NestedWilayatShiftYear {
  [wilayat: string]: {
    '1ST SHIFT (MORNING)'?: YearData;
    '2nd SHIFT (AFTERNOON)'?: YearData;
    '3RD SHIFT (NIGHT)'?: YearData;
  };
}

export interface NestedEstabShiftYear {
  [establishment: string]: {
    '1ST SHIFT (MORNING)'?: YearData;
    '2nd SHIFT (AFTERNOON)'?: YearData;
    '3RD SHIFT (NIGHT)'?: YearData;
  };
}

export interface NestedWilayatHolidayYear {
  [wilayat: string]: {
    'WORKING DAY'?: YearData;
    'HOLIDAY'?: YearData;
  };
}

export interface NestedEstabHolidayYear {
  [establishment: string]: {
    'WORKING DAY'?: YearData;
    'HOLIDAY'?: YearData;
  };
}

export interface NestedYearMonthShift {
  [year: string]: {
    [month: string]: {
      '1ST SHIFT (MORNING)'?: number;
      '2nd SHIFT (AFTERNOON)'?: number;
      '3RD SHIFT (NIGHT)'?: number;
    };
  };
}

export interface NestedWilayatYearMonthShift {
  [wilayat: string]: {
    [year: string]: {
      [month: string]: {
        '1ST SHIFT (MORNING)'?: number;
        '2nd SHIFT (AFTERNOON)'?: number;
        '3RD SHIFT (NIGHT)'?: number;
      };
    };
  };
}

export interface DashboardData {
  total: number;
  by_wilayat: WilayatData;
  by_year: YearData;
  by_month: MonthData;
  by_enc: EncounterData;
  by_shift: ShiftData;
  by_holiday: HolidayData;
  
  by_wil_year: NestedWilayatYear;
  by_wil_enc: NestedWilayatEncounter;
  by_wil_shift: NestedWilayatShift;
  by_wil_holiday: NestedWilayatHoliday;
  by_wil_estab: NestedWilayatEstab;
  
  by_estab_year: NestedEstabYear;
  by_estab_enc: NestedEstabEncounter;
  by_estab_shift: NestedEstabShift;
  by_estab_holiday: NestedEstabHoliday;
  by_estab_month: NestedEstabMonth;
  
  by_wil_month: NestedWilayatMonth;
  by_year_month: NestedYearMonth;
  by_wil_year_month: NestedWilayatYearMonth;
  by_estab_year_month: NestedEstabYearMonth;
  
  by_wil_enc_year: NestedWilayatEncYear;
  by_estab_enc_year: NestedEstabEncYear;
  
  by_wil_shift_year: NestedWilayatShiftYear;
  by_estab_shift_year: NestedEstabShiftYear;
  
  by_wil_holiday_year: NestedWilayatHolidayYear;
  by_estab_holiday_year: NestedEstabHolidayYear;

  by_year_month_shift: NestedYearMonthShift;
  by_wil_year_month_shift: NestedWilayatYearMonthShift;
}

export type ThemeType = 'immersive' | 'bento' | 'luxury';
export type LangType = 'ar' | 'en';
export type PageType = 'overview' | 'wilayat' | 'estab' | 'visit' | 'year' | 'month' | 'workday' | 'advanced';
