import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { mockAttackTrends } from '../../data/mockData';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const AttackTrend = () => {
    return (
        <motion.div 
            className="glass-card h-full min-h-[350px] flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
        >
            <h3 className="text-lg font-bold flex items-center holographic-text mb-4 border-b border-neon-cyan/20 pb-2">
                <ArrowTrendingUpIcon className="w-5 h-5 mr-2 text-neon-red" />
                Attack Trend (24h)
            </h3>
            <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockAttackTrends} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid stroke="#00FFFF1A" strokeDasharray="3 3" />
                        <XAxis dataKey="name" stroke="#8884d8" style={{ fontSize: '10px' }} />
                        <YAxis stroke="#8884d8" style={{ fontSize: '10px' }} />
                        <Tooltip 
                            contentStyle={{ background: '#141A28', border: '1px solid #00FFFF', borderRadius: '5px' }}
                            labelStyle={{ color: '#00FFFF' }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="attacks" 
                            stroke="#FF4D4D" 
                            strokeWidth={3} 
                            activeDot={{ r: 8, fill: '#00FFFF', stroke: '#FF4D4D', strokeWidth: 2 }}
                            dot={false}
                            // Recharts uses internal animation by default
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default AttackTrend;