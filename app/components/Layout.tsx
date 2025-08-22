import { useState } from 'react';
import { Outlet } from 'react-router';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <Navbar onMenuToggle={toggleSidebar} />
      <Sidebar sidebarOpen={sidebarOpen} onNavClick={() => setSidebarOpen(false)} />
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main content area */}
      <div className="transition-all duration-300 ease-in-out pt-16 lg:ml-64">
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
