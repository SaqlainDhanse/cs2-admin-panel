import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Server, ShieldAlert, Ban, ChevronRight, Crown } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';

const DashboardPage = () => {
  const { currentUser, authenticatedFetch } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalServers: 0,
    activeAdmins: 0,
    activeBans: 0,
    activeVips: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Call your new consolidated wrapper API
        const response = await authenticatedFetch('/api/stats');
        
        if (!response.ok) throw new Error('Failed to fetch stats');
        
        const data = await response.json();

        setStats({
          totalServers: data.totalServers,
          activeAdmins: data.activeAdmins,
          activeBans: data.activeBans,
          activeVips: data.activeVips
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast({
          title: 'Error',
          description: 'Could not load dashboard statistics',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Active Bans',
      value: stats.activeBans,
      icon: Ban,
      path: '/bans',
      color: '#00FF41',
    },
    {
      title: 'Total Servers',
      value: stats.totalServers,
      icon: Server,
      path: '/servers',
      color: '#00FF41',
    },
    {
      title: 'Active Admins',
      value: stats.activeAdmins,
      icon: ShieldAlert,
      path: '/server-admins',
      color: '#00FF41',
    },
    {
      title: 'Active VIPs',
      value: stats.activeVips,
      icon: Crown,
      path: '/vips',
      color: '#00FF41',
    }
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard - CS2 Servers Admin Panel</title>
        <meta name="description" content="CS2 Servers Admin Panel Dashboard - Manage your game servers" />
      </Helmet>
      <div className="p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-[#00FF41] mb-2" style={{ textShadow: '0 0 15px rgba(0, 255, 65, 0.5)' }}>
            Welcome back, {currentUser?.username}
          </h1>
          <p className="text-gray-400 mb-8">Here's an overview of your CS2 servers</p>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00FF41] mb-2"></div>
            <div className="text-[#00FF41] animate-pulse">Loading stats...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card 
                    className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,65,0.2)] border-gray-800 bg-[#1a1a1a]"
                    onClick={() => navigate(stat.path)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00FF41]/0 to-[#00FF41]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-400 group-hover:text-[#00FF41] transition-colors">
                        {stat.title}
                      </CardTitle>
                      <Icon className="w-5 h-5 text-[#00FF41]" />
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end justify-between">
                        <div className="text-3xl font-bold text-[#00FF41]" style={{ textShadow: '0 0 10px rgba(0, 255, 65, 0.4)' }}>
                          {stat.value}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-[#00FF41] group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8"
        >
          <Card className="border-gray-800 bg-[#1a1a1a]">
            <CardHeader>
              <CardTitle className="text-[#00FF41]">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                Use the sidebar to navigate to different sections of the admin panel.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default DashboardPage;