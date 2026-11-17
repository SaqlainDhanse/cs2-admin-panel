
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Helmet } from 'react-helmet';
import Brand from '@/components/Brand.jsx';
import { activeBrand } from '@/themes';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpDigits, setTotpDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminEmails, setAdminEmails] = useState([]);
  const [requires2FA, setRequires2FA] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(false);

  useEffect(() => {
    const fetchAdminEmails = async () => {
      try {
        const response = await fetch('/api/admin-emails');
        if (response.ok) {
          const data = await response.json();
          setAdminEmails(data.emails || []);
        }
      } catch (err) {
        console.error('Failed to fetch admin emails:', err);
      }
    };

    fetchAdminEmails();
  }, []);

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

  const handleTotpKeyDown = (index, e, prevInputRef) => {
    if (e.key === 'Backspace' && !totpDigits[index] && prevInputRef) {
      prevInputRef.current?.focus();
    }
  };

  const getTotpCode = () => totpDigits.join('');

  const resetTotpDigits = () => setTotpDigits(['', '', '', '', '', '']);

  useEffect(() => {
    if (requires2FA && inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, [requires2FA]);

  const handleForgotPassword = () => {
    const subject = encodeURIComponent('Password Reset Request - CS2 Admin Panel');
    const body = encodeURIComponent(
      'Hello Administrator,\n\nI am requesting a password reset for the CS2 Admin Panel.\n\nPlease assist me with resetting my account password.\n\nThank you.'
    );
    const mailtoLink = `mailto:${adminEmails.join(',')}?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const code = getTotpCode();
      await login(username, password, code, stayLoggedIn);
      const redirectParam = searchParams.get('redirect');
      const redirectPath = redirectParam ? decodeURIComponent(redirectParam) : '/dashboard';
      navigate(redirectPath);
    } catch (err) {
      if (err.message === '2FA code required') {
        setRequires2FA(true);
        setError('');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - {activeBrand.appName}</title>
        <meta name="description" content={`Login to ${activeBrand.appName} to manage your game servers`} />
      </Helmet>
      <div
        className="min-h-screen flex items-center justify-center p-4 relative"
        style={{
          backgroundImage: 'var(--theme-bg-image, url(https://images.unsplash.com/photo-1698216605861-54f2bce18350))',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: 'rgb(var(--theme-background-color-rgb) / 0.6)' }} />
        
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-canvas border border-line-subtle rounded-lg p-8 shadow-2xl">
            <h1 className="text-3xl font-bold text-center mb-2 text-theme" style={{ textShadow: '0 0 15px rgb(var(--theme-primary-rgb) / 0.6)' }}>
              <Brand placement="login" className="mx-auto" />
            </h1>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>

              {requires2FA && (
                <div className="space-y-2">
                  <Label htmlFor="totpCode">Two-Factor Authentication Code</Label>
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
                        className="w-12 h-12 text-center text-xl bg-canvas border-line focus:border-theme text-ink"
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="stayLoggedIn"
                  checked={stayLoggedIn}
                  onChange={(e) => setStayLoggedIn(e.target.checked)}
                  className="w-4 h-4 rounded border-line bg-canvas text-theme focus:ring-theme focus:ring-offset-[#0a0a0a]"
                />
                <Label htmlFor="stayLoggedIn" className="text-ink cursor-pointer">Stay logged in</Label>
              </div>

              {error && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-theme text-black font-bold hover:bg-theme/90 transition-all duration-300 shadow-[0_0_20px_rgb(var(--theme-primary-rgb)_/_0.5)] hover:shadow-[0_0_30px_rgb(var(--theme-primary-rgb)_/_0.7)]"
              >
                {loading ? 'Logging in...' : requires2FA ? 'Verify' : 'LOGIN'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={adminEmails.length === 0}
                className="text-theme hover:text-theme/80 transition-colors disabled:text-ink-faint disabled:cursor-not-allowed"
              >
                Forgot Password?
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
