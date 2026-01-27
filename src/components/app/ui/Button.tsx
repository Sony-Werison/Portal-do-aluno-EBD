'use client';
import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Loader } from 'lucide-react';
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode, 
  variant?: 'primary' | 'secondary' | 'gradient' | 'outline' | 'success' | 'destructive' | 'ghost';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  size?: 'default' | 'sm' | 'icon';
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ children, variant = "primary", className = "", disabled = false, loading = false, size = "default", asChild = false, ...props }, ref) => {
    const baseStyle = "rounded-2xl font-bold tracking-wide transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 relative overflow-hidden group";
    const sizeStyles: { [key: string]: string } = {
      default: "py-4",
      sm: "py-2 text-sm",
      icon: "p-2",
    }
    const variants: { [key: string]: string } = {
      primary: "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-transparent",
      secondary: "bg-zinc-900 text-zinc-100 border border-zinc-800",
      gradient: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-900/40 border border-white/10",
      outline: "border border-zinc-700 text-zinc-400 bg-transparent",
      success: "bg-emerald-600 text-white border border-emerald-500/50 shadow-lg shadow-emerald-900/50",
      destructive: "bg-red-600 text-white border border-red-500/50 shadow-lg shadow-red-900/50"
    };
    const selectedVariant = variants[variant!] || variants.primary;
  
    const Comp = asChild ? Slot : 'button';

    const buttonContent = (
      <>
        {variant === 'gradient' && <div className="absolute inset-0 bg-white/20 translate-y-full group-active:translate-y-0 transition-transform duration-300 blur-xl"></div>}
        <span className="relative z-10 flex items-center gap-2">{loading ? <Loader className="animate-spin" size={20} /> : children}</span>
      </>
    );
  
    return (
      <Comp 
        className={cn(baseStyle, sizeStyles[size], selectedVariant, className, (disabled || loading) ? 'opacity-50 cursor-not-allowed grayscale' : '')} 
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {asChild ? children : buttonContent}
      </Comp>
    );
});
Button.displayName = "Button";
