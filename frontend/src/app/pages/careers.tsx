import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { careersApi, assessmentsApi, skillsApi } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';

interface Skill { _id: string; skill_name: string; icon: string; score?: number; required_score?: number; gap?: number; importance?: string; }
interface Career {
  _id: string; title: string; description: string; industry: string;
  avg_salary: string; growth_outlook: string;
  required_skills: { skill_id: Skill; required_level: number; importance: string }[];
}
interface Assessment { _id: string; title: string; difficulty: string; question_count: number; time_limit: number; career_role: string; }
interface SkillGap { skill_name: string; icon: string; user_score: number; required_score: number; gap: number; importance: string; }

const CAREER_ICONS: Record<string, string> = {
  'Data Scientist': '🔬', 'Full Stack Developer': '🌐', 'Frontend Developer': '🎨',
  'Backend Developer': '⚙️', 'Data Analyst': '📊', 'ML Engineer': '🤖',
  'DevOps Engineer': '🚀', 'Database Administrator': '🗄️',
};

const GROWTH_COLOR: Record<string, string> = {
  'High demand': 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20',
  'Growing': 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
  'Stable': 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20',
};

const DIFF_CONFIG: Record<string, { color: string; bg: string; icon: string; order: number }> = {
  beginner:     { color: 'text-emerald-600', bg: 'bg-emerald-500', icon: '🌱', order: 0 },
  intermediate: { color: 'text-amber-600',   bg: 'bg-amber-500',   icon: '⚡', order: 1 },
  advanced:     { color: 'text-rose-600',     bg: 'bg-rose-500',    icon: '🔥', order: 2 },
};

export function CareersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [careers, setCareers] = useState<Career[]>([]);
  const [selected, setSelected] = useState<Career | null>(null);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [gapLoading, setGapLoading] = useState(false);
  const [tab, setTab] = useState<'overview' | 'gap' | 'path'>('overview');
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  useEffect(() => { fetchCareers(); }, []);

  async function fetchCareers() {
    try {
      const res: any = await careersApi.getAll();
      setCareers(res.data?.careers || []);
    } catch { flash('Failed to load careers'); }
    finally { setLoading(false); }
  }

  async function selectCareer(career: Career) {
    setSelected(career);
    setTab('overview');
    setSkillGaps([]);
    setAssessments([]);
  }

  async function loadGapAndPath(career: Career) {
    setGapLoading(true);
    try {
      const [gapRes, assRes]: any[] = await Promise.all([
        careersApi.getSkillGap(career._id),
        assessmentsApi.getAll({ career_role: career.title }),
      ]);
      setSkillGaps(gapRes.data?.skill_gaps || []);
      const sorted = (assRes.data?.assessments || []).sort(
        (a: Assessment, b: Assessment) =>
          (DIFF_CONFIG[a.difficulty]?.order ?? 0) - (DIFF_CONFIG[b.difficulty]?.order ?? 0)
      );
      setAssessments(sorted);
    } catch { flash('Login to see your personal skill gap'); }
    finally { setGapLoading(false); }
  }

  const overallMatch = selected && skillGaps.length > 0
    ? Math.round(skillGaps.filter(g => g.gap === 0).length / skillGaps.length * 100)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading career paths…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {toast && (
        <div className="fixed top-24 right-6 z-[100] px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white bg-primary animate-pulse">
          {toast}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Career Explorer</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Browse {careers.length} tech career paths — see required skills, salary, and your personalized learning path
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── LEFT: Career List ── */}
          <div className="space-y-3">
            {careers.map(career => (
              <button
                key={career._id}
                onClick={() => selectCareer(career)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                  selected?._id === career._id
                    ? 'bg-primary/10 border-primary shadow-sm shadow-primary/20'
                    : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-slate-800 hover:border-primary/40 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{CAREER_ICONS[career.title] || '💼'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${selected?._id === career._id ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                      {career.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{career.avg_salary}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${GROWTH_COLOR[career.growth_outlook] || GROWTH_COLOR['Stable']}`}>
                    {career.growth_outlook}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* ── RIGHT: Career Detail ── */}
          <div className="lg:col-span-2">
            {!selected ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400">
                <span className="text-6xl mb-4">💼</span>
                <p className="text-lg font-medium">Select a career to explore</p>
                <p className="text-sm mt-1">See required skills, salary, and your learning path</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Career Hero */}
                <div className="bg-gradient-to-r from-primary to-blue-600 p-6">
                  <div className="flex items-center gap-4">
                    <span className="text-5xl">{CAREER_ICONS[selected.title] || '💼'}</span>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selected.title}</h2>
                      <p className="text-blue-100 text-sm mt-1">{selected.industry} · {selected.avg_salary}</p>
                    </div>
                    {overallMatch !== null && (
                      <div className="ml-auto text-center bg-white/20 rounded-xl px-4 py-2">
                        <p className="text-3xl font-bold text-white">{overallMatch}%</p>
                        <p className="text-blue-100 text-xs">Your Match</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 dark:border-slate-800">
                  {(['overview', 'gap', 'path'] as const).map(t => (
                    <button key={t} onClick={() => {
                      setTab(t);
                      if ((t === 'gap' || t === 'path') && skillGaps.length === 0) loadGapAndPath(selected);
                    }}
                      className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px capitalize ${
                        tab === t ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}>
                      {t === 'overview' ? '📋 Overview' : t === 'gap' ? '🔍 Skill Gap' : '🗺️ Learning Path'}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {/* OVERVIEW TAB */}
                  {tab === 'overview' && (
                    <div className="space-y-6">
                      <p className="text-slate-600 dark:text-slate-300">{selected.description}</p>
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-3">Required Skills</h3>
                        <div className="space-y-2">
                          {selected.required_skills.map((rs, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-lg">{rs.skill_id.icon || '📚'}</span>
                              <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{rs.skill_id.skill_name}</span>
                                  <span className="text-xs text-slate-400">{rs.required_level}% required</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${rs.required_level}%` }} />
                                </div>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rs.importance === 'must_have' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                                {rs.importance === 'must_have' ? 'Required' : 'Nice to have'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => { setTab('gap'); loadGapAndPath(selected); }}
                        className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all">
                        Analyze My Skill Gap →
                      </button>
                    </div>
                  )}

                  {/* SKILL GAP TAB */}
                  {tab === 'gap' && (
                    gapLoading ? (
                      <div className="py-12 text-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>
                    ) : skillGaps.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <span className="text-4xl block mb-3">📊</span>
                        <p className="font-medium mb-1">No skill data yet</p>
                        <p className="text-sm mb-4">Take assessments to see your personal skill gap for this career</p>
                        <button onClick={() => setTab('path')} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium">
                          See Learning Path →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {skillGaps.map((g, i) => {
                          const pct = Math.min(100, (g.user_score / g.required_score) * 100);
                          const met = g.gap === 0;
                          return (
                            <div key={i} className={`p-4 rounded-xl border ${met ? 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-900/10 dark:border-emerald-800' : 'border-orange-200 bg-orange-50/50 dark:bg-orange-900/10 dark:border-orange-800'}`}>
                              <div className="flex justify-between mb-2">
                                <span className="font-medium text-slate-800 dark:text-slate-200">{g.skill_name}</span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${met ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                                  {met ? '✅ Met' : `Gap: ${g.gap}pts`}
                                </span>
                              </div>
                              <div className="flex gap-2 text-xs text-slate-500 mb-2">
                                <span>Your score: <strong>{g.user_score}%</strong></span>
                                <span>·</span>
                                <span>Required: <strong>{g.required_score}%</strong></span>
                              </div>
                              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${met ? 'bg-emerald-500' : 'bg-orange-400'}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                        <button onClick={() => setTab('path')} className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all mt-2">
                          View My Learning Path →
                        </button>
                      </div>
                    )
                  )}

                  {/* LEARNING PATH TAB */}
                  {tab === 'path' && (
                    gapLoading ? (
                      <div className="py-12 text-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>
                    ) : assessments.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <span className="text-4xl block mb-3">📚</span>
                        <p>No assessments found for this career</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                          Complete these assessments in order — from Beginner to Advanced — to build your {selected.title} profile.
                        </p>
                        {(['beginner', 'intermediate', 'advanced'] as const).map(level => {
                          const levelAssessments = assessments.filter(a => a.difficulty === level);
                          if (!levelAssessments.length) return null;
                          const d = DIFF_CONFIG[level];
                          return (
                            <div key={level} className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                              <div className={`${d.bg} px-4 py-2 flex items-center gap-2`}>
                                <span>{d.icon}</span>
                                <span className="text-white font-semibold capitalize text-sm">{level}</span>
                              </div>
                              {levelAssessments.map(a => (
                                <div key={a._id} className="p-4 flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 first:border-0">
                                  <div>
                                    <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{a.title}</p>
                                    <p className="text-xs text-slate-400">{a.question_count} questions · {a.time_limit} min</p>
                                  </div>
                                  <Link to={`/test/${a._id}`}
                                    className="flex-shrink-0 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all">
                                    Start →
                                  </Link>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
