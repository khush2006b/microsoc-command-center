import React from 'react';
import IncidentTable from '../components/dashboard/IncidentTable';
import SeverityChart from '../components/charts/SeverityChart';
import { motion } from 'framer-motion';

const AnalystDashboard = () => {
    return (
        <motion.div 
            className="space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <h1 className="text-3xl font-bold text-white holographic-text">ANALYST SOC WORKSPACE</h1>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Primary Workspace (Table) */}
                <div className="lg:col-span-3">
                    <IncidentTable />
                </div>
                
                {/* Secondary Sidebar (Charts/Widgets) */}
                <div className="lg:col-span-1 flex flex-col space-y-6">
                    <div className="glass-card">
                        <h3 className="text-xl font-bold text-neon-red border-b border-neon-red/20 pb-2 mb-4">Workload Status</h3>
                        <p className="text-4xl font-mono text-cyan-400">5</p>
                        <p className="text-sm text-gray-400 mt-1">Incidents Assigned</p>
                    </div>
                    
                    <SeverityChart />
                </div>
            </div>
        </motion.div>
    );
};

export default AnalystDashboard;