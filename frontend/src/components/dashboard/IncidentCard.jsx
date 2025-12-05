import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { ClockIcon, ServerStackIcon } from '@heroicons/react/24/outline';

const IncidentCard = ({ incident }) => (
    <div className="glass-card border-l-4 border-neon-red/80 hover:border-neon-cyan/80 p-4">
        <div className="flex justify-between items-start">
            <h4 className="text-md font-bold text-gray-100">{incident.type}</h4>
            <StatusBadge status={incident.status} />
        </div>
        
        <p className={`text-xl font-mono mt-1 ${incident.severity === 'Critical' ? 'text-neon-red' : 'text-cyan-400'}`}>
            {incident.severity.toUpperCase()}
        </p>
        
        <div className="mt-3 text-sm text-gray-400 space-y-1">
            <p className="flex items-center">
                <ServerStackIcon className="w-4 h-4 mr-2" />
                Source IP: <span className="text-white ml-2">{incident.ip}</span>
            </p>
            <p className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-2" />
                Created: <span className="text-white ml-2">{incident.createdAt}</span>
            </p>
            {incident.assignedTo && (
                <p className="text-xs text-yellow-400">
                    Assigned to: {incident.assignedTo}
                </p>
            )}
        </div>
    </div>
);

export default IncidentCard;