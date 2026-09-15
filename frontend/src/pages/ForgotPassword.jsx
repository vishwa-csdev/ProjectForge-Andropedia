import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { api } from '../api';
import { neonAuth, requestNeonPasswordReset } from '../auth';
import BrandMark from '../components/BrandMark';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (neonAuth) {
        const response = await requestNeonPasswordReset(email);
        if (response?.error) throw new Error(response.error.message || 'Recovery request failed');
        setResult({ message: 'If that account exists, a Neon Auth recovery link has been sent.' });
      } else {
        setResult(await api.post('/auth/forgot-password', { email }));
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,240,255,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(255,180,84,0.08),transparent_45%)]" />
      <div className="w-full max-w-md bg-surface/90 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative">
        <div className="flex flex-col items-center mb-8 text-center">
          <BrandMark className="mb-4" />
          <h1 className="font-display text-2xl font-bold text-text-primary tracking-wide">Recovery Gateway</h1>
          <p className="text-xs font-mono text-cyan-400/80 mt-1 uppercase tracking-widest">RESTORE ACCESS CREDENTIALS</p>
        </div>
        {!result ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input label="Operative Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="operative@andropedia.club" />
            {error && <div className="text-danger font-mono text-xs p-3 rounded-lg bg-danger/10 border border-danger/20">{error}</div>}
            <Button type="submit" variant="cyan" className="w-full font-mono uppercase" disabled={submitting}>{submitting ? 'Generating Link...' : 'Transmit Recovery Request'}</Button>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="p-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-sm text-emerald-300">{result.message}</div>
            {result.recovery_link && <Button variant="cyan" className="w-full font-mono uppercase" onClick={() => navigate(new URL(result.recovery_link).pathname + new URL(result.recovery_link).search)}>Open Direct Simulation Link</Button>}
          </div>
        )}
        <div className="mt-6 text-center"><Link to="/login" className="text-xs font-mono text-text-secondary hover:text-cyan-300">RETURN TO AUTHENTICATION</Link></div>
      </div>
    </div>
  );
};

export default ForgotPassword;