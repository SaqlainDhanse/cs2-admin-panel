
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.jsx';
import { User, Mail, Shield, Calendar, Clock, Edit } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

const UserProfilePage = () => {
  const { currentUser, updateUser, authenticatedFetch } = useAuth();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const formatLocalTime = (utcString) => {
    if (!utcString) return 'Unknown';
    
    let date;
    // Try parsing the date - if it already has timezone info, use it directly
    if (utcString.includes('T') || utcString.includes('Z')) {
      date = new Date(utcString);
    } else {
      // Assume UTC if no timezone info
      date = new Date(utcString + ' UTC');
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: userTimeZone
    });
  };

  const formatUpdatedTime = (updatedString, createdString) => {
    // If updated_at is null, undefined, or equals created_at, show N/A
    if (!updatedString) return 'N/A';
    if (updatedString === createdString) return 'N/A';
    return formatLocalTime(updatedString);
  };

  const profileFields = [
    {
      label: 'Username',
      value: currentUser?.username,
      icon: User,
      editable: true,
    },
    {
      label: 'Email',
      value: currentUser?.email,
      icon: Mail,
      editable: true,
    },
    {
      label: 'Role',
      value: currentUser?.role,
      icon: Shield,
      editable: false,
    },
    {
      label: 'Account Created',
      value: formatLocalTime(currentUser?.created_at),
      icon: Clock,
      editable: false,
    },
    {
      label: 'Last Updated',
      value: formatUpdatedTime(currentUser?.updated_at, currentUser?.created_at),
      icon: Clock,
      editable: false,
    },
  ];

  const handleEditClick = () => {
    setFormData({
      username: currentUser?.username || '',
      email: currentUser?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setChangePassword(false);
    setEditDialogOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        username: formData.username !== currentUser?.username ? formData.username : undefined,
        email: formData.email !== currentUser?.email ? formData.email : undefined,
      };

      if (changePassword) {
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
          throw new Error('Please fill in all password fields');
        }
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('New password and confirm password do not match');
        }
        payload.currentPassword = formData.currentPassword;
        payload.newPassword = formData.newPassword;
      }

      const response = await authenticatedFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update user context with new data including updated_at timestamp
      updateUser({
        ...currentUser,
        username: formData.username,
        email: formData.email,
        updated_at: new Date().toISOString(),
      });

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        className: 'bg-[#1a1a1a] border-[#00FF41] text-white',
      });
      setEditDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

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
              <CardTitle className="flex items-center justify-between gap-3">
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
                <Button
                  onClick={handleEditClick}
                  className="bg-[#00FF41] text-black hover:bg-[#00FF41]/90 shadow-[0_0_10px_rgba(0,255,65,0.5)] font-semibold"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
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

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-[#1a1a1a] border-gray-700 text-white shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <DialogHeader>
              <DialogTitle className="text-[#00FF41]">Edit Profile</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update your username, email, or password.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveProfile}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Username</label>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41] text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41] text-white"
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="changePassword"
                    checked={changePassword}
                    onChange={(e) => setChangePassword(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-700 bg-[#0a0a0a] text-[#00FF41] focus:ring-[#00FF41] focus:ring-offset-[#1a1a1a]"
                  />
                  <label htmlFor="changePassword" className="text-sm font-medium text-gray-300 cursor-pointer">
                    Change Password
                  </label>
                </div>
                {changePassword && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Current Password</label>
                      <Input
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                        className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41] text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">New Password</label>
                      <Input
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41] text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Confirm Password</label>
                      <Input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41] text-white"
                        required
                      />
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  className="border-gray-700 text-gray-300 hover:bg-[#252525] hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#00FF41] text-black hover:bg-[#00FF41]/90 shadow-[0_0_10px_rgba(0,255,65,0.5)] font-semibold"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default UserProfilePage;
