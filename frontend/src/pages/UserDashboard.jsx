import React from 'react';
import OverviewCards from '../components/common/OverviewCards';
import LiveLogFeed from '../components/dashboard/LiveLogFeed';
import AttackTrend from '../components/charts/AttackTrend';
import SeverityChart from '../components/charts/SeverityChart';
import { mockIncidents } from '../data/mockData';
import IncidentCard from '../components/dashboard/IncidentCard';
import { useLiveFeed } from '../hooks/useLiveFeed';
import { motion } from 'framer-motion';

const UserDashboard = () => {
    const { incidentCount } = useLiveFeed();
    const criticalCount = mockIncidents.filter(i => i.severity === 'Critical' && i.status !== 'Resolved').length;
    const topIP = mockIncidents[0].ip; 

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    return (
        <motion.div 
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            {/* Header */}
            <h1 className="text-3xl font-bold text-white holographic-text">GRID STATUS OVERVIEW</h1>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <OverviewCards 
                    title="Total Attacks (24h)" 
                    value={incidentCount.toLocaleString()} 
                    unit="hits"
                    iconType="attacks"
                    subtext="Simulated attack traffic volume"
                />
                <OverviewCards 
                    title="Active Critical Incidents" 
                    value={criticalCount} 
                    unit="alerts"
                    iconType="incidents"
                    subtext="Immediate action required"
                />
                <OverviewCards 
                    title="Top Attacker IP" 
                    value={topIP} 
                    iconType="ip"
                    subtext="Highest recorded threat source"
                />
                <OverviewCards 
                    title="Response Rate" 
                    value="98.5" 
                    unit="%"
                    iconType="trend"
                    subtext="Avg. resolution time: 12 min"
                />
            </div>

            {/* Charts and Log Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <AttackTrend />
                </div>
                <div className="lg:col-span-1">
                    <LiveLogFeed />
                </div>
            </div>

            {/* Recent Incidents List */}
            <div>
                <h2 className="text-2xl font-bold text-neon-cyan mb-4 border-b border-neon-cyan/20 pb-2">Recent Incidents</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {mockIncidents.slice(0, 4).map(incident => (
                        <IncidentCard key={incident.id} incident={incident} />
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default UserDashboard;