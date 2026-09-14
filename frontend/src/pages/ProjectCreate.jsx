import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const ProjectCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'open',
    deadline: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        visibility: formData.visibility, // 'open' or 'invite'
        status: 'active',
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
      };
      const newProject = await api.post('/projects', payload);
      if (newProject && newProject.id) {
        navigate(`/projects/${newProject.id}`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize project');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-cyan-400 font-mono text-base">◈</span>
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary tracking-wide">
            Initiate Mission Project
          </h1>
          <p className="text-xs font-mono text-text-secondary mt-0.5">
            NEW PROJECT SPECIFICATION MANIFEST
          </p>
        </div>
      </div>
      
      <Card elevated>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Input 
            label="Project Call-Sign / Title" 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            required
            placeholder="e.g. Autonomous Mars Rover V2"
          />
          
          <Input 
            as="textarea"
            label="Mission Objectives & Specifications" 
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            required
            placeholder="Outline goals, architecture, required technical disciplines, and deliverables..."
            className="min-h-[120px] resize-y"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-text-secondary uppercase">Access Model</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({...formData, visibility: 'open'})}
                className={`py-2.5 px-4 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer border ${
                  formData.visibility === 'open' 
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 glow-cyan font-semibold' 
                    : 'bg-base border-white/10 text-text-secondary hover:text-text-primary'
                }`}
              >
                OPEN TO CLUB MEMBERS
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, visibility: 'invite'})}
                className={`py-2.5 px-4 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer border ${
                  formData.visibility === 'invite' 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 glow-amber font-semibold' 
                    : 'bg-base border-white/10 text-text-secondary hover:text-text-primary'
                }`}
              >
                INVITE / LEAD-APPROVAL ONLY
              </button>
            </div>
          </div>

          <Input 
            label="Target Completion Deadline (optional)" 
            type="date"
            value={formData.deadline}
            onChange={e => setFormData({...formData, deadline: e.target.value})}
          />
          
          {error && (
            <div className="text-danger font-mono text-xs p-3 rounded-lg bg-danger/10 border border-danger/20">
              {error}
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" variant="cyan" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Initiate Project'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProjectCreate;
