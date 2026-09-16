import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import {
  ArrowUpRight,
  BookOpen,
  Download,
  ExternalLink,
  Eye,
  FileCode2,
  FileText,
  FolderArchive,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  Check
} from 'lucide-react';

const KNOWLEDGE_GUIDES = [
  {
    id: 'onboarding',
    title: 'Andropedia Onboarding Guide',
    description: 'A concise field guide to joining a project, finding your role, and making your first verified contribution.',
    category: 'Onboarding',
    type: 'Guide',
    meta: '8 min read',
    icon: Sparkles,
    content: [
      'Choose an active project with an open membership or invite slot.',
      'Read the project brief and mission objectives before taking ownership of a task.',
      'Log work and updates as you go so the team and leads can see progress and give credit.'
    ]
  },
  {
    id: 'checklist',
    title: 'Engineering Review Checklist',
    description: 'Pre-flight checks for design reviews, documentation quality, security verification, and handoff readiness.',
    category: 'Guides',
    type: 'Checklist',
    meta: '',
    icon: FileCode2,
    content: [
      'Architecture and interface definitions are documented and agreed upon.',
      'Critical code paths have a test or hardware verification plan.',
      'A new team contributor can run the project environment locally with zero guesswork.',
      'Open engineering decisions have a designated owner and follow-up milestone.'
    ]
  },
  {
    id: 'playbook',
    title: 'Contribution Playbook',
    description: 'Patterns for logging useful work and telemetry so the club can see progress and verify credit accurately.',
    category: 'Guides',
    type: 'Playbook',
    meta: '',
    icon: BookOpen,
    content: [
      'Describe the exact change or delivery, not just the raw time spent.',
      'Link contributions directly to a specific task whenever possible.',
      'Attach concrete evidence such as a test result, benchmark metric, schematic, or commit reference.'
    ]
  }
];

const TAG_OPTIONS = ['all', 'doc', 'code', 'design', 'link'];

const getFileIcon = (title = '', type = '') => {
  if (type === 'link') return '🔗';
  const ext = title.split('.').pop()?.toLowerCase();
  if (['pdf'].includes(ext)) return '📄';
  if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext)) return '🖼️';
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return '📦';
  if (['py', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'cpp', 'c', 'rs'].includes(ext)) return '💻';
  return '📁';
};

const getExtension = (value = '') => value.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase();

const getPreviewKind = (resource) => {
  if (resource.type === 'link') {
    const extension = getExtension(resource.location);
    if (extension === 'pdf') return 'pdf';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
    return resource.location.includes('docs.google.com') || resource.location.includes('office.com') ? 'embed' : null;
  }
  const extension = getExtension(resource.title || resource.location);
  if (extension === 'pdf') return 'pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
  if (['txt', 'md', 'csv', 'json', 'html', 'py', 'js', 'css'].includes(extension)) return 'text';
  return null;
};

const ClubLibrary = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pool'); // 'pool' | 'guides'
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');

  // Common resources state
  const [commonResources, setCommonResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [addMode, setAddMode] = useState('file'); // 'file' | 'link'
  const [formData, setFormData] = useState({ title: '', location: '', tag: 'doc' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewResource, setPreviewResource] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const fileInputRef = useRef(null);

  // Selected guide reader modal
  const [selectedGuide, setSelectedGuide] = useState(null);

  const fetchCommonResources = async () => {
    setLoadingResources(true);
    try {
      const url = selectedTag && selectedTag !== 'all'
        ? `/resources/common?tag=${selectedTag}`
        : '/resources/common';
      const data = await api.get(url);
      setCommonResources(data || []);
    } catch (e) {
      console.error('Failed to fetch common resources', e);
    } finally {
      setLoadingResources(false);
    }
  };

  useEffect(() => {
    fetchCommonResources();
  }, [selectedTag]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.title) {
        setFormData((prev) => ({ ...prev, title: file.name }));
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
        setFormData((prev) => ({ ...prev, title: file.name }));
      }
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');
    setSubmitting(true);

    try {
      if (addMode === 'link') {
        if (!formData.location) throw new Error('Please provide a valid URL');
        await api.post('/resources/common', {
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

        const res = await fetch('/api/resources/common', {
          method: 'POST',
          body: fd,
          credentials: 'include',
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Upload failed');
        }
      }

      setShowUploadModal(false);
      setSelectedFile(null);
      setFormData({ title: '', location: '', tag: 'doc' });
      await fetchCommonResources();
    } catch (err) {
      setUploadError(err.message || 'Failed to save resource to common pool');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteResource = async (resId) => {
    if (!confirm('Are you sure you want to delete this resource from the common pool?')) return;
    try {
      await api.delete(`/resources/common/${resId}`);
      await fetchCommonResources();
    } catch (e) {
      alert(e.message || 'Failed to delete resource');
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter common resources by search query
  const filteredResources = useMemo(() => {
    return commonResources.filter((r) => {
      const q = query.toLowerCase();
      return (
        r.title?.toLowerCase().includes(q) ||
        r.tag?.toLowerCase().includes(q) ||
        r.uploader?.name?.toLowerCase().includes(q)
      );
    });
  }, [commonResources, query]);

  // Filter guides by search query
  const filteredGuides = useMemo(() => {
    return KNOWLEDGE_GUIDES.filter((item) => {
      const haystack = `${item.title} ${item.description} ${item.category} ${item.type}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [query]);

  return (
    <div className="library-page flex flex-col gap-8">
      {/* Hero Header */}
      <header className="library-hero">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-300">
            <BookOpen size={17} /> Club-Wide Knowledge Base & Assets
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
            The Library<span className="text-cyan-300">.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
            Shared club resource pool, technical references, operational playbooks, and past mission archives.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <Button
            variant="cyan"
            onClick={() => {
              setActiveTab('pool');
              setShowUploadModal(true);
            }}
            className="flex items-center gap-2 shadow-lg"
          >
            <Plus size={16} />
            <span>Upload Shared Asset</span>
          </Button>
        </div>
      </header>

      {/* Inline Past Projects Archive Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-surface/90 via-surface/70 to-surface/90 border border-cyan-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shrink-0">
            <FolderArchive size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base sm:text-lg font-bold text-text-primary tracking-wide">
                Past Missions & Projects Archive
              </h2>
              <Badge type="lead">Archive</Badge>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Browse completed club missions, decommissioned projects, outcomes, and retrospective insights.
            </p>
          </div>
        </div>

        <Link
          to="/projects?filter=archived"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-all shrink-0"
        >
          <span>Explore Past Projects</span>
          <ArrowUpRight size={15} />
        </Link>
      </div>

      {/* Library View Switcher Rail */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('pool')}
            className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer border ${
              activeTab === 'pool'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 glow-cyan font-bold'
                : 'bg-surface/60 text-text-secondary border-white/5 hover:text-text-primary'
            }`}
          >
            Common Resource Pool ({commonResources.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guides')}
            className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer border ${
              activeTab === 'guides'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 glow-cyan font-bold'
                : 'bg-surface/60 text-text-secondary border-white/5 hover:text-text-primary'
            }`}
          >
            Knowledge Guides ({KNOWLEDGE_GUIDES.length})
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 w-full sm:w-72">
          <label className="library-search w-full flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface/80 border border-white/10 text-text-muted">
            <Search size={15} />
            <input
              aria-label="Search the library"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={activeTab === 'pool' ? 'Search shared files & links...' : 'Search guides & checklists...'}
              className="bg-transparent border-0 outline-none text-xs font-mono text-text-primary placeholder:text-text-muted flex-1"
            />
          </label>
        </div>
      </div>

      {/* TAB 1: COMMON RESOURCE POOL */}
      {activeTab === 'pool' && (
        <div className="flex flex-col gap-6">
          {/* Tag Filter Bar */}
          <div className="flex gap-2 flex-wrap items-center">
            {TAG_OPTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition-all cursor-pointer border ${
                  selectedTag === tag
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/40 glow-cyan font-semibold'
                    : 'bg-surface/60 text-text-secondary border-white/5 hover:text-text-primary'
                }`}
              >
                {tag} {tag === 'all' ? `(${commonResources.length})` : ''}
              </button>
            ))}
          </div>

          {loadingResources ? (
            <div className="p-12 text-center text-text-secondary font-mono text-sm">
              Loading common resource pool...
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="library-empty">
              <UploadCloud size={32} className="text-cyan-400 opacity-60 mb-1" />
              <h2>No assets found in the common pool</h2>
              <p>Be the first to upload reference files, cheat sheets, schematics, or links for the club.</p>
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="mt-3 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 hover:bg-cyan-500/30 font-mono text-xs uppercase cursor-pointer"
              >
                Upload to Common Pool
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((r) => {
                const icon = getFileIcon(r.title, r.type);
                const isFile = r.type === 'file';
                const previewKind = getPreviewKind(r);
                const downloadUrl = `/api/resources/common/${r.id}/download`;
                const resourceUrl = isFile ? downloadUrl : r.location;
                const canDelete = r.uploaded_by === user?.id || user?.role === 'admin';

                return (
                  <Card key={r.id} elevated className="p-5 flex flex-col justify-between group hover:border-cyan-500/30 transition-all">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <span className="text-2xl" role="img" aria-label="file-icon">
                          {icon}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Badge type="lead">{r.tag}</Badge>
                          <Badge type={isFile ? 'active' : 'todo'}>{r.type}</Badge>
                        </div>
                      </div>

                      <h3 className="font-display font-bold text-sm text-text-primary tracking-wide group-hover:text-cyan-300 transition-colors line-clamp-2">
                        {r.title}
                      </h3>

                      <div className="mt-2 flex items-center gap-2 text-xs font-mono text-text-muted">
                        <span>by {r.uploader?.name || 'Club Member'}</span>
                        <span>·</span>
                        <span>{r.added_at ? new Date(r.added_at).toLocaleDateString() : 'Recent'}</span>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        {previewKind && (
                          <button
                            type="button"
                            onClick={() => setPreviewResource({ ...r, previewKind, resourceUrl })}
                            className="px-2.5 py-1 rounded-md bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/25 transition-colors font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={12} /> Preview
                          </button>
                        )}
                        {isFile ? (
                          <a
                            href={downloadUrl}
                            download
                            className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-text-secondary hover:text-text-primary transition-colors font-medium flex items-center gap-1"
                          >
                            <Download size={12} /> Download
                          </a>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(r.location, r.id)}
                              className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-text-secondary hover:text-text-primary transition-colors cursor-pointer flex items-center gap-1"
                            >
                              {copiedId === r.id ? <Check size={12} className="text-emerald-400" /> : null}
                              <span>{copiedId === r.id ? 'Copied' : 'Copy'}</span>
                            </button>
                            <a
                              href={r.location}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-400/30 text-amber-300 hover:bg-amber-500/25 transition-colors font-medium flex items-center gap-1"
                            >
                              Open <ExternalLink size={11} />
                            </a>
                          </>
                        )}
                      </div>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteResource(r.id)}
                          className="text-danger/60 hover:text-danger p-1 transition-colors cursor-pointer text-xs"
                          title="Delete asset from common pool"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CURATED GUIDES & PLAYBOOKS */}
      {activeTab === 'guides' && (
        <section className="library-grid">
          {filteredGuides.map((item) => {
            const Icon = item.icon;
            return (
              <article
                className="library-card"
                key={item.id}
                onClick={() => setSelectedGuide(item)}
              >
                <div className="library-card-icon">
                  <Icon size={21} />
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="library-card-type">
                      {item.category} · {item.type}
                    </span>
                    <h2>{item.title}</h2>
                  </div>
                  <ArrowUpRight size={17} className="library-card-arrow" />
                </div>
                <p>{item.description}</p>
                <footer>
                  <span>{item.meta}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGuide(item);
                    }}
                  >
                    Open resource
                  </button>
                </footer>
              </article>
            );
          })}
        </section>
      )}

      {/* Guide Quick Reader Modal */}
      {selectedGuide && (
        <div
          className="library-modal-backdrop"
          role="presentation"
          onClick={() => setSelectedGuide(null)}
        >
          <div
            className="library-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="library-guide-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="library-card-icon">
              {React.createElement(selectedGuide.icon, { size: 21 })}
            </div>
            <span className="library-card-type">
              {selectedGuide.category} · {selectedGuide.type}{selectedGuide.meta ? ` · ${selectedGuide.meta}` : ''}
            </span>
            <h2 id="library-guide-title">{selectedGuide.title}</h2>
            <p>{selectedGuide.description}</p>
            <div className="library-reader">
              <strong>Overview & Checklist</strong>
              {selectedGuide.content.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="library-modal-actions">
              <button type="button" onClick={() => setSelectedGuide(null)}>
                Close
              </button>
              <button
                type="button"
                className="library-open-button"
                onClick={() => setSelectedGuide(null)}
              >
                Mark as reviewed <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload/Add Modal for Common Pool */}
      {showUploadModal && (
        <Modal title="Upload to Common Resource Pool" onClose={() => setShowUploadModal(false)}>
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
              FILE UPLOAD (MAX 25MB)
            </button>
            <button
              type="button"
              onClick={() => setAddMode('link')}
              className={`py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                addMode === 'link'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 glow-cyan'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              EXTERNAL / DOC LINK
            </button>
          </div>

          <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">
            {addMode === 'file' ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    dragOver
                      ? 'border-cyan-400 bg-cyan-500/10'
                      : selectedFile
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-white/15 hover:border-white/30 bg-surface/40'
                  }`}
                >
                  <UploadCloud size={28} className={`mx-auto mb-2 ${selectedFile ? 'text-emerald-400' : 'text-text-muted'}`} />
                  {selectedFile ? (
                    <div>
                      <span className="font-mono text-xs text-emerald-400 font-semibold block">
                        {selectedFile.name}
                      </span>
                      <span className="text-[10px] font-mono text-text-muted">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Click or drag to change
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs text-text-secondary font-mono block">
                        Drag and drop file here, or <span className="text-cyan-400 underline">browse</span>
                      </span>
                      <span className="text-[10px] text-text-muted font-mono mt-1 block">
                        Supported: PDFs, Schematics, Code, Images, Archives (Up to 25MB)
                      </span>
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
              placeholder={selectedFile ? selectedFile.name : 'e.g. Flight Controller Schematic V2'}
              required={addMode === 'link'}
            />

            <div>
              <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">
                Classification Tag
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['doc', 'code', 'design', 'link'].map((tag) => (
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

            {uploadError && (
              <div className="text-danger font-mono text-xs p-2.5 rounded-lg bg-danger/10 border border-danger/20">
                {uploadError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowUploadModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="cyan" disabled={submitting}>
                {submitting ? 'Uploading...' : 'Publish to Common Pool'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* File Preview Modal */}
      {previewResource && (
        <Modal title={`Preview: ${previewResource.title}`} onClose={() => setPreviewResource(null)}>
          <div className="resource-preview-shell min-h-[350px] max-h-[70vh] flex items-center justify-center overflow-auto rounded-xl bg-base border border-white/10 p-4">
            {previewResource.previewKind === 'image' ? (
              <img src={previewResource.resourceUrl} alt={previewResource.title} className="max-w-full max-h-[60vh] object-contain rounded-lg" />
            ) : previewResource.previewKind === 'text' || previewResource.previewKind === 'pdf' || previewResource.previewKind === 'embed' ? (
              <iframe title={previewResource.title} src={previewResource.resourceUrl} className="w-full h-[55vh] rounded-lg border-0" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-center text-text-secondary p-8">
                <FileText size={32} className="text-cyan-400 opacity-60" />
                <span className="font-bold text-sm text-text-primary">Preview not supported in browser</span>
                <span className="text-xs">Please download the file to inspect its full contents.</span>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-white/10">
            <a
              href={previewResource.resourceUrl}
              download={previewResource.type === 'file'}
              target={previewResource.type === 'link' ? '_blank' : undefined}
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30 text-xs font-mono uppercase flex items-center gap-1.5 font-bold"
            >
              <Download size={13} /> Download Asset
            </a>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ClubLibrary;
