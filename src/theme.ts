import { ThemeType } from './types';

export interface ThemeColors {
  appBg: string;
  headerBg: string;
  headerText: string;
  headerDesc: string;
  
  // Card/Container Classes (High Density, crisp borders, tailored shadows)
  cardBg: string;       // main card wrapper
  subCardBg: string;    // sub wrapper
  innerCardBg: string;  // individual highlight card
  
  // Text coloring
  textMain: string;
  textMuted: string;
  
  // Action buttons & Select inputs
  selectBg: string;
  selectOptionBg: string;
  selectText: string;
  selectBorder: string;

  // Tables
  tableThBg: string;
  tableThText: string;
  tableTdBorder: string;
  tableRowHover: string;
  
  // Accent borders
  border: string;
  accentLine: string;

  // Charts
  tooltipBg: string;
  tooltipBorder: string;
  tooltipColor: string;
  gridStroke: string;
}

export const themeStyles: Record<ThemeType, ThemeColors> = {
  immersive: {
    appBg: 'bg-[#090d16] text-[#e2e8f0] transition-colors duration-300 font-sans',
    headerBg: 'bg-[#090d16]/80 border-b border-[#1e293b]/70 backdrop-blur-md',
    headerText: 'text-white',
    headerDesc: 'text-slate-400',
    cardBg: 'bg-[#0f172a] border border-[#1e293b] shadow-sm shadow-[#020617] rounded-xl p-5',
    subCardBg: 'bg-[#151f38] border border-white/5 shadow-2xl shadow-black/80',
    innerCardBg: 'bg-[#1c2942]/60 border border-[#2d3a54]/50 hover:border-sky-500/30 transition-all duration-200 rounded-xl p-4',
    textMain: 'text-[#f1f5f9]',
    textMuted: 'text-[#94a3b8]',
    selectBg: 'bg-[#1c2942]/80 border border-[#2d3a54]/60',
    selectOptionBg: 'bg-[#0f172a] text-slate-200',
    selectText: 'text-slate-100',
    selectBorder: 'border-slate-700/60',
    tableThBg: 'bg-[#1c2942]/50 text-[#94a3b8]',
    tableThText: 'text-xs text-[#94a3b8] font-bold uppercase tracking-wider',
    tableTdBorder: 'border-[#1e293b]/70',
    tableRowHover: 'hover:bg-[#1a2b4c]/30',
    border: 'border-[#1e293b]',
    accentLine: 'bg-gradient-to-r from-sky-400 to-indigo-500',
    tooltipBg: '#0f172a',
    tooltipBorder: '#1e293b',
    tooltipColor: '#f1f5f9',
    gridStroke: 'rgba(255,255,255,0.04)'
  },
  bento: {
    appBg: 'bg-[#f8fafc] text-[#0f172a] transition-colors duration-300 font-sans',
    headerBg: 'bg-white/95 border-b border-slate-200/90 shadow-sm',
    headerText: 'text-slate-900',
    headerDesc: 'text-slate-500',
    cardBg: 'bg-white border border-slate-200 shadow-xs rounded-xl p-5',
    subCardBg: 'bg-white border border-slate-200 shadow-sm shadow-slate-200/40',
    innerCardBg: 'bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition-all duration-200 rounded-xl p-4',
    textMain: 'text-slate-900',
    textMuted: 'text-slate-500',
    selectBg: 'bg-slate-100/80 border border-slate-200',
    selectOptionBg: 'bg-white text-slate-800',
    selectText: 'text-slate-800',
    selectBorder: 'border-slate-200',
    tableThBg: 'bg-[#f8fafc]/90 text-slate-550',
    tableThText: 'text-xs text-slate-500 font-bold uppercase tracking-wider',
    tableTdBorder: 'border-slate-200/85',
    tableRowHover: 'hover:bg-slate-100/50',
    border: 'border-slate-200',
    accentLine: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    tooltipBg: '#ffffff',
    tooltipBorder: '#cbd5e1',
    tooltipColor: '#0f172a',
    gridStroke: 'rgba(15,23,42,0.05)'
  },
  luxury: {
    appBg: 'bg-[#080d0e] text-[#f8fafc] transition-colors duration-300 font-sans',
    headerBg: 'bg-[#0e2124]/95 border-b border-[#1f3f44]/80 shadow-md',
    headerText: 'text-[#fdfcfb]',
    headerDesc: 'text-[#87a3a6]',
    cardBg: 'bg-[#112326] border border-[#244f55]/85 shadow-md shadow-black/80 rounded-xl p-5',
    subCardBg: 'bg-[#13292c] border border-white/5 shadow-2xl shadow-black/80',
    innerCardBg: 'bg-[#152e32] border border-[#244f55]/80 hover:border-[#356f77] transition-all duration-200 rounded-xl p-4',
    textMain: 'text-[#fdfcfb]',
    textMuted: 'text-[#87a3a6]',
    selectBg: 'bg-[#112326]/80 border border-[#244f55]/80',
    selectOptionBg: 'bg-[#112326] text-[#f8fafc]',
    selectText: 'text-[#fdfcfb]',
    selectBorder: 'border-[#244f55]/80',
    tableThBg: 'bg-[#152e32]/80 text-[#87a3a6]',
    tableThText: 'text-xs text-[#87a3a6] font-bold uppercase tracking-wider',
    tableTdBorder: 'border-[#1f3f44]/80',
    tableRowHover: 'hover:bg-[#1a3d42]/30',
    border: 'border-[#1f3f44]',
    accentLine: 'bg-gradient-to-r from-amber-500 to-emerald-600',
    tooltipBg: '#112224',
    tooltipBorder: '#234448',
    tooltipColor: '#fdfcfb',
    gridStroke: 'rgba(255,255,255,0.03)'
  }
};
