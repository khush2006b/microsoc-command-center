import React from 'react';
import { Bars3Icon, BellAlertIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import ThemeToggle from '../common/ThemeToggle';

const Topbar = ({ setIsSidebarOpen }) => (
    <header className="sticky top-0 z-30 bg-secondary-dark/90 backdrop-blur-md h-16 border-b border-neon-cyan/30 shadow-lg px-6 flex items-center justify-between">
        
        {/* Left Side: Mobile Menu Button */}
        <div className="flex items-center space-x-4">
            <button 
                onClick={() => setIsSidebarOpen(true)}
                className="text-neon-cyan lg:hidden focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 p-1 rounded"
            >
                <Bars3Icon className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-100 hidden lg:block">COMMAND CENTER</h2>
        </div>

        {/* Right Side: Notifications and User */}
        <div className="flex items-center space-x-4">
            <ThemeToggle />
            
            <button className="relative p-2 rounded-full text-neon-red hover:bg-neon-red/20 transition-colors duration-200">
                <BellAlertIcon className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-neon-red rounded-full animate-ping" />
            </button>
            
            <button className="relative p-2 rounded-full text-gray-400 hover:bg-neon-cyan/20 transition-colors duration-200">
                <Cog6ToothIcon className="w-6 h-6" />
            </button>

            <div className="w-8 h-8 rounded-full bg-neon-cyan/50 border-2 border-neon-cyan shadow-lg shadow-neon-cyan/30 flex items-center justify-center font-bold text-sm">
                RR
            </div>
        </div>
    </header>
);

export default Topbar;