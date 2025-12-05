import React from 'react';
import { motion } from 'framer-motion';
import { ArrowTrendingUpIcon, BugAntIcon, ShieldExclamationIcon, CpuChipIcon } from '@heroicons/react/24/outline';

const iconMap = {
    'attacks': <BugAntIcon className="w-6 h-6" />,
    'incidents': <ShieldExclamationIcon className="w-6 h-6" />,
    'trend': <ArrowTrendingUpIcon className="w-6 h-6" />,
    'ip': <CpuChipIcon className="w-6 h-6" />,
};

const cardVariants = {
    hover: {
        scale: 1.02,
        boxShadow: "0 0 25px rgba(0, 255, 255, 0.4)",
        borderColor: "#00FFFF",
    }
};

const OverviewCards = ({ title, value, iconType, unit, subtext }) => {
    return (
        <motion.div 
            className="glass-card flex items-start space-x-4 border-l-4 border-neon-cyan hover:border-neon-red"
            variants={cardVariants}
            whileHover="hover"
            transition={{ type: "spring", stiffness: 300 }}
        >
            <div className="p-3 rounded-full bg-neon-cyan/10 text-neon-cyan shadow-lg shadow-neon-cyan/20">
                {iconMap[iconType] || <CpuChipIcon className="w-6 h-6" />}
            </div>
            <div>
                <p className="text-sm text-gray-400 font-mono uppercase tracking-widest">{title}</p>
                <h2 className="text-4xl font-bold holographic-text mt-1">
                    {value}
                    {unit && <span className="text-xl ml-1 opacity-70">{unit}</span>}
                </h2>
                {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
            </div>
        </motion.div>
    );
};

export default OverviewCards;