import React, { useRef, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { UseLiveFeed } from '../../hooks/UseLiveFeed';
import { BoltIcon } from '@heroicons/react/24/outline';

const LiveLogFeed = () => {
    const { logs } = UseLiveFeed();
    const listRef = useRef(null);

    // Auto-scroll logic
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = 0; // Always scroll to the top for a continuous feed look
        }
    }, [logs]);

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'Critical': return 'text-neon-red';
            case 'High': return 'text-red-400';
            case 'Medium': return 'text-yellow-400';
            case 'Low': return 'text-cyan-400';
            default: return 'text-gray-400';
        }
    };

    const itemVariants = {
        initial: { opacity: 0, y: -20, height: 0 },
        animate: { opacity: 1, y: 0, height: 'auto' },
        exit: { opacity: 0, height: 0 },
    };

    return (
        <div className="glass-card flex flex-col h-full min-h-[400px]">
            <h3 className="text-lg font-bold flex items-center holographic-text mb-4 border-b border-neon-cyan/20 pb-2">
                <BoltIcon className="w-5 h-5 mr-2 text-neon-cyan" />
                Live Log Ingestion Stream
            </h3>
            <Motion.ul 
                ref={listRef} 
                className="flex flex-col space-y-2 overflow-y-scroll overflow-x-hidden flex-grow pt-1 pr-2"
                style={{ scrollbarWidth: 'none' }} // Hide scrollbar
            >
                <AnimatePresence initial={false}>
                    {logs.map((log) => (
                        <Motion.li
                            key={log.id}
                            variants={itemVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.25 }}
                            className="text-xs font-mono p-1.5 rounded-md bg-secondary-dark/50 hover:bg-secondary-dark/70 border-l-2 border-neon-red/50"
                        >
                            <span className="text-gray-500 mr-2">{log.timestamp}</span>
                            <span className={`${getSeverityColor(log.severity)} font-bold mr-2`}>[{log.severity.toUpperCase().charAt(0)}]</span>
                            <span className="text-cyan-400 mr-2">{log.source_ip}</span>
                            <span className="text-red-400">{log.attack_type}</span>
                            <span className="text-gray-500 ml-2 italic">{log.target}</span>
                        </Motion.li>
                    ))}
                </AnimatePresence>
            </Motion.ul>
        </div>
    );
};

export default LiveLogFeed;