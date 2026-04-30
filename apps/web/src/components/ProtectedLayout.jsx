
import React, { useState } from 'react';
import Header from '@/components/Header.jsx';
import Sidebar from '@/components/Sidebar.jsx';

const ProtectedLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Header onMenuToggle={toggleMobileMenu} />
      <div className="flex flex-1 pt-16 relative">
        <Sidebar isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
        
        {/* Overlay for mobile */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300"
            onClick={closeMobileMenu}
          />
        )}

        <main className="flex-1 md:ml-64 min-h-[calc(100vh-4rem)] w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ProtectedLayout;
