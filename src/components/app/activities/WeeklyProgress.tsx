'use client';
import React from 'react';
import { Card } from '@/components/app/ui/Card';
import { Check, Clock, X } from 'lucide-react';

export const WeeklyProgress = ({ days, completedCount, onDayClick, isPreview = false }: { days: any[], completedCount: number, onDayClick?: (dayIndex: number) => void, isPreview?: boolean }) => {
    const iconSize = 16;
    const dayNameFontSize = 'text-[9px]';

    const DayComponent = onDayClick && isPreview ? 'button' : 'div';

    return (
        <Card className="mb-8 bg-gradient-to-br from-[#151515] to-black relative overflow-hidden">
            <div className="relative z-10">
                <h3 className="font-bold text-white mb-4 text-base">Sua Jornada Semanal</h3>
                <div className="flex justify-between items-center gap-1.5 sm:gap-3">
                    {days.map(({ dayName, status }, index) => {
                        let Icon: React.ElementType | null = null;
                        let iconClass = "text-zinc-600";
                        let bgClass = "bg-zinc-800/50 border-zinc-700/50";
                        
                        if (status === 'completed') {
                            Icon = Check;
                            iconClass = "text-emerald-400";
                            bgClass = "bg-emerald-500/10 border-emerald-500/30";
                        } else if (status === 'missed') {
                            Icon = X;
                            iconClass = "text-red-500";
                            bgClass = "bg-red-500/10 border-red-500/20";
                        } else if (status === 'compensated') {
                            bgClass = "bg-zinc-800/30 border-zinc-700/30";
                        } else if (status === 'today') {
                            bgClass = "bg-indigo-500/20 border-indigo-500/50";
                            iconClass = "text-indigo-400";
                            Icon = Clock;
                        }

                        const dayContent = (
                            <>
                                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center border transition-all ${bgClass}`}>
                                    {Icon && <Icon size={iconSize} className={iconClass}/>}
                                </div>
                                <span className={`${dayNameFontSize} font-bold uppercase ${status === 'upcoming' || status === 'compensated' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                    {dayName}
                                </span>
                            </>
                        );

                        return (
                            <DayComponent 
                                key={dayName} 
                                className="flex flex-col items-center gap-2"
                                onClick={() => onDayClick && isPreview && onDayClick(index)}
                            >
                                {dayContent}
                            </DayComponent>
                        );
                    })}
                </div>
                 <p className="text-zinc-500 text-xs mt-4 text-center font-medium">{completedCount}/5 dias concluídos</p>
            </div>
        </Card>
    )
}
