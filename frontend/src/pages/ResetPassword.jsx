import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { api } from '../api';
import { neonAuth } from '../auth';
import BrandMark from '../components/BrandMark';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState(new URLSearchParams(location.search).get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const valid = password.length >= 6 && password === confirmation;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    setError('');
    try {
      if (neonAuth) {
        const response = await neonAuth.resetPassword({ newPassword: password });
        if (response?.error) throw new Error(response.error.message || 'Password reset failed');
      } else {
        await api.post('/auth/reset-password', { token, new_password: password });
      }
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1400);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,240,255,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(255,180,84,0.08),transparent_45%)]" />
      <div className="w-full max-w-md bg-surface/90 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative">
        <div className="flex flex-col items-center mb-8 text-center"><BrandMark className="mb-4" /><h1 className="font-display text-2xl font-bold">Set New Passcode</h1><p className="text-xs font-mono text-cyan-400/80 mt-1 uppercase tracking-widest">SECURE CREDENTIAL ROTATION</p></div>
        {success ? <div className="p-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-sm text-emerald-300 text-center">Passcode updated. Returning to authentication...</div> : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {!token && <Input label="Recovery Token" value={token} onChange={(event) => setToken(event.target.value)} required />}
            <Input label="New Passcode" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
            <Input label="Confirm Passcode" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
            <div className={`text-xs font-mono ${password && valid ? 'text-emerald-400' : 'text-text-muted'}`}>{password ? (valid ? 'PASSCODE MATCH CONFIRMED' : 'USE 6+ CHARACTERS AND MATCH BOTH FIELDS') : 'MINIMUM 6 CHARACTERS'}</div>
            {error && <div className="text-danger font-mono text-xs p-3 rounded-lg bg-danger/10 border border-danger/20">{error}</div>}
            <Button type="submit" variant="cyan" className="w-full font-mono uppercase" disabled={submitting || !valid || !token}>{submitting ? 'Rotating Passcode...' : 'Commit New Passcode'}</Button>
          </form>
        )}
        <div className="mt-6 text-center"><Link to="/login" className="text-xs font-mono text-text-secondary hover:text-cyan-300">RETURN TO AUTHENTICATION</Link></div>
      </div>
    </div>
  );
};

export default ResetPassword;