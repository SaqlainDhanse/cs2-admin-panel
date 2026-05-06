
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.jsx';
import { User, Mail, Shield, Calendar, Clock, Edit, Lock, Unlock } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

const UserProfilePage = () => {
  const { currentUser, updateUser, authenticatedFetch } = useAuth();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorDialogOpen, setTwoFactorDialogOpen] = useState(false);
  const [disableTwoFactorDialogOpen, setDisableTwoFactorDialogOpen] = useState(false);
  const [resetTwoFactorDialogOpen, setResetTwoFactorDialogOpen] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [totpDigits, setTotpDigits] = useState(['', '', '', '', '', '']);
  const [disableTotpDigits, setDisableTotpDigits] = useState(['', '', '', '', '', '']);
  const [resetTotpDigitsState, setResetTotpDigitsState] = useState(['', '', '', '', '', '']);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const disableInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const resetInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchTwoFactorStatus = async () => {
      try {
        const response = await authenticatedFetch('/api/2fa/status');
        if (response.ok) {
          const data = await response.json();
          setTwoFactorEnabled(data.twoFactorEnabled);
        }
      } catch (err) {
        console.error('Failed to fetch 2FA status:', err);
      }
    };

    fetchTwoFactorStatus();
  }, [authenticatedFetch]);

  const handleTotpDigitChange = (index, value, nextInputRef) => {
    if (value.length > 1) {
      value = value.slice(0, 1);
    }
    if (!/^\d*$/.test(value)) {
      return;
    }

    const newDigits = [...totpDigits];
    newDigits[index] = value;
    setTotpDigits(newDigits);

    if (value && nextInputRef) {
      nextInputRef.current?.focus();
    }
  };

  const handleDisableTotpDigitChange = (index, value, nextInputRef) => {
    if (value.length > 1) {
      value = value.slice(0, 1);
    }
    if (!/^\d*$/.test(value)) {
      return;
    }

    const newDigits = [...disableTotpDigits];
    newDigits[index] = value;
    setDisableTotpDigits(newDigits);

    if (value && nextInputRef) {
      nextInputRef.current?.focus();
    }
  };

  const handleResetTotpDigitChange = (index, value, nextInputRef) => {
    if (value.length > 1) {
      value = value.slice(0, 1);
    }
    if (!/^\d*$/.test(value)) {
      return;
    }

    const newDigits = [...resetTotpDigitsState];
    newDigits[index] = value;
    setResetTotpDigitsState(newDigits);

    if (value && nextInputRef) {
      nextInputRef.current?.focus();
    }
  };

  const handleTotpKeyDown = (index, e, prevInputRef) => {
    if (e.key === 'Backspace' && !totpDigits[index] && prevInputRef) {
      prevInputRef.current?.focus();
    }
  };

  const handleDisableTotpKeyDown = (index, e, prevInputRef) => {
    if (e.key === 'Backspace' && !disableTotpDigits[index] && prevInputRef) {
      prevInputRef.current?.focus();
    }
  };

  const handleResetTotpKeyDown = (index, e, prevInputRef) => {
    if (e.key === 'Backspace' && !resetTotpDigitsState[index] && prevInputRef) {
      prevInputRef.current?.focus();
    }
  };

  const getTotpCode = () => totpDigits.join('');
  const getDisableTotpCode = () => disableTotpDigits.join('');
  const getResetTotpCode = () => resetTotpDigitsState.join('');

  const resetTotpDigits = () => setTotpDigits(['', '', '', '', '', '']);
  const resetDisableTotpDigits = () => setDisableTotpDigits(['', '', '', '', '', '']);
  const resetResetTotpDigits = () => setResetTotpDigitsState(['', '', '', '', '', '']);

  useEffect(() => {
    if (twoFactorDialogOpen && inputRefs[0].current) {
      setTimeout(() => inputRefs[0].current?.focus(), 100);
    }
  }, [twoFactorDialogOpen]);

  useEffect(() => {
    if (disableTwoFactorDialogOpen && disableInputRefs[0].current) {
      disableInputRefs[0].current.focus();
    }
  }, [disableTwoFactorDialogOpen]);

  useEffect(() => {
    if (resetTwoFactorDialogOpen && resetInputRefs[0].current) {
      resetInputRefs[0].current.focus();
    }
  }, [resetTwoFactorDialogOpen]);

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

  const handleGenerateTotpSecret = async () => {
    try {
      const response = await authenticatedFetch('/api/2fa/generate', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate TOTP secret');
      }

      const data = await response.json();
      setTotpSecret(data.secret);
      setQrCodeUrl(data.qrCode);
      setTwoFactorDialogOpen(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEnableTwoFactor = async () => {
    try {
      const code = getTotpCode();
      if (!code || code.length !== 6) {
        throw new Error('Please enter the 6-digit TOTP code from your authenticator app');
      }

      const response = await authenticatedFetch('/api/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ totpCode: code }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to enable 2FA');
      }

      setTwoFactorEnabled(true);
      setTwoFactorDialogOpen(false);
      resetTotpDigits();
      setTotpSecret('');
      setQrCodeUrl('');

      toast({
        title: 'Success',
        description: 'Two-factor authentication enabled successfully',
        className: 'bg-[#1a1a1a] border-[#00FF41] text-white',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDisableTwoFactor = async () => {
    try {
      const code = getDisableTotpCode();
      if (!code || code.length !== 6) {
        throw new Error('Please enter the 6-digit TOTP code from your authenticator app');
      }

      const response = await authenticatedFetch('/api/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ totpCode: code }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to disable 2FA');
      }

      setTwoFactorEnabled(false);
      setDisableTwoFactorDialogOpen(false);
      resetDisableTotpDigits();

      toast({
        title: 'Success',
        description: 'Two-factor authentication disabled successfully',
        className: 'bg-[#1a1a1a] border-[#00FF41] text-white',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleResetTwoFactor = async () => {
    try {
      const code = getResetTotpCode();
      if (!code || code.length !== 6) {
        throw new Error('Please enter the 6-digit TOTP code from your authenticator app');
      }

      const response = await authenticatedFetch('/api/2fa/reset', {
        method: 'POST',
        body: JSON.stringify({ totpCode: code }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reset 2FA');
      }

      const data = await response.json();
      setTotpSecret(data.secret);
      setQrCodeUrl(data.qrCode);
      setResetTwoFactorDialogOpen(false);
      resetResetTotpDigits();
      resetTotpDigits();
      setTwoFactorDialogOpen(true);

      toast({
        title: '2FA Reset',
        description: 'Please scan the new QR code with your authenticator app',
        className: 'bg-[#1a1a1a] border-[#00FF41] text-white',
      });
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
        <title>Profile - UGC CS2 Dashboard</title>
        <meta name="description" content="View your user profile" />
      </Helmet>
      <div className="bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#1a1a1a] h-full">
        <div className="p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-[#00FF41] mb-1" style={{ textShadow: '0 0 15px rgba(0, 255, 65, 0.5)' }}>
              User Profile
            </h1>
            <p className="text-gray-400 mb-4">Manage your account settings and preferences</p>
          </motion.div>

          <div className="flex justify-center">
            <div className="w-full max-w-4xl space-y-4">
              {/* Welcome Banner */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-gradient-to-r from-[#00FF41]/10 to-[#00FF41]/5 border border-[#00FF41]/30 rounded-xl p-6 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#00FF41]/5 to-transparent animate-pulse"></div>
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#00FF41]/20 border-2 border-[#00FF41] flex items-center justify-center">
                    {currentUser?.avatar ? (
                      <img
                        src={pb.files.getUrl(currentUser, currentUser.avatar)}
                        alt={currentUser.username || 'User avatar'}
                        className="w-14 h-14 rounded-full"
                      />
                    ) : (
                      <User className="w-8 h-8 text-[#00FF41]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-1">
                      Welcome back, {currentUser?.username || 'User'}!
                    </h2>
                    <p className="text-gray-400">
                      {currentUser?.role || 'Moderator'} • Member since {formatLocalTime(currentUser?.created_at).split(',')[0]}
                    </p>
                  </div>
                  <Button
                    onClick={handleEditClick}
                    className="bg-[#00FF41] text-black hover:bg-[#00FF41]/90 shadow-[0_0_10px_rgba(0,255,65,0.5)] font-semibold"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </motion.div>

              {/* Stats Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 hover:border-[#00FF41]/30 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#00FF41]/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-[#00FF41]" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Role</div>
                      <div className="text-lg font-semibold text-white">{currentUser?.role || 'Moderator'}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 hover:border-[#00FF41]/30 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Email</div>
                      <div className="text-lg font-semibold text-white truncate">{currentUser?.email || 'N/A'}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 hover:border-[#00FF41]/30 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Account Created</div>
                      <div className="text-lg font-semibold text-white">{formatLocalTime(currentUser?.created_at)}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 hover:border-[#00FF41]/30 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Last Updated</div>
                      <div className="text-lg font-semibold text-white">{formatUpdatedTime(currentUser?.updated_at, currentUser?.created_at)}</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* 2FA Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="w-full shadow-[0_0_20px_rgba(0,255,65,0.2)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      {twoFactorEnabled ? <Lock className="w-6 h-6 text-[#00FF41]" /> : <Unlock className="w-6 h-6 text-gray-400" />}
                      <div>
                        <div className="text-2xl">Two-Factor Authentication</div>
                        <div className="text-sm text-gray-400 font-normal">
                          {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>
                      {twoFactorEnabled ? (
                        <div className="ml-auto flex gap-2">
                          <Button
                            onClick={() => setResetTwoFactorDialogOpen(true)}
                            className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30"
                          >
                            Reset 2FA
                          </Button>
                          <Button
                            onClick={() => setDisableTwoFactorDialogOpen(true)}
                            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
                          >
                            Disable 2FA
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={handleGenerateTotpSecret}
                          className="ml-auto bg-[#00FF41] text-black hover:bg-[#00FF41]/90 shadow-[0_0_10px_rgba(0,255,65,0.5)] font-semibold"
                        >
                          Enable 2FA
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-gray-400">
                      {twoFactorEnabled 
                        ? 'Your account is protected with two-factor authentication. You will need to enter a code from your authenticator app when logging in.'
                        : 'Two-factor authentication adds an extra layer of security to your account. Enable it to protect your account with a code from your authenticator app.'}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>

        <Dialog open={disableTwoFactorDialogOpen} onOpenChange={setDisableTwoFactorDialogOpen}>
          <DialogContent className="bg-[#1a1a1a] border-[#333] text-white">
            <DialogHeader>
              <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
              <DialogDescription className="text-gray-400">
                Enter the TOTP code from your authenticator app to disable 2FA.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-gray-300">TOTP Code</Label>
                <div className="flex gap-2 mt-2 justify-center">
                  {disableTotpDigits.map((digit, index) => (
                    <Input
                      key={index}
                      ref={disableInputRefs[index]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDisableTotpDigitChange(index, e.target.value, disableInputRefs[index + 1])}
                      onKeyDown={(e) => handleDisableTotpKeyDown(index, e, disableInputRefs[index - 1])}
                      className="w-12 h-12 text-center text-xl bg-[#2a2a2a] border-[#444] text-white focus:border-[#00FF41]"
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setDisableTwoFactorDialogOpen(false);
                  resetDisableTotpDigits();
                }}
                variant="outline"
                className="border-[#444] text-gray-300 hover:bg-[#2a2a2a]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDisableTwoFactor}
                className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
              >
                Disable 2FA
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={resetTwoFactorDialogOpen} onOpenChange={setResetTwoFactorDialogOpen}>
          <DialogContent className="bg-[#1a1a1a] border-[#333] text-white">
            <DialogHeader>
              <DialogTitle>Reset Two-Factor Authentication</DialogTitle>
              <DialogDescription className="text-gray-400">
                Enter your current TOTP code to generate a new QR code. This will replace your existing 2FA setup.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-gray-300">Current TOTP Code</Label>
                <div className="flex gap-2 mt-2 justify-center">
                  {resetTotpDigitsState.map((digit, index) => (
                    <Input
                      key={index}
                      ref={resetInputRefs[index]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleResetTotpDigitChange(index, e.target.value, resetInputRefs[index + 1])}
                      onKeyDown={(e) => handleResetTotpKeyDown(index, e, resetInputRefs[index - 1])}
                      className="w-12 h-12 text-center text-xl bg-[#2a2a2a] border-[#444] text-white focus:border-[#00FF41]"
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setResetTwoFactorDialogOpen(false);
                  resetResetTotpDigits();
                }}
                variant="outline"
                className="border-[#444] text-gray-300 hover:bg-[#2a2a2a]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleResetTwoFactor}
                className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30"
              >
                Reset 2FA
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={twoFactorDialogOpen} onOpenChange={setTwoFactorDialogOpen}>
          <DialogContent className="bg-[#1a1a1a] border-gray-700 text-white shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <DialogHeader>
              <DialogTitle className="text-[#00FF41]">Enable Two-Factor Authentication</DialogTitle>
              <DialogDescription className="text-gray-400">
                Scan the QR code with your authenticator app, then enter the code to verify.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {qrCodeUrl && (
                <div className="flex justify-center">
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 bg-white p-2 rounded-lg" />
                </div>
              )}
              {totpSecret && (
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">Or enter this secret manually:</div>
                  <code className="bg-[#0a0a0a] px-3 py-1 rounded text-[#00FF41] text-sm">{totpSecret}</code>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Enter verification code</label>
                <div className="flex gap-2 justify-center">
                  {totpDigits.map((digit, index) => (
                    <Input
                      key={index}
                      ref={inputRefs[index]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleTotpDigitChange(index, e.target.value, inputRefs[index + 1])}
                      onKeyDown={(e) => handleTotpKeyDown(index, e, inputRefs[index - 1])}
                      className="w-12 h-12 text-center text-xl bg-[#0a0a0a] border-gray-700 focus:border-[#00FF41] text-white"
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTwoFactorDialogOpen(false);
                  resetTotpDigits();
                  setTotpSecret('');
                  setQrCodeUrl('');
                }}
                className="border-gray-700 text-gray-300 hover:bg-[#252525] hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEnableTwoFactor}
                className="bg-[#00FF41] text-black hover:bg-[#00FF41]/90 shadow-[0_0_10px_rgba(0,255,65,0.5)] font-semibold"
              >
                Enable 2FA
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
