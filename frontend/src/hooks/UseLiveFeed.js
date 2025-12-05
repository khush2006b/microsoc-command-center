// src/hooks/useLiveFeed.js
import { useState, useEffect } from 'react';
import { generateMockLog } from '../data/mockData';

const LOG_HISTORY_LIMIT = 50;

export const UseLiveFeed = () => {
    const [logs, setLogs] = useState([]);
    const [incidentCount, setIncidentCount] = useState(1200);

    useEffect(() => {
        // Simulates receiving a new log event every 500ms
        const intervalId = setInterval(() => {
            const newLog = generateMockLog(Date.now());
            
            setLogs((prevLogs) => {
                // Ensure the array doesn't grow indefinitely
                const newLogs = [newLog, ...prevLogs];
                return newLogs.slice(0, LOG_HISTORY_LIMIT);
            });

            // Simulate attack count increase
            setIncidentCount(prev => prev + Math.floor(Math.random() * 3));

        }, 500); // New log every 0.5 seconds

        return () => clearInterval(intervalId); // Cleanup
    }, []);

    // Initial state setup to avoid empty list on first load
    useEffect(() => {
        setLogs(Array.from({ length: 10 }).map((_, i) => generateMockLog(i)));
    }, []);

    return { logs, incidentCount };
};