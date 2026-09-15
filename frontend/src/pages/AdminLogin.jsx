import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { adminLogin, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'admin') navigate('/admin');
  }, [user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await adminLogin(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Administrator credentials rejected');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role === 'admin') return null;

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface/90 border border-amber-400/20 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <img src="/andropedia-logo.jpg" alt="Andropedia" className="w-36 h-28 mx-auto object-contain rounded-xl mb-4" />
          <h1 className="font-display text-2xl font-bold text-text-primary">Administrator access</h1>
          <p className="text-xs font-mono text-amber-300/80 mt-2 uppercase tracking-widest">Restricted control deck</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input label="Administrator email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" />
          <Input label="Administrator passcode" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
          {error && <div className="text-danger font-mono text-xs p-3 rounded-lg bg-danger/10 border border-danger/20">{error}</div>}
          <Button type="submit" variant="cyan" className="w-full mt-2 font-mono text-sm uppercase py-2.5" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying access...' : 'Enter admin deck'}
          </Button>
        </form>
        <div className="mt-6 text-center flex flex-col gap-3">
          <Link to="/login" className="text-xs font-mono text-text-secondary hover:text-cyan-300 transition-colors">Return to member login</Link>
          <Link to="/forgot-password" className="text-xs font-mono text-text-secondary hover:text-cyan-300 transition-colors">Recover credentials</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
