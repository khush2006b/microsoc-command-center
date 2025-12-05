// src/data/mockData.js

const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];
const ATTACK_TYPES = ['SQLi', 'XSS', 'DDoS', 'Brute Force', 'Port Scan'];
const STATUSES = ['Open', 'In Progress', 'Resolved'];
const ANALYSTS = ['Red Ranger', 'Blue Ranger', 'Yellow Ranger', 'Black Ranger'];

const generateRandomIP = () => `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

// Mock Log Generator
export const generateMockLog = (id) => ({
    id: id,
    timestamp: new Date().toLocaleTimeString('en-US'),
    source_ip: generateRandomIP(),
    attack_type: ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)],
    target: `/api/system/${Math.floor(Math.random() * 100)}`,
    severity: SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)],
});

// Mock Incident Generator
export const generateMockIncident = (id) => {
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
    const severity = SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)];
    
    return {
        id: `INC-${1000 + id}`,
        type: ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)],
        ip: generateRandomIP(),
        severity: severity,
        status: status,
        assignedTo: status === 'Open' ? null : ANALYSTS[Math.floor(Math.random() * ANALYSTS.length)],
        createdAt: new Date(Date.now() - Math.random() * 86400000).toLocaleString(),
    }
};

// Initial Mock Data Sets
export const mockLogs = Array.from({ length: 20 }).map((_, i) => generateMockLog(i));
export const mockIncidents = Array.from({ length: 15 }).map((_, i) => generateMockIncident(i));

// Mock Data for Charts
export const mockAttackTrends = Array.from({ length: 12 }).map((_, i) => ({
    name: `${i + 1}h ago`,
    attacks: Math.floor(Math.random() * 400 + 100),
}));

export const mockSeverityData = [
    { name: 'Critical', value: 12, fill: '#FF4D4D' },
    { name: 'High', value: 25, fill: '#FFAA00' },
    { name: 'Medium', value: 40, fill: '#FFFF00' },
    { name: 'Low', value: 15, fill: '#00FFFF' },
];