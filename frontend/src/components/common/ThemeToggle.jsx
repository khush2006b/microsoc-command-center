import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';

const ThemeToggle = () => (
    <button
        className="p-2 rounded-full text-neon-cyan hover:bg-neon-cyan/20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
        title="Toggle Theme"
    >
        {/* Placeholder functionality - currently fixed dark theme */}
        <MoonIcon className="w-6 h-6" /> 
    </button>
);

export default ThemeToggle;