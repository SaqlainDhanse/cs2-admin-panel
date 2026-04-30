
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Helmet } from 'react-helmet';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - CS2 Servers Admin Panel</title>
        <meta name="description" content="Login to CS2 Servers Admin Panel to manage your game servers" />
      </Helmet>
      <div
        className="min-h-screen flex items-center justify-center p-4 relative"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1698216605861-54f2bce18350)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/80" />
        
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-8 shadow-2xl">
            <h1 className="text-3xl font-bold text-center mb-2 text-[#00FF41]" style={{ textShadow: '0 0 15px rgba(0, 255, 65, 0.6)' }}>
              CS2 SERVERS
            </h1>
            <p className="text-center text-gray-400 mb-8">Admin Panel Login</p>

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

              {error && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00FF41] text-black font-bold hover:bg-[#00FF41]/90 transition-all duration-300 shadow-[0_0_20px_rgba(0,255,65,0.5)] hover:shadow-[0_0_30px_rgba(0,255,65,0.7)]"
              >
                {loading ? 'Logging in...' : 'LOGIN'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Demo credentials:</p>
              <p className="text-[#00FF41] mt-1">admin@cs2servers.com / Admin123!</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
