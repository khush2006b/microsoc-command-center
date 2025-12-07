import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Sidebar({ isOpen, onClose }) {
  const { isDark, toggle } = useTheme();

  const menuItems = [
    { label: 'Dashboard', icon: '📊', href: '#' },
    { label: 'Logs', icon: '📝', href: '#logs' },
    { label: 'Alerts', icon: '🚨', href: '#alerts' },
    { label: 'Incidents', icon: '⚠️', href: '#incidents' },
    { label: 'Analytics', icon: '📈', href: '#analytics' },
    { label: 'Settings', icon: '⚙️', href: '#settings' }
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gray-900 border-r border-gray-700 transform transition-transform duration-300 ease-in-out z-50 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:z-auto`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-red-500 to-orange-500">
            µSOC
          </h1>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-gray-200"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        {/* Divider */}
        <div className="border-t border-gray-700 my-4" />

        {/* Theme Toggle */}
        <div className="px-4 py-4">
          <button
            onClick={toggle}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors"
          >
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            {isDark ? (
              <SunIcon className="w-5 h-5" />
            ) : (
              <MoonIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gray-900">
          <p className="text-xs text-gray-500 text-center">
            µSOC v1.0.0<br />
            Cybersecurity Platform
          </p>
        </div>
      </aside>
    </>
  );
}
