import { useState, useEffect, useRef } from 'react';
import { assessmentsApi, skillsApi } from '../../lib/api';

/* ───────── Types ───────── */
interface Skill { _id: string; skill_name: string; icon: string; category: string }
interface Assessment {
    _id: string; title: string; description: string;
    question_count: number; time_limit: number; difficulty: string;
    is_active: boolean; skill_ids: Skill[];
}
interface Question {
    _id: string; content: string; options: string[];
    correct_answer: string; difficulty: number; explanation: string;
    skill_id: { _id: string; skill_name: string } | string;
}

const emptyAssessment = { title: '', description: '', skill_ids: [] as string[], question_count: 10, time_limit: 15, difficulty: 'beginner' };
const emptyQuestion = { content: '', options: ['', '', '', ''], correct_answer: 'A', difficulty: 1, explanation: '', skill_id: '' };

const diffBadge: Record<string, string> = {
    beginner: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    intermediate: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    advanced: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
};

/* ═══════════════════════════════════════ */
/*            MAIN COMPONENT              */
/* ═══════════════════════════════════════ */
export function AssessmentsPage() {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);

    // Assessment modal
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...emptyAssessment });
    const [saving, setSaving] = useState(false);

    // Questions panel
    const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [questionsLoading, setQuestionsLoading] = useState(false);
    const [showQForm, setShowQForm] = useState(false);
    const [editingQId, setEditingQId] = useState<string | null>(null);
    const [qForm, setQForm] = useState({ ...emptyQuestion });
    const [savingQ, setSavingQ] = useState(false);

    // Toast + delete confirm
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string; type: 'assessment' | 'question'; qid?: string } | null>(null);

    // Search
    const [search, setSearch] = useState('');
    const [filterDiff, setFilterDiff] = useState('all');
    const [showInactive, setShowInactive] = useState(false);

    // Scroll position cache
    const listRef = useRef<HTMLDivElement>(null);

    /* ── helpers ── */
    function flash(msg: string, type: 'success' | 'error' = 'success') {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    }

    /* ── fetch data ── */
    useEffect(() => { loadAll(); }, []);

    async function loadAll() {
        try {
            const [aRes, sRes]: any = await Promise.all([
                assessmentsApi.getAll({ showAll: 'true' } as any),
                skillsApi.getAll()
            ]);
            setAssessments(aRes.data?.assessments || []);
            setSkills(sRes.data?.skills || []);
        } catch { flash('Failed to load data', 'error'); }
        finally { setLoading(false); }
    }

    /* ── assessment CRUD ── */
    function openCreate() {
        setEditingId(null);
        setForm({ ...emptyAssessment });
        setShowModal(true);
    }

    function openEdit(a: Assessment) {
        setEditingId(a._id);
        setForm({
            title: a.title, description: a.description,
            skill_ids: a.skill_ids.map(s => s._id),
            question_count: a.question_count, time_limit: a.time_limit,
            difficulty: a.difficulty,
        });
        setShowModal(true);
    }

    async function saveAssessment() {
        setSaving(true);
        try {
            if (editingId) {
                await assessmentsApi.update(editingId, form);
                flash('Assessment updated');
            } else {
                await assessmentsApi.create(form);
                flash('Assessment created');
            }
            setShowModal(false);
            await loadAll();
        } catch { flash('Failed to save', 'error'); }
        finally { setSaving(false); }
    }

    async function deleteAssessment(id: string, title: string) {
        setDeleteConfirm({ id, title, type: 'assessment' });
    }

    async function confirmDelete() {
        if (!deleteConfirm) return;
        try {
            if (deleteConfirm.type === 'assessment') {
                await assessmentsApi.delete(deleteConfirm.id);
                flash('Assessment deleted');
                if (activeAssessmentId === deleteConfirm.id) { setActiveAssessmentId(null); setQuestions([]); }
                await loadAll();
            } else if (deleteConfirm.type === 'question' && deleteConfirm.qid) {
                await assessmentsApi.deleteQuestion(deleteConfirm.qid);
                flash('Question deleted');
                if (activeAssessmentId) {
                    const res: any = await assessmentsApi.getQuestions(activeAssessmentId);
                    setQuestions(res.data?.questions || []);
                }
            }
        } catch { flash('Failed to delete', 'error'); }
        finally { setDeleteConfirm(null); }
    }

    async function toggleActive(a: Assessment) {
        try {
            await assessmentsApi.update(a._id, { is_active: !a.is_active });
            flash(a.is_active ? 'Assessment deactivated' : 'Assessment activated');
            await loadAll();
        } catch { flash('Failed to update', 'error'); }
    }

    /* ── questions ── */
    async function loadQuestions(id: string) {
        if (activeAssessmentId === id) { setActiveAssessmentId(null); return; }
        setActiveAssessmentId(id);
        setQuestionsLoading(true);
        try {
            const res: any = await assessmentsApi.getQuestions(id);
            setQuestions(res.data?.questions || []);
        } catch { flash('Failed to load questions', 'error'); }
        finally { setQuestionsLoading(false); }
    }

    function openAddQ() {
        setEditingQId(null);
        const a = assessments.find(x => x._id === activeAssessmentId);
        setQForm({ ...emptyQuestion, skill_id: a?.skill_ids[0]?._id || '' });
        setShowQForm(true);
    }

    function openEditQ(q: Question) {
        setEditingQId(q._id);
        setQForm({
            content: q.content,
            options: [...q.options],
            correct_answer: q.correct_answer,
            difficulty: q.difficulty,
            explanation: q.explanation || '',
            skill_id: typeof q.skill_id === 'string' ? q.skill_id : q.skill_id._id,
        });
        setShowQForm(true);
    }

    async function saveQuestion() {
        if (!activeAssessmentId) return;
        setSavingQ(true);
        try {
            if (editingQId) {
                await assessmentsApi.updateQuestion(editingQId, qForm);
                flash('Question updated');
            } else {
                await assessmentsApi.addQuestion(activeAssessmentId, qForm);
                flash('Question added');
            }
            setShowQForm(false);
            await loadQuestions(activeAssessmentId);
            // re-open (loadQuestions toggles if same id)
            setActiveAssessmentId(activeAssessmentId);
        } catch { flash('Failed to save question', 'error'); }
        finally { setSavingQ(false); }
    }

    async function deleteQuestion(qid: string, content: string) {
        setDeleteConfirm({ id: activeAssessmentId!, title: content.substring(0, 60), type: 'question', qid });
    }

    /* ── skill toggle helper for form ── */
    function toggleSkill(sid: string) {
        setForm(f => ({
            ...f,
            skill_ids: f.skill_ids.includes(sid) ? f.skill_ids.filter(x => x !== sid) : [...f.skill_ids, sid],
        }));
    }

    /* ─────────────── RENDER ─────────────── */

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
            {/* Toast */}
            {toast && (
                <div className={`fixed top-24 right-6 z-[100] px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all animate-[slideIn_0.3s_ease] ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    {toast.msg}
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Manage Assessments</h1>
                        <p className="text-slate-500 dark:text-slate-400">Create, edit, and manage your skill assessments and questions</p>
                    </div>
                    <button onClick={openCreate}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md hover:shadow-primary/20">
                        <span className="material-icons text-lg">add</span> New Assessment
                    </button>
                </div>

                {/* ── Search + Filter Bar ── */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                            <input
                                type="text"
                                placeholder="Search assessments…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm transition-all"
                            />
                        </div>
                        {/* Difficulty filter */}
                        <div className="flex gap-2 flex-wrap">
                            {['all', 'beginner', 'intermediate', 'advanced'].map(d => (
                                <button key={d} onClick={() => setFilterDiff(d)}
                                    className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                                        filterDiff === d
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}>{d === 'all' ? 'All' : d}
                                </button>
                            ))}
                        </div>
                        {/* Inactive toggle */}
                        <button
                            onClick={() => setShowInactive(v => !v)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                showInactive
                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                            }`}
                        >
                            <span className="material-icons text-sm">{showInactive ? 'visibility' : 'visibility_off'}</span>
                            {showInactive ? 'Hiding inactive' : 'Show inactive'}
                        </button>
                    </div>
                </div>

                {/* ── Delete Confirmation Modal ── */}
                {deleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
                        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-8 max-w-sm w-full animate-fadeInUp">
                            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-icons text-red-500">delete_forever</span>
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">Delete {deleteConfirm.type === 'assessment' ? 'Assessment' : 'Question'}?</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-6">
                                <strong className="text-slate-700 dark:text-slate-300">&ldquo;{deleteConfirm.title}&rdquo;</strong><br />
                                This action cannot be undone.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setDeleteConfirm(null)}
                                    className="py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                                    Cancel
                                </button>
                                <button onClick={confirmDelete}
                                    className="py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-all shadow-sm">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Assessment Cards */}
                {(() => {
                    const filtered = assessments.filter(a => {
                        const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
                        const matchDiff = filterDiff === 'all' || a.difficulty === filterDiff;
                        const matchActive = showInactive ? true : a.is_active;
                        return matchSearch && matchDiff && matchActive;
                    });
                    if (filtered.length === 0) return (
                        <div className="text-center py-20">
                            <span className="material-icons text-6xl text-slate-300 dark:text-slate-600 mb-4 block">search_off</span>
                            <p className="text-lg text-slate-500 font-medium">No assessments found</p>
                            <p className="text-sm text-slate-400 mt-1">
                                {assessments.length === 0 ? 'Create your first assessment to get started' : 'Try adjusting your search or filters'}
                            </p>
                            {assessments.length === 0 && (
                                <button onClick={openCreate} className="mt-6 px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all">
                                    Create Assessment
                                </button>
                            )}
                        </div>
                    );
                    return (
                        <div className="space-y-4">
                            {filtered.map(a => (
                                <div key={a._id} className={`bg-white dark:bg-surface-dark rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
                                    a.is_active
                                        ? 'border-slate-100 dark:border-slate-800'
                                        : 'border-amber-200 dark:border-amber-800/40 opacity-75'
                                }`}>
                                    {/* Card header */}
                                    <div className="p-5 sm:p-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{a.title}</h3>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${diffBadge[a.difficulty] || diffBadge.beginner}`}>{a.difficulty}</span>
                                                    {!a.is_active && (
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Inactive</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 mb-3">{a.description || 'No description'}</p>
                                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                                                    <span className="flex items-center gap-1"><span className="material-icons text-sm">help_outline</span>{a.question_count} questions</span>
                                                    <span className="flex items-center gap-1"><span className="material-icons text-sm">schedule</span>{a.time_limit} min</span>
                                                    {a.skill_ids.map(s => (
                                                        <span key={s._id} className="px-2 py-0.5 bg-primary/5 dark:bg-primary/10 text-primary rounded-md text-xs font-medium">{s.icon} {s.skill_name}</span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {/* Active toggle */}
                                                <button onClick={() => toggleActive(a)} title={a.is_active ? 'Deactivate' : 'Activate'}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        a.is_active
                                                            ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                                            : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                                    }`}>
                                                    <span className="material-icons text-xl">{a.is_active ? 'toggle_on' : 'toggle_off'}</span>
                                                </button>
                                                <button onClick={() => loadQuestions(a._id)} title="Questions"
                                                    className={`p-2 rounded-lg transition-colors ${activeAssessmentId === a._id ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600'}`}>
                                                    <span className="material-icons text-xl">list_alt</span>
                                                </button>
                                                <button onClick={() => openEdit(a)} title="Edit"
                                                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500 transition-colors">
                                                    <span className="material-icons text-xl">edit</span>
                                                </button>
                                                <button onClick={() => deleteAssessment(a._id, a.title)} title="Delete"
                                                    className="p-2 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors">
                                                    <span className="material-icons text-xl">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Questions panel (expanded) */}
                                    {activeAssessmentId === a._id && (
                                        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0d1520] p-5 sm:p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                    <span className="material-icons text-lg text-primary">quiz</span> Questions ({questions.length})
                                                </h4>
                                                <button onClick={openAddQ}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all">
                                                    <span className="material-icons text-sm">add</span> Add Question
                                                </button>
                                            </div>

                                            {questionsLoading ? (
                                                <div className="py-6 text-center"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>
                                            ) : questions.length === 0 ? (
                                                <p className="text-sm text-slate-400 py-6 text-center">No questions yet — add one to get started</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {questions.map((q, idx) => (
                                                        <div key={q._id} className="bg-white dark:bg-surface-dark rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                                                                        <span className="text-primary font-bold mr-2">Q{idx + 1}.</span>{q.content}
                                                                    </p>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                                        {q.options.map((opt, i) => {
                                                                            const letter = ['A', 'B', 'C', 'D'][i];
                                                                            const isCorrect = q.correct_answer === letter;
                                                                            return (
                                                                                <div key={i} className={`text-xs px-3 py-1.5 rounded-md ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-semibold' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                                                                    <span className="font-bold mr-1">{letter}.</span> {opt}
                                                                                    {isCorrect && <span className="ml-1 text-emerald-500">✓</span>}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                    {q.explanation && <p className="text-xs text-slate-400 mt-2 italic">💡 {q.explanation}</p>}
                                                                </div>
                                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                                    <button onClick={() => openEditQ(q)} className="p-1.5 rounded text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                                                        <span className="material-icons text-base">edit</span>
                                                                    </button>
                                                                    <button onClick={() => deleteQuestion(q._id, q.content)} className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                                                        <span className="material-icons text-base">delete</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    );
                })()}
            </div>

            {/* ═══ Assessment Modal ═══ */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editingId ? 'Edit Assessment' : 'New Assessment'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><span className="material-icons">close</span></button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Title *</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-[#131d26] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" placeholder="e.g. Python Basics" />
                            </div>
                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                                    className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-[#131d26] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none" placeholder="Describe the assessment…" />
                            </div>
                            {/* Difficulty + counts row */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Difficulty</label>
                                    <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-[#131d26] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/50">
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Questions #</label>
                                    <input type="number" min={5} max={50} value={form.question_count}
                                        onChange={e => setForm({ ...form, question_count: +e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-[#131d26] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Time (min)</label>
                                    <input type="number" min={5} max={120} value={form.time_limit}
                                        onChange={e => setForm({ ...form, time_limit: +e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-[#131d26] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/50" />
                                </div>
                            </div>
                            {/* Skills */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Skills</label>
                                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                                    {skills.map(s => (
                                        <button key={s._id} onClick={() => toggleSkill(s._id)} type="button"
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.skill_ids.includes(s._id) ? 'bg-primary/10 border-primary text-primary' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-primary/40'}`}>
                                            {s.icon} {s.skill_name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                            <button onClick={saveAssessment} disabled={saving || !form.title.trim()}
                                className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2">
                                {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                {editingId ? 'Save Changes' : 'Create Assessment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Question Modal ═══ */}
            {showQForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowQForm(false)}>
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editingQId ? 'Edit Question' : 'Add Question'}</h2>
                            <button onClick={() => setShowQForm(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><span className="material-icons">close</span></button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Question text */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Question *</label>
                                <textarea value={qForm.content} onChange={e => setQForm({ ...qForm, content: e.target.value })} rows={3}
                                    className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-[#131d26] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none" placeholder="Enter the question…" />
                            </div>
                            {/* Options */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Options (A–D)</label>
                                {['A', 'B', 'C', 'D'].map((letter, i) => (
                                    <div key={letter} className="flex items-center gap-2">
                                        <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold flex-shrink-0 ${qForm.correct_answer === letter ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{letter}</span>
                                        <input value={qForm.options[i]} onChange={e => { const o = [...qForm.options]; o[i] = e.target.value; setQForm({ ...qForm, options: o }); }}
                                            className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#131d26] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/50" placeholder={`Option ${letter}`} />
                                    </div>
                                ))}
                            </div>
                            {/* Correct answer + difficulty */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Correct Answer</label>
                                    <select value={qForm.correct_answer} onChange={e => setQForm({ ...qForm, correct_answer: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-[#131d26] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/50">
                                        {['A', 'B', 'C', 'D'].map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Difficulty (1–5)</label>
                                    <input type="number" min={1} max={5} value={qForm.difficulty}
                                        onChange={e => setQForm({ ...qForm, difficulty: +e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-[#131d26] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/50" />
                                </div>
                            </div>
                            {/* Explanation */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Explanation (optional)</label>
                                <input value={qForm.explanation} onChange={e => setQForm({ ...qForm, explanation: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-[#131d26] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/50 transition-all" placeholder="Explain why this is the correct answer…" />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                            <button onClick={() => setShowQForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                            <button onClick={saveQuestion} disabled={savingQ || !qForm.content.trim() || qForm.options.some(o => !o.trim())}
                                className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2">
                                {savingQ && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                {editingQId ? 'Save Changes' : 'Add Question'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
