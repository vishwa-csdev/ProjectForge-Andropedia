import React, { useMemo, useState } from 'react';
import { ArrowUpRight, BookOpen, FileCode2, FileText, FolderArchive, Search, Sparkles } from 'lucide-react';

const LIBRARY_ITEMS = [
  { id: 1, title: 'Andropedia onboarding guide', description: 'A concise field guide to joining a project, finding your role, and making your first contribution.', category: 'Onboarding', type: 'Guide', meta: '8 min read', icon: Sparkles },
  { id: 2, title: 'Project brief template', description: 'A reusable starting point for scope, objectives, risks, milestones, and ownership.', category: 'Templates', type: 'Template', meta: 'DOCX template', icon: FileText },
  { id: 3, title: 'Engineering review checklist', description: 'Pre-flight checks for design reviews, documentation quality, and handoff readiness.', category: 'Guides', type: 'Checklist', meta: '12 checks', icon: FileCode2 },
  { id: 4, title: 'Past projects archive', description: 'Browse completed club missions, their reports, and the decisions that shaped them.', category: 'Archives', type: 'Archive', meta: '12 projects', icon: FolderArchive },
  { id: 5, title: 'Contribution playbook', description: 'Patterns for logging useful work so the club can see progress and give credit accurately.', category: 'Guides', type: 'Playbook', meta: '6 chapters', icon: BookOpen },
  { id: 6, title: 'Club report format', description: 'The shared structure for clear project summaries, outcomes, and next steps.', category: 'Templates', type: 'Template', meta: 'PDF template', icon: FileText },
];

const CATEGORIES = ['All', ...new Set(LIBRARY_ITEMS.map((item) => item.category))];

const ClubLibrary = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState(null);
  const filteredItems = useMemo(() => LIBRARY_ITEMS.filter((item) => {
    const matchesCategory = category === 'All' || item.category === category;
    const haystack = `${item.title} ${item.description} ${item.category} ${item.type}`.toLowerCase();
    return matchesCategory && haystack.includes(query.toLowerCase());
  }), [category, query]);

  return (
    <div className="library-page">
      <header className="library-hero">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-300"><BookOpen size={17} /> Club-wide knowledge base</div>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">The Library<span className="text-cyan-300">.</span></h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">Reference material, templates, guides, and past work for every Andropedia member.</p>
        </div>
        <div className="library-count"><strong>{filteredItems.length}</strong><span>resources in view</span></div>
      </header>

      <section className="library-toolbar" aria-label="Library filters">
        <label className="library-search"><Search size={17} /><input aria-label="Search the club library" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search guides, templates, archives..." /></label>
        <div className="library-filters">{CATEGORIES.map((item) => <button type="button" key={item} onClick={() => setCategory(item)} className={`library-filter ${category === item ? 'is-active' : ''}`}>{item}</button>)}</div>
      </section>

      {filteredItems.length ? <section className="library-grid">{filteredItems.map((item) => { const Icon = item.icon; return <article className="library-card" key={item.id} onClick={() => setSelected(item)}><div className="library-card-icon"><Icon size={21} /></div><div className="flex items-start justify-between gap-3"><div><span className="library-card-type">{item.category} · {item.type}</span><h2>{item.title}</h2></div><ArrowUpRight size={17} className="library-card-arrow" /></div><p>{item.description}</p><footer><span>{item.meta}</span><button type="button" onClick={(event) => { event.stopPropagation(); setSelected(item); }}>Open resource</button></footer></article>; })}</section> : <div className="library-empty"><Search size={24} /><h2>No resources match that search</h2><p>Try another phrase or reset the category filter.</p><button type="button" onClick={() => { setQuery(''); setCategory('All'); }}>Reset filters</button></div>}

      {selected && <div className="library-modal-backdrop" role="presentation" onClick={() => setSelected(null)}><div className="library-modal" role="dialog" aria-modal="true" aria-labelledby="library-resource-title" onClick={(event) => event.stopPropagation()}><div className="library-card-icon">{React.createElement(selected.icon, { size: 21 })}</div><span className="library-card-type">{selected.category} · {selected.type}</span><h2 id="library-resource-title">{selected.title}</h2><p>{selected.description}</p><div className="library-modal-actions"><button type="button" onClick={() => setSelected(null)}>Close</button><button type="button" className="library-open-button" onClick={() => setSelected(null)}>Open resource <ArrowUpRight size={15} /></button></div></div></div>}
    </div>
  );
};

export default ClubLibrary;
