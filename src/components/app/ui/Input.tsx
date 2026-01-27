'use client';
import React from 'react';

export const Input = ({ label, type = "text", value, onChange, placeholder, ...props }: { label: string, type?: string, value: string, onChange: (e: any) => void, placeholder: string, [key: string]: any }) => (
    <div className="group">
      <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ml-1 group-focus-within:text-indigo-400 transition-colors">{label}</label>
      <div className="relative">
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full bg-[#111] border border-zinc-800 rounded-xl p-4 text-zinc-100 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder-zinc-700 disabled:bg-zinc-900 disabled:opacity-70 disabled:cursor-not-allowed" {...props} />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity duration-500 -z-10 blur-sm"></div>
      </div>
    </div>
);
