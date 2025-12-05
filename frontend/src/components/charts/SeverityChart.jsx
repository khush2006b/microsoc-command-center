import React from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip
} from 'recharts';
import { mockSeverityData } from '../../data/mockData';
import { ScaleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const SeverityChart = () => {
    return (
        <motion.div 
            className="glass-card h-full min-h-[350px] flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
        >
            <h3 className="text-lg font-bold flex items-center holographic-text mb-4 border-b border-neon-red/20 pb-2">
                <ScaleIcon className="w-5 h-5 mr-2 text-neon-cyan" />
                Threat Severity Distribution
            </h3>
            <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={mockSeverityData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#8884d8"
                            animationDuration={1500} // Chart animation
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                            {mockSeverityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} stroke="#0A0E18" strokeWidth={2} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ background: '#141A28', border: '1px solid #FF4D4D', borderRadius: '5px' }}
                            labelStyle={{ color: '#FF4D4D' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', color: '#9CA3AF' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default SeverityChart;