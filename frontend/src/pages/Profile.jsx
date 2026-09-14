import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const updatedUser = await api.put('/auth/me', { name });
      setUser(updatedUser);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update operative record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedDate = user?.joined_at ? new Date(user.joined_at).toLocaleDateString() : 'Unknown';
  const role = user?.role || 'user';

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <span className="text-cyan-400 font-mono text-base">⌬</span>
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary tracking-wide">
            Operative Dossier
          </h1>
          <p className="text-xs font-mono text-text-secondary mt-0.5 uppercase">
            SECURITY CLEARANCE LEVEL & CREDENTIALS
          </p>
        </div>
      </div>
      
      <Card elevated className="p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center relative z-10">
          <div className="relative mb-6">
            <Avatar name={user?.name || ''} size="lg" className="w-24 h-24 text-3xl shadow-[0_0_25px_rgba(0,240,255,0.2)] border-2 border-cyan-400/40" />
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-400 border-2 border-surface shadow-[0_0_8px_#10B981]" />
          </div>
          
          {isEditing ? (
            <div className="w-full max-w-sm flex flex-col gap-4">
              <Input 
                label="Operative Name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
              {error && <div className="text-danger font-mono text-xs">{error}</div>}
              <div className="flex gap-3 justify-center mt-2">
                <Button variant="secondary" onClick={() => { setIsEditing(false); setName(user?.name || ''); }}>
                  Cancel
                </Button>
                <Button variant="cyan" onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl font-bold text-text-primary mb-1 tracking-wide">
                {user?.name}
              </h2>
              <div className="text-text-secondary font-mono text-xs mb-4">{user?.email}</div>
              
              <div className="flex gap-3 items-center mb-8 flex-wrap justify-center">
                <Badge type={role === 'admin' ? 'admin' : 'lead'}>{role}</Badge>
                <span className="font-mono text-xs text-text-muted bg-white/5 border border-white/5 px-2.5 py-1 rounded-full">
                  Commissioned: {formattedDate}
                </span>
              </div>
              
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Modify Operative Name
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Profile;
