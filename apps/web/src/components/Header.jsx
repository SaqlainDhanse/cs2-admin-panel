import React from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu.jsx';
import { User, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
const Header = ({
  onMenuToggle
}) => {
  const {
    currentUser,
    logout
  } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  return <header className="fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a] border-b border-gray-800 z-40">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden text-gray-400 hover:text-[#00FF41] hover:bg-[#1a1a1a] hover:shadow-[0_0_10px_rgba(0,255,65,0.3)] transition-all duration-300" onClick={onMenuToggle}>
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-[#00FF41] tracking-wider truncate" style={{
          textShadow: '0 0 10px rgba(0, 255, 65, 0.5)'
        }}>CS2 Panel</h1>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-2 md:px-4 py-2 rounded-md bg-[#1a1a1a] border border-gray-700 hover:border-[#00FF41] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#00FF41] hover:shadow-[0_0_10px_rgba(0,255,65,0.2)]">
            <User className="w-5 h-5 text-[#00FF41]" />
            <div className="text-left hidden md:block">
              <div className="text-sm font-medium text-white">{currentUser?.username}</div>
              <div className="text-xs text-gray-400">{currentUser?.role || 'User'}</div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[#1a1a1a] border-gray-700 text-white">
            <DropdownMenuLabel className="text-[#00FF41]">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem onClick={() => navigate('/profile')} className="focus:bg-[#252525] focus:text-[#00FF41] cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-400 focus:bg-[#252525] cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>;
};
export default Header;