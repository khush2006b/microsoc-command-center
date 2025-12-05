import React from 'react';

const getStyles = (status) => {
    switch (status) {
        case 'Resolved':
            return 'bg-green-600/30 text-green-400 border-green-400/50 shadow-green-400/20';
        case 'In Progress':
            return 'bg-yellow-600/30 text-yellow-400 border-yellow-400/50 shadow-yellow-400/20';
        case 'Open':
            return 'bg-neon-red/30 text-neon-red border-neon-red/50 shadow-neon-red/20';
        default:
            return 'bg-gray-600/30 text-gray-400 border-gray-400/50';
    }
};

const StatusBadge = ({ status }) => (
    <span
        className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider border shadow-md ${getStyles(status)}`}
    >
        {status}
    </span>
);

export default StatusBadge;