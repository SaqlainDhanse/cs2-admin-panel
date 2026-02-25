
import React from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { User, Mail, Shield, Calendar } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';

const UserProfilePage = () => {
  const { currentUser } = useAuth();

  const profileFields = [
    {
      label: 'Username',
      value: currentUser?.username,
      icon: User,
    },
    {
      label: 'Email',
      value: currentUser?.email,
      icon: Mail,
    },
    {
      label: 'Role',
      value: currentUser?.role,
      icon: Shield,
    },
    {
      label: 'Account Created',
      value: currentUser?.created ? new Date(currentUser.created).toLocaleDateString() : 'Unknown',
      icon: Calendar,
    },
  ];

  return (
    <>
      <Helmet>
        <title>Profile - CS2 Servers Admin Panel</title>
        <meta name="description" content="View your user profile" />
      </Helmet>
      <div className="p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-[#00FF41] mb-8" style={{ textShadow: '0 0 15px rgba(0, 255, 65, 0.5)' }}>
            User Profile
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="max-w-2xl shadow-[0_0_20px_rgba(0,255,65,0.2)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {currentUser?.avatar ? (
                  <img
                    src={pb.files.getUrl(currentUser, currentUser.avatar)}
                    alt={currentUser.username || 'User avatar'}
                    className="w-16 h-16 rounded-full border-2 border-[#00FF41]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#00FF41]/10 border-2 border-[#00FF41] flex items-center justify-center">
                    <User className="w-8 h-8 text-[#00FF41]" />
                  </div>
                )}
                <div>
                  <div className="text-2xl">{currentUser?.username || currentUser?.email}</div>
                  <div className="text-sm text-gray-400 font-normal">{currentUser?.role || 'User'}</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profileFields.map((field, index) => {
                  const Icon = field.icon;
                  return (
                    <motion.div
                      key={field.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                      className="flex items-center gap-4 p-4 bg-[#0a0a0a] rounded-lg border border-gray-800 hover:border-[#00FF41]/30 transition-all duration-300"
                    >
                      <Icon className="w-5 h-5 text-[#00FF41]" />
                      <div className="flex-1">
                        <div className="text-sm text-gray-400">{field.label}</div>
                        <div className="text-white font-medium">{field.value}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default UserProfilePage;
