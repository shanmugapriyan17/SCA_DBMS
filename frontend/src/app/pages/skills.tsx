import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { assessmentsApi } from '../../lib/api';

interface Assessment {
  _id: string; title: string; description: string;
  question_count: number; time_limit: number; difficulty: string;
  skill_ids: { skill_name: string; icon: string }[];
  career_role?: string;
}

const CAREER_ICONS: Record<string, string> = {
  'Data Scientist': '🔬', 'Full Stack Developer': '🌐', 'Frontend Developer': '🎨',
  'Backend Developer': '⚙️', 'Data Analyst': '📊', 'ML Engineer': '🤖',
  'DevOps Engineer': '🚀', 'Database Administrator': '🗄️',
};

const DIFF_CONFIG: Record<string, { label: string; color: string; textColor: string; icon: string; order: number }> = {
  beginner:     { label: 'Beginner',     color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', icon: '🌱', order: 0 },
  intermediate: { label: 'Intermediate', color: 'bg-amber-500',   textColor: 'text-amber-600 dark:text-amber-400',     icon: '⚡', order: 1 },
  advanced:     { label: 'Advanced',     color: 'bg-rose-500',    textColor: 'text-rose-600 dark:text-rose-400',       icon: '🔥', order: 2 },
};

export function SkillsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCareer, setSelectedCareer] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchAssessments(); }, []);

  async function fetchAssessments() {
    try {
      const response: any = await assessmentsApi.getAll();
      setAssessments(response.data?.assessments || []);
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
    } finally {
      setLoading(false);
    }
  }

  // Group by career role
  const careerGroups = assessments.reduce<Record<string, Assessment[]>>((acc, a) => {
    const key = a.career_role || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const careerNames = ['All', ...Object.keys(careerGroups).sort()];

  const filteredGroups = Object.entries(careerGroups)
    .filter(([career]) => selectedCareer === 'All' || career === selectedCareer)
    .map(([career, items]) => ({
      career,
      items: items
        .filter(a => !searchTerm || a.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => (DIFF_CONFIG[a.difficulty]?.order ?? 0) - (DIFF_CONFIG[b.difficulty]?.order ?? 0))
    }))
    .filter(g => g.items.length > 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading assessments…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Skill Assessments</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {assessments.length} assessments across {Object.keys(careerGroups).length} career paths — Beginner to Advanced
          </p>
        </div>

        {/* Search + Career Filter */}
        <div className="bg-white dark:bg-surface-dark p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-8">
          {/* Search bar */}
          <div className="relative mb-4">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Search assessments…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#131d26] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
            />
          </div>
          {/* Career tabs */}
          <div className="flex gap-2 flex-wrap">
            {careerNames.map(name => (
              <button key={name}
                onClick={() => setSelectedCareer(name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCareer === name
                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}>
                {name !== 'All' && <span>{CAREER_ICONS[name] || '💼'}</span>}
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Assessment Groups */}
        {filteredGroups.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <span className="text-5xl block mb-4">🔍</span>
            <p className="text-lg font-medium">No assessments found</p>
          </div>
        ) : (
          <div className="space-y-10">
            {filteredGroups.map(({ career, items }) => (
              <div key={career}>
                {/* Career header */}
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl">{CAREER_ICONS[career] || '💼'}</span>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{career}</h2>
                    <p className="text-sm text-slate-400">{items.length} assessments · Beginner → Advanced</p>
                  </div>
                  <Link to="/careers" className="ml-auto text-primary text-xs font-medium hover:underline flex items-center gap-1">
                    View Skill Gap <span className="material-icons text-sm">arrow_forward</span>
                  </Link>
                </div>

                {/* 3-column difficulty grid */}
                <div className="grid md:grid-cols-3 gap-4">
                  {items.map(assessment => {
                    const d = DIFF_CONFIG[assessment.difficulty] || DIFF_CONFIG.beginner;
                    const emoji = assessment.skill_ids[0]?.icon || '📚';
                    return (
                      <div key={assessment._id}
                        className="group relative bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                        {/* Top accent */}
                        <div className={`h-1 ${d.color}`} />
                        <div className="p-5">
                          {/* Icon + badge */}
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-3xl">{emoji}</span>
                            <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 ${d.textColor}`}>
                              <span>{d.icon}</span> {d.label}
                            </div>
                          </div>

                          <h3 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors text-sm leading-snug">
                            {assessment.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                            {assessment.description}
                          </p>

                          <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                            <span className="flex items-center gap-1">
                              <span className="material-icons text-sm">help_outline</span>
                              {assessment.question_count} Qs
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-icons text-sm">schedule</span>
                              {assessment.time_limit} min
                            </span>
                          </div>

                          <Link to={`/test/${assessment._id}`}
                            className="block w-full py-2 text-center rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-sm hover:shadow-primary/20">
                            Start Assessment →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
