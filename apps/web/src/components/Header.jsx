import React from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu.jsx';
import { User, LogOut, Menu, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import Brand from '@/components/Brand.jsx';
import { activeBrand } from '@/themes';
const Header = ({
  onMenuToggle
}) => {
  const {
    currentUser,
    logout,
    isAuthenticated
  } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const handleLoginClick = () => {
    const currentUrl = window.location.pathname + window.location.search;
    const encodedUrl = encodeURIComponent(currentUrl);
    navigate(`/login?redirect=${encodedUrl}`);
  };
  return <header className="fixed top-0 left-0 right-0 h-16 border-b border-line-subtle z-40" style={{ backgroundColor: 'rgb(var(--theme-background-color-rgb) / 0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden text-ink-muted hover:text-theme hover:bg-panel hover:shadow-[0_0_10px_rgb(var(--theme-primary-rgb)_/_0.3)] transition-all duration-300" onClick={onMenuToggle}>
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-theme tracking-wider truncate" style={{
          textShadow: '0 0 10px rgb(var(--theme-primary-rgb) / 0.5)'
        }}>{activeBrand.header?.src ? (
          <img
            src={activeBrand.header.src}
            alt={activeBrand.title || 'Logo'}
            style={{ height: activeBrand.header.height, width: activeBrand.header.width }}
            className="object-contain"
          />
        ) : (
          <Brand placement="header" />
        )}</h1>
        </div>
        
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-2 md:px-4 py-2 rounded-md bg-panel border border-line hover:border-theme transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-theme hover:shadow-[0_0_10px_rgb(var(--theme-primary-rgb)_/_0.2)]">
              <User className="w-5 h-5 text-theme" />
              <div className="text-left hidden md:block">
                <div className="text-sm font-medium text-ink">{currentUser?.username}</div>
                <div className="text-xs text-ink-muted">{currentUser?.role || 'User'}</div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-panel border-line text-ink">
              <DropdownMenuLabel className="text-theme">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-line" />
              <DropdownMenuItem onClick={() => navigate('/profile')} className="focus:bg-hover focus:text-theme cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-line" />
              <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-400 focus:bg-hover cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            onClick={handleLoginClick}
            className="bg-theme text-black hover:bg-theme/90 shadow-[0_0_10px_rgb(var(--theme-primary-rgb)_/_0.5)] font-semibold"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Login
          </Button>
        )}
      </div>
    </header>;
};
export default Header;