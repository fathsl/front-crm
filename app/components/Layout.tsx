import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleCollapsed = () => setCollapsed(prev => !prev);

  const handleNavClick = (id?: string) => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
      return;
    }
    if (id === 'close') {
      setSidebarOpen(false);
    }
  };

useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }
  }, [location.pathname]);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <Navbar onMenuToggle={toggleSidebar} />
      <Sidebar
        sidebarOpen={sidebarOpen}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
        onNavClick={(id) => handleNavClick(id)}
      />
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className={`transition-all duration-300 ease-in-out pt-16 min-h-screen ${sidebarOpen ? (collapsed ? 'lg:ml-20' : 'lg:ml-64') : 'lg:ml-0'}`}>
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
