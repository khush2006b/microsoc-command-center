import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import StatusBadge from '../common/StatusBadge';
import { mockIncidents } from '../../data/mockData';
import { CheckIcon, ArrowPathIcon, UserIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';

// Reusable Incident Detail Modal (Headless UI)
const IncidentDetailsModal = ({ isOpen, closeModal, incident }) => {
    if (!incident) return null;

    return (
        <Transition appear show={isOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-50" onClose={closeModal}>
                <Transition.Child
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={React.Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg glass-card transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all border-neon-red/50">
                                <Dialog.Title
                                    as="h3"
                                    className="text-xl font-bold holographic-text leading-6 border-b border-neon-red/20 pb-3 mb-4"
                                >
                                    Incident Details: {incident.id}
                                </Dialog.Title>
                                
                                <div className="space-y-3 font-mono text-sm">
                                    <p><span className="text-gray-400">Type:</span> <span className="text-cyan-400">{incident.type}</span></p>
                                    <p><span className="text-gray-400">Severity:</span> <span className={`font-bold ${incident.severity === 'Critical' ? 'text-neon-red' : 'text-yellow-400'}`}>{incident.severity}</span></p>
                                    <p><span className="text-gray-400">Status:</span> <StatusBadge status={incident.status} /></p>
                                    <p><span className="text-gray-400">Assigned To:</span> <span className="text-white">{incident.assignedTo || 'Unassigned'}</span></p>
                                    <p><span className="text-gray-400">Source IP:</span> <span className="text-white">{incident.ip}</span></p>
                                    <p><span className="text-gray-400">Created At:</span> <span className="text-white">{incident.createdAt}</span></p>
                                </div>

                                <div className="mt-6">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-transparent bg-neon-cyan/20 px-4 py-2 text-sm font-medium text-neon-cyan hover:bg-neon-cyan/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/75"
                                        onClick={closeModal}
                                    >
                                        Close
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}


const IncidentTable = () => {
    // Note: In a real app, this would use useState and handlers for state management
    const [incidents, setIncidents] = useState(mockIncidents);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);

    const openModal = (incident) => {
        setSelectedIncident(incident);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedIncident(null);
    };
    
    // UI logic for status update
    const handleStatusUpdate = (id, newStatus, assignedTo = 'Red Ranger') => {
        setIncidents(prev => prev.map(inc => 
            inc.id === id 
                ? { ...inc, status: newStatus, assignedTo: newStatus !== 'Open' ? assignedTo : null } 
                : inc
        ));
    };

    return (
        <div className="glass-card overflow-x-auto min-h-[500px] flex flex-col">
            <h3 className="text-lg font-bold holographic-text mb-4 border-b border-neon-red/20 pb-2">
                Assigned Incidents Queue
            </h3>
            
            <table className="min-w-full divide-y divide-neon-cyan/20">
                <thead>
                    <tr className="text-left text-xs font-mono uppercase tracking-wider text-gray-400 bg-secondary-dark/50">
                        <th className="px-6 py-3">ID</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Severity</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Analyst</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <Motion.tbody 
                    className="divide-y divide-neon-cyan/10"
                    layout
                >
                    <AnimatePresence>
                        {incidents.filter(i => i.status !== 'Resolved').map((incident) => (
                            <Motion.tr 
                                key={incident.id} 
                                className="hover:bg-neon-cyan/5 text-sm transition-colors duration-150"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-cyan-400">{incident.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{incident.type}</td>
                                <td className={`px-6 py-4 whitespace-nowrap font-bold ${incident.severity === 'Critical' ? 'text-neon-red' : 'text-yellow-400'}`}>
                                    {incident.severity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusBadge status={incident.status} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{incident.assignedTo || 'Unassigned'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="inline-flex space-x-2">
                                        <button 
                                            onClick={() => openModal(incident)}
                                            title="View Details"
                                            className="p-1 rounded bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/40"
                                        >
                                            <EyeIcon className="w-5 h-5" />
                                        </button>
                                        
                                        {incident.status === 'Open' && (
                                            <button 
                                                onClick={() => handleStatusUpdate(incident.id, 'In Progress', 'Red Ranger')}
                                                title="Assign to Me"
                                                className="p-1 rounded bg-neon-red/20 text-neon-red hover:bg-neon-red/40"
                                            >
                                                <UserIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                        
                                        {incident.status === 'In Progress' && (
                                            <button 
                                                onClick={() => handleStatusUpdate(incident.id, 'Resolved')}
                                                title="Resolve"
                                                className="p-1 rounded bg-green-600/20 text-green-400 hover:bg-green-600/40"
                                            >
                                                <CheckIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                        
                                        {incident.status !== 'Resolved' && (
                                            <button 
                                                onClick={() => handleStatusUpdate(incident.id, 'Open', null)}
                                                title="Reopen"
                                                className="p-1 rounded bg-gray-600/20 text-gray-400 hover:bg-gray-600/40"
                                            >
                                                <ArrowPathIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </Motion.tr>
                        ))}
                    </AnimatePresence>
                </Motion.tbody>
            </table>
            
            <IncidentDetailsModal
                isOpen={isModalOpen}
                closeModal={closeModal}
                incident={selectedIncident}
            />
        </div>
    );
};

export default IncidentTable;