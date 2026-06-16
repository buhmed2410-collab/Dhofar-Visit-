import React from 'react';

interface HealthInfoLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function HealthInfoLogo({ className = '', size = 'md' }: HealthInfoLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-10',
    lg: 'w-16 h-12',
    xl: 'w-24 h-20'
  };

  const finalClass = className || sizeClasses[size];

  return (
    <svg 
      viewBox="0 0 160 100" 
      className={`${finalClass} transition-all duration-300`} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      id="health-info-logo-svg"
    >
      <defs>
        {/* Sky-blue to deep royal blue gradient for the main wave */}
        <linearGradient id="wave-gradient" x1="10" y1="50" x2="150" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e40af" /> {/* Deep Royal Blue */}
          <stop offset="35%" stopColor="#0284c7" /> {/* Sky Blue */}
          <stop offset="70%" stopColor="#0ea5e9" /> {/* Teal/Sky */}
          <stop offset="100%" stopColor="#38bdf8" /> {/* Light Cyan */}
        </linearGradient>

        <linearGradient id="circuit-grad-top" x1="60" y1="30" x2="140" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        <linearGradient id="circuit-grad-bottom" x1="60" y1="60" x2="140" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      {/* BACKGROUND GRAPHICS (SUBTLE GRID EFFECT FOR DIGITAL TECH FEEL) */}
      <g opacity="0.15">
        <circle cx="20" cy="50" r="1.5" fill="currentColor" />
        <circle cx="40" cy="50" r="1.5" fill="currentColor" />
        <circle cx="60" cy="50" r="1.5" fill="currentColor" />
        <circle cx="80" cy="50" r="1.5" fill="currentColor" />
        <circle cx="100" cy="50" r="1.5" fill="currentColor" />
        <circle cx="120" cy="50" r="1.5" fill="currentColor" />
        <circle cx="140" cy="50" r="1.5" fill="currentColor" />
      </g>

      {/* LEFT SIDE DIGITAL BLOCKS & CIRCUIT INPUTS */}
      {/* Small tech square dots & trails */}
      <rect x="8" y="46" width="4" height="4" fill="#1e3a8a" rx="0.5" />
      <rect x="16" y="38" width="5" height="5" fill="#0284c7" rx="1" />
      <rect x="16" y="56" width="5" height="5" fill="#1e40af" rx="1" />
      
      {/* Left-to-right input lines with dots */}
      <path d="M 12,50 L 32,50" stroke="url(#wave-gradient)" strokeWidth="2.5" strokeLinecap="round" />
      
      <path d="M 22,50 L 22,42 L 28,42" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="28" cy="42" r="1.5" fill="#0284c7" />

      <path d="M 26,50 L 26,58 L 32,58" stroke="#1e40af" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="32" cy="58" r="1.5" fill="#1e40af" />

      {/* CORE ECG HEARTBEAT WAVE (Continuous glowing transition line) */}
      {/* Points: Front tail (32,50) to start-flat (42,50) to dip (46,55) to peak (52,15) to trough (58,85) to secondary peak (64,38) to right-recovery (70,50) */}
      <path 
        d="M 32,50 L 42,50 L 46,56 L 52,15 L 58,85 L 64,38 L 70,50 L 78,50" 
        stroke="url(#wave-gradient)" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* RIGHT SIDE INTEGRATED CIRCUIT BOARD PATHWAYS */}
      {/* Pathway 1: Upper high branch with 45 degree tilt */}
      <path d="M 70,50 L 80,38 L 110,38" stroke="url(#circuit-grad-top)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="110" cy="38" r="2.5" fill="#0ea5e9" />
      
      {/* Pathway 1b: Splitting from upper high branch to even higher */}
      <path d="M 92,38 L 98,28 L 128,28" stroke="url(#circuit-grad-top)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="128" cy="28" r="2" fill="#38bdf8" />
      <circle cx="124" cy="28" r="4" stroke="#38bdf8" strokeWidth="0.75" fill="none" opacity="0.6" />

      {/* Pathway 2: Upper extremely high diagonal branch */}
      <path d="M 64,38 L 74,22 L 104,22" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="104" cy="22" r="3" fill="#0284c7" />
      
      {/* Pathway 3: Middle clean horizontal recovery */}
      <path d="M 78,50 L 120,50" stroke="url(#wave-gradient)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="50 50" />
      
      {/* Pathway 4: Lower branch with 45 degree tilt */}
      <path d="M 74,54 L 84,66 L 114,66" stroke="url(#circuit-grad-bottom)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="114" cy="66" r="2.5" fill="#0284c7" />
      
      {/* Pathway 4b: Splitting from lower branch to even lower */}
      <path d="M 94,66 L 100,76 L 130,76" stroke="url(#circuit-grad-bottom)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="130" cy="76" r="2.5" fill="#1e3a8a" />
      
      {/* ADDITIONAL MODERN DIGITAL ACCENTS (FLOATING BITS) */}
      {/* Squares around upper right */}
      <rect x="112" y="22" width="4" height="4" fill="#0ea5e9" rx="0.5" opacity="0.9" />
      <rect x="120" y="34" width="3" height="3" fill="#38bdf8" rx="0.5" opacity="0.8" />
      <rect x="100" y="44" width="4" height="4" fill="#0ea5e9" rx="0.5" opacity="0.7" />

      {/* Squares around lower right */}
      <rect x="120" y="62" width="4" height="4" fill="#1e3a8a" rx="0.5" opacity="0.9" />
      <rect x="108" y="74" width="5" height="5" fill="#0284c7" rx="1" opacity="0.8" />
      <rect x="124" y="80" width="3" height="3" fill="#1e40af" rx="0.5" opacity="0.7" />

      {/* Pulse/Tech concentric ring effects */}
      <circle cx="52" cy="15" r="4" stroke="#0ea5e9" strokeWidth="0.5" fill="none" opacity="0.4" />
      <circle cx="58" cy="85" r="5" stroke="#1e40af" strokeWidth="0.5" fill="none" opacity="0.3" />
    </svg>
  );
}
