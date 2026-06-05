import React, { useState, useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: string;
    trend?: string;
    loading?: boolean;
}

function useAnimatedCounter(target: number | string, duration = 800) {
    const [display, setDisplay] = useState<number | string>(0);
    const prevRef = useRef(0);

    useEffect(() => {
        const numTarget = typeof target === 'number' ? target : parseInt(target, 10);
        if (isNaN(numTarget)) {
            setDisplay(target);
            return;
        }

        const start = prevRef.current;
        const diff = numTarget - start;
        if (diff === 0) {
            setDisplay(numTarget);
            return;
        }

        const startTime = Date.now();

        const tick = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutCubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + diff * eased);
            setDisplay(current);

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                prevRef.current = numTarget;
            }
        };

        requestAnimationFrame(tick);
    }, [target]);

    return display;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend, loading }) => {
    const animatedValue = useAnimatedCounter(loading ? 0 : value);
    const isNumeric = typeof value === 'number' || (!isNaN(Number(value)) && value !== '');

    const getBorderColor = (colorName: string) => {
        switch (colorName) {
            case 'blue': return '#3b82f6';
            case 'green': return '#10b981';
            case 'yellow': return '#f59e0b';
            case 'purple': return '#8b5cf6';
            case 'red': return '#ef4444';
            default: return '#9ca3af';
        }
    };

    const getIconColorClass = (colorName: string) => {
        switch (colorName) {
            case 'blue': return 'text-blue-600 dark:text-blue-400';
            case 'green': return 'text-emerald-600 dark:text-emerald-400';
            case 'yellow': return 'text-amber-600 dark:text-amber-400';
            case 'purple': return 'text-violet-600 dark:text-violet-400';
            case 'red': return 'text-rose-600 dark:text-rose-400';
            default: return 'text-gray-600 dark:text-gray-400';
        }
    };

    const getBgClass = (colorName: string) => {
        switch (colorName) {
            case 'blue': return 'bg-blue-50 dark:bg-blue-950/40';
            case 'green': return 'bg-emerald-50 dark:bg-emerald-950/40';
            case 'yellow': return 'bg-amber-50 dark:bg-amber-950/40';
            case 'purple': return 'bg-violet-50 dark:bg-violet-950/40';
            case 'red': return 'bg-rose-50 dark:bg-rose-950/40';
            default: return 'bg-gray-50 dark:bg-gray-800/40';
        }
    };

    return (
        <View 
            className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-zinc-800 flex-1 min-w-[45%] m-1.5"
            style={{ borderLeftWidth: 4, borderLeftColor: getBorderColor(color) }}
        >
            <View className="flex-row justify-between items-start mb-3">
                <View className={`p-2.5 rounded-xl ${getBgClass(color)}`}>
                    <Icon size={18} className={getIconColorClass(color)} strokeWidth={2.5} />
                </View>
                {trend && (
                    <View className={`px-2 py-0.5 rounded-full ${trend.startsWith('+') ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-rose-50 dark:bg-rose-950/30'}`}>
                        <Text className={`text-[10px] font-bold ${trend.startsWith('+') ? 'text-emerald-600 dark:text-emerald-455' : 'text-rose-600 dark:text-rose-455'}`}>
                            {trend}
                        </Text>
                    </View>
                )}
            </View>

            <Text className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">{title}</Text>

            {loading ? (
                <View className="h-6 w-16 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse" />
            ) : (
                <Text className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {isNumeric ? animatedValue : value}
                </Text>
            )}
        </View>
    );
};

export default StatCard;
