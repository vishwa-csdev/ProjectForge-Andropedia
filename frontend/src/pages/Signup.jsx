import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await signup(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration rejected by central hub');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user) return null;

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md bg-surface/80 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-amber-400 flex items-center justify-center text-gray-950 font-bold font-mono text-xl shadow-[0_0_20px_rgba(0,240,255,0.4)] mb-4">
            AH
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary tracking-wide">
            Register Operative
          </h1>
          <p className="text-xs font-mono text-cyan-400/80 mt-1 uppercase tracking-widest">
            ENLIST IN ANDROPEDIA GUILD
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input 
            label="Full Operative Name" 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Sarah Connor"
          />

          <Input 
            label="Club Email Address" 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="operative@andropedia.club"
          />
          
          <Input 
            label="Create Secure Passcode" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
          
          {error && (
            <div className="text-danger font-mono text-xs p-3 rounded-lg bg-danger/10 border border-danger/20">
              {error}
            </div>
          )}
          
          <Button 
            type="submit" 
            variant="cyan" 
            className="w-full mt-2 font-mono text-sm uppercase py-2.5"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registering...' : 'Complete Enlistment'}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <Link to="/login" className="text-xs font-mono text-text-secondary hover:text-cyan-300 transition-colors">
            ALREADY REGISTERED? PROCEED TO SIGN IN
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
