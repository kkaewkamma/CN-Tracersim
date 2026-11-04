import React from 'react';

interface CNLogoProps {
  size?: number;
  className?: string;
}

export const CNLogo: React.FC<CNLogoProps> = ({ size = 28, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="cnGradient" x1="2" y1="2" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00E5FF" />
          <stop offset="0.5" stopColor="#049FD9" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
        <filter id="cnGlow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Outer Rounded Container */}
      <rect x="2" y="2" width="36" height="36" rx="10" fill="#0A101D" stroke="url(#cnGradient)" strokeWidth="1.8" />
      
      {/* Inner Network Grid Matrix */}
      <circle cx="20" cy="20" r="12" stroke="#049FD9" strokeWidth="1.2" strokeOpacity="0.4" strokeDasharray="2 3" />
      
      {/* Central Routing Core */}
      <circle cx="20" cy="20" r="4.5" fill="url(#cnGradient)" />
      <circle cx="20" cy="20" r="2" fill="#0A101D" />

      {/* Network Nodes (Top, Bottom, Left, Right) */}
      <circle cx="20" cy="8.5" r="2.2" fill="#00E5FF" filter="url(#cnGlow)" />
      <circle cx="20" cy="31.5" r="2.2" fill="#00E5FF" filter="url(#cnGlow)" />
      <circle cx="8.5" cy="20" r="2.2" fill="#049FD9" />
      <circle cx="31.5" cy="20" r="2.2" fill="#049FD9" />

      {/* Telemetry Interconnect Lines */}
      <path d="M20 10.7V15.5" stroke="#00E5FF" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M20 24.5V29.3" stroke="#00E5FF" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10.7 20H15.5" stroke="#049FD9" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M24.5 20H29.3" stroke="#049FD9" strokeWidth="1.6" strokeLinecap="round" />
      
      {/* Dynamic Diagonal Wavelets */}
      <path d="M13 13L16.5 16.5" stroke="#00E5FF" strokeWidth="1.2" strokeOpacity="0.6" strokeLinecap="round" />
      <path d="M27 27L23.5 23.5" stroke="#00E5FF" strokeWidth="1.2" strokeOpacity="0.6" strokeLinecap="round" />
    </svg>
  );
};
