
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { LayoutDashboard, Users, Ban, Server, Crown, ShieldAlert, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Administrator', 'Senior Moderator', 'Moderator'] },
    { path: '/server-admins', label: 'Server Admins', icon: ShieldAlert, roles: ['Administrator'] },
    { path: '/bans', label: 'Bans', icon: Ban, roles: ['Administrator', 'Senior Moderator', 'Moderator'] },
    { path: '/servers', label: 'Servers', icon: Server, roles: ['Administrator', 'Senior Moderator'] },
    { path: '/vips', label: 'VIPs', icon: Crown, roles: ['Administrator'] },
    { path: '/users', label: 'Users', icon: User, roles: ['Administrator'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(currentUser?.role)
  );

  return (
    <aside 
      className={cn(
        "fixed left-0 top-16 bottom-0 w-64 bg-[#0a0a0a] border-r border-gray-800 z-50 transition-transform duration-300 ease-in-out md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <nav className="p-4 space-y-2 h-full overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose && window.innerWidth < 768 && onClose()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 group ${
                  isActive
                    ? 'bg-[#1a1a1a] text-[#00FF41] border border-[#00FF41] shadow-[0_0_10px_rgba(0,255,65,0.5)]'
                    : 'text-gray-400 hover:text-[#00FF41] hover:bg-[#1a1a1a] hover:shadow-[0_0_10px_rgba(0,255,65,0.2)]'
                }`
              }
            >
              <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
