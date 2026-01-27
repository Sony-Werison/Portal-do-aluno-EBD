import React from 'react';

export const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-[#0A0A0A]/60 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-4 sm:p-6 shadow-2xl shadow-black/50 ${className}`}>
      {children}
    </div>
);
