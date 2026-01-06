import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: string;
    trend?: string;
    loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend, loading }) => {
    // Map color names to Tailwind colors or hex values if needed
    // For simplicity, we'll use a dynamic border color or icon color logic

    const getColorClass = (colorName: string) => {
        switch (colorName) {
            case 'blue': return 'text-blue-600';
            case 'green': return 'text-green-600';
            case 'yellow': return 'text-yellow-600';
            case 'purple': return 'text-purple-600';
            case 'red': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const getBgClass = (colorName: string) => {
        switch (colorName) {
            case 'blue': return 'bg-blue-100';
            case 'green': return 'bg-green-100';
            case 'yellow': return 'bg-yellow-100';
            case 'purple': return 'bg-purple-100';
            case 'red': return 'bg-red-100';
            default: return 'bg-gray-100';
        }
    };

    return (
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex-1 min-w-[45%] m-1">
            <View className="flex-row justify-between items-start mb-2">
                <View className={`p-2 rounded-xl ${getBgClass(color)}`}>
                    <Icon size={20} className={getColorClass(color)} strokeWidth={2.5} />
                </View>
                {trend && (
                    <Text className={`text-xs font-semibold ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {trend}
                    </Text>
                )}
            </View>

            <Text className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">{title}</Text>

            {loading ? (
                <ActivityIndicator size="small" color="#4B5563" />
            ) : (
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                    {value}
                </Text>
            )}
        </View>
    );
};

export default StatCard;
