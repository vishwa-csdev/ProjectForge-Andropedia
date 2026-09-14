import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';

const TAG_OPTIONS = ['doc', 'link', 'code', 'design'];

const getFileIcon = (title, type) => {
  if (type === 'link') return '🔗';
  const ext = title.split('.').pop()?.toLowerCase();
  if (['pdf'].includes(ext)) return '📄';
  if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext)) return '🖼️';
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return '📦';
  if (['py', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'cpp', 'c', 'rs'].includes(ext)) return '💻';
  return '📁';
};

const ResourceLibrary = () => {
  const { id: projectId } = useParams();
  const [resources, setResources] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState('file'); // default to file upload
  const [formData, setFormData] = useState({ title: '', location: '', tag: 'doc' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const fileInputRef = useRef(null);

  const fetchData = async () => {
    try {
      const [projData, resData] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(activeTag ? `/projects/${projectId}/resources?tag=${activeTag}` : `/projects/${projectId}/resources`)
      ]);
      setProject(projData);
      setResources(resData || []);
    } catch (e) {
      console.error('Failed to load resources', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId, activeTag]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: file.name }));
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: file.name }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (addMode === 'link') {
        if (!formData.location) throw new Error('Please provide a valid URL');
        await api.post(`/projects/${projectId}/resources`, {
          type: 'link',
          title: formData.title || formData.location,
          location: formData.location,
          tag: formData.tag,
        });
      } else {
        if (!selectedFile) throw new Error('Please select a file to upload');
        const fd = new FormData();
        fd.append('file', selectedFile);
        fd.append('type', 'file');
        fd.append('title', formData.title || selectedFile.name);
        fd.append('tag', formData.tag);

        const res = await fetch(`/api/projects/${projectId}/resources`, {
          method: 'POST',
          body: fd,
          credentials: 'include',
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Upload failed');
        }
      }

      setShowAddModal(false);
      setSelectedFile(null);
      setFormData({ title: '', location: '', tag: 'doc' });
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to save resource');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (resId) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
      await api.delete(`/projects/${projectId}/resources/${resId}`);
      fetchData();
    } catch (e) {
      console.error('Failed to delete resource', e);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-mono text-sm">◈</span>
            <h1 className="font-display text-2xl font-bold text-text-primary tracking-wide">
              Resource Storage & Assets
            </h1>
          </div>
          <p className="text-text-secondary text-sm mt-0.5">
            {project?.name || 'Project Shared Repository'}
          </p>
        </div>

        <Button variant="cyan" onClick={() => setShowAddModal(true)}>
          Upload / Add Asset
        </Button>
      </div>

      {/* Tag Filters */}
      <div className="flex gap-2 flex-wrap pb-1">
        <button
          onClick={() => setActiveTag(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
            !activeTag
              ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/40 glow-cyan font-semibold'
              : 'bg-surface/60 text-text-secondary border-white/5 hover:text-text-primary hover:border-white/15'
          }`}
        >
          ALL ASSETS ({resources.length})
        </button>
        {TAG_OPTIONS.map(tag => {
          const count = resources.filter(r => r.tag === tag).length;
          return (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition-all cursor-pointer border ${
                activeTag === tag
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/40 glow-cyan font-semibold'
                  : 'bg-surface/60 text-text-secondary border-white/5 hover:text-text-primary hover:border-white/15'
              }`}
            >
              {tag} ({count})
            </button>
          );
        })}
      </div>

      {/* Resource Grid */}
      {loading ? (
        <div className="text-text-secondary p-12 text-center font-mono text-sm">
          Accessing orbital storage...
        </div>
      ) : resources.length === 0 ? (
        <Card className="text-center py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl border border-white/10">
            📦
          </div>
          <h3 className="font-display font-semibold text-text-primary text-base">
            No assets stored in this sector
          </h3>
          <p className="text-text-secondary text-xs max-w-sm">
            Upload CAD files, documentation, code repositories, or links for team members.
          </p>
          <Button variant="secondary" size="sm" onClick={() => setShowAddModal(true)} className="mt-2">
            Upload First Asset
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map(r => {
            const icon = getFileIcon(r.title, r.type);
            const isFile = r.type === 'file';
            const downloadUrl = `/api/projects/${projectId}/resources/${r.id}/download`;

            return (
              <Card key={r.id} className="flex flex-col justify-between gap-4 surface-hover group">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-xl border border-white/10 shrink-0 shadow-inner">
                    {icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-text-primary truncate group-hover:text-cyan-300 transition-colors">
                        {r.title}
                      </h4>
                      <Badge type={r.tag}>{r.tag}</Badge>
                    </div>

                    <div className="text-xs font-mono text-text-muted mt-1 truncate">
                      {isFile ? (
                        <span className="text-cyan-400/80">Stored File Asset</span>
                      ) : (
                        <span className="text-amber-400/80">{r.location}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                  <span className="text-text-muted">
                    {r.added_at ? new Date(r.added_at).toLocaleDateString() : '—'}
                  </span>

                  <div className="flex items-center gap-2">
                    {isFile ? (
                      <a
                        href={downloadUrl}
                        download
                        className="px-2.5 py-1 rounded-md bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/25 transition-colors font-medium flex items-center gap-1.5"
                      >
                        Download
                      </a>
                    ) : (
                      <>
                        <button
                          onClick={() => copyToClipboard(r.location, r.id)}
                          className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                        >
                          {copiedId === r.id ? 'Copied' : 'Copy'}
                        </button>
                        <a
                          href={r.location}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-400/30 text-amber-300 hover:bg-amber-500/25 transition-colors font-medium"
                        >
                          Open Link
                        </a>
                      </>
                    )}

                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-danger/60 hover:text-danger p-1 transition-colors cursor-pointer text-sm leading-none"
                      title="Delete asset"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload/Add Modal */}
      {showAddModal && (
        <Modal title="Store New Asset" onClose={() => setShowAddModal(false)}>
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-base rounded-xl border border-white/10 mb-5">
            <button
              type="button"
              onClick={() => setAddMode('file')}
              className={`py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                addMode === 'file'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 glow-cyan'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Binary File Upload
            </button>
            <button
              type="button"
              onClick={() => setAddMode('link')}
              className={`py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                addMode === 'link'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 glow-amber'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Remote Link / Repository
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {addMode === 'file' ? (
              <div>
                <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">
                  Select or Drag File (Max 25MB)
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    dragOver
                      ? 'border-cyan-400 bg-cyan-500/10 glow-cyan'
                      : selectedFile
                      ? 'border-emerald-400/50 bg-emerald-500/5'
                      : 'border-white/10 hover:border-white/20 bg-base/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span className="text-3xl">{selectedFile ? '✅' : '📁'}</span>
                  {selectedFile ? (
                    <div>
                      <div className="font-semibold text-sm text-text-primary">{selectedFile.name}</div>
                      <div className="font-mono text-xs text-text-muted mt-0.5">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium text-sm text-text-primary">Click to select file</div>
                      <div className="font-mono text-xs text-text-muted mt-1">or drag and drop into this zone</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Input
                label="Resource URL"
                type="url"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                placeholder="https://github.com/... or https://docs.google.com/..."
              />
            )}

            <Input
              label="Asset Label / Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={selectedFile ? selectedFile.name : "e.g. Navigation Architecture Diagram"}
              required={addMode === 'link'}
            />

            <div>
              <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">
                Classification Tag
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TAG_OPTIONS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setFormData({ ...formData, tag })}
                    className={`py-1.5 rounded-lg text-xs font-mono uppercase transition-all cursor-pointer border ${
                      formData.tag === tag
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 glow-cyan font-semibold'
                        : 'bg-base border-white/10 text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-danger font-mono text-xs p-2.5 rounded-lg bg-danger/10 border border-danger/20">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="cyan" disabled={submitting}>
                {submitting ? 'Uploading...' : 'Confirm Upload'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ResourceLibrary;
