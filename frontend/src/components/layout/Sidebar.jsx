import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CommandLineIcon, ShieldCheckIcon, UserIcon, XMarkIcon, SunIcon } from '@heroicons/react/24/outline';

const navItems = [
    { name: 'Overview', icon: UserIcon, path: '/user' },
    { name: 'Analyst SOC', icon: ShieldCheckIcon, path: '/analyst' },
    { name: 'Threat Intel', icon: CommandLineIcon, path: '/intel' }, // Placeholder route
];

const sidebarVariants = {
    closed: { width: '80px', transition: { type: "spring", stiffness: 400, damping: 40 } },
    open: { width: '250px', transition: { type: "spring", stiffness: 200, damping: 20 } },
};

const Sidebar = ({ isOpen, setIsOpen, isMobile }) => {
    const location = useLocation();

    return (
        <>
        {/* Backdrop for mobile */}
        {isMobile && isOpen && (
            <motion.div 
                className="fixed inset-0 bg-primary-dark/80 z-40" 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)} 
            />
        )}
        
        <motion.div
            initial={false}
            animate={isOpen ? "open" : "closed"}
            variants={sidebarVariants}
            className={`fixed ${isMobile ? 'h-full z-50' : 'h-screen z-20'} bg-secondary-dark/95 backdrop-blur-sm border-r border-neon-cyan/30 flex flex-col py-6 transition-all duration-300 overflow-hidden`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-8">
                {isOpen && (
                    <h1 className="text-xl font-bold holographic-text tracking-widest">
                        MicroSOC
                    </h1>
                )}
                {isMobile && (
                    <button onClick={() => setIsOpen(false)} className="text-neon-red">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex flex-col space-y-2 px-3 flex-grow">
                {navItems.map((item) => (
                    <Link 
                        key={item.name} 
                        to={item.path} 
                        className={`
                            flex items-center p-3 rounded-lg font-mono text-sm tracking-wide transition-all duration-200
                            ${location.pathname === item.path 
                                ? 'bg-neon-red/20 text-neon-red shadow-neon-red/30' 
                                : 'text-gray-400 hover:bg-neon-cyan/10 hover:text-neon-cyan'
                            }
                        `}
                        onClick={() => isMobile && setIsOpen(false)}
                    >
                        <item.icon className="w-6 h-6 flex-shrink-0" />
                        <motion.span 
                            className={`ml-3 whitespace-nowrap ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                            initial={false}
                            animate={{ x: isOpen ? 0 : -20 }}
                            transition={{ duration: 0.1 }}
                        >
                            {item.name}
                        </motion.span>
                    </Link>
                ))}
            </nav>
            
            {/* Footer / Status */}
            <div className="px-4 pt-4 border-t border-neon-cyan/20">
                <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50 mr-2 animate-pulse" />
                    {isOpen && <span className="text-xs text-green-400 font-mono">Grid Online</span>}
                </div>
            </div>
        </motion.div>
        </>
    );
};

export default Sidebar;