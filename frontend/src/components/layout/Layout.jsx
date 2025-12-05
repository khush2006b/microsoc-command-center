import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useMediaQuery } from 'react-responsive';

const Layout = () => {
    const isLargeScreen = useMediaQuery({ minWidth: 1024 });
    const isMobile = !isLargeScreen;
    
    // Sidebar state management
    const [isSidebarOpen, setIsSidebarOpen] = useState(isLargeScreen);

    // Sync sidebar open state with screen size changes
    useEffect(() => {
        setIsSidebarOpen(isLargeScreen);
    }, [isLargeScreen]);

    // Calculate main content padding based on sidebar state
    const sidebarWidth = isSidebarOpen ? (isMobile ? '0px' : '250px') : '80px';
    const contentPadding = isMobile ? '0' : sidebarWidth;

    return (
        <div className="flex min-h-screen">
            {/* Sidebar Component */}
            <Sidebar 
                isOpen={isSidebarOpen} 
                setIsOpen={setIsSidebarOpen} 
                isMobile={isMobile} 
            />
            
            {/* Main Content Area */}
            <div 
                style={{ marginLeft: isMobile ? '0' : contentPadding }}
                className="flex-grow flex flex-col transition-[margin-left] duration-300"
            >
                {/* Topbar Component */}
                <Topbar setIsSidebarOpen={setIsSidebarOpen} />
                
                {/* Page Content */}
                <main className="flex-grow p-6 md:p-8 overflow-auto page-transition">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;