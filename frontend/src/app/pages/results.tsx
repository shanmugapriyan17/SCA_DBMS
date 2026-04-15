import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { assessmentsApi, skillsApi } from '../../lib/api';

interface AttemptHistory {
  _id: string;
  assessment_id: { title: string };
  title: string;
  total_score: number;
  max_score: number;
  percentage: number;
  level: string;
  completed_at: string;
}

interface UserSkill {
  skill_name: string;
  score: number;
  level: string;
}

const COLORS = ['#258cf4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const levelBadge: Record<string, string> = {
  Expert: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Advanced: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Beginner: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

export function ResultsPage() {
  const [attempts, setAttempts] = useState<AttemptHistory[]>([]);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const results = await Promise.allSettled([
        assessmentsApi.getHistory(),
        skillsApi.getUserSkills()
      ]);

      const [historyRes, skillsRes] = results;

      if (historyRes.status === 'fulfilled') {
        setAttempts(historyRes.value.data?.attempts || []);
      }
      if (skillsRes.status === 'fulfilled') {
        setSkills(skillsRes.value.data?.userSkills || []);
      }
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      setLoading(false);
    }
  }

  const barChartData = skills.map(s => ({
    name: s.skill_name,
    score: s.score
  }));

  const pieChartData = [
    { name: 'Expert', value: skills.filter(s => s.level === 'Expert').length },
    { name: 'Advanced', value: skills.filter(s => s.level === 'Advanced').length },
    { name: 'Intermediate', value: skills.filter(s => s.level === 'Intermediate').length },
    { name: 'Beginner', value: skills.filter(s => s.level === 'Beginner').length },
  ].filter(d => d.value > 0);

  const avgScore = skills.length > 0
    ? Math.round(skills.reduce((a, b) => a + b.score, 0) / skills.length)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Results & Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400">Track your assessment history and skill progress</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <span className="material-icons text-primary">grade</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{avgScore}%</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Average Score</p>
          </div>
          <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <span className="material-icons text-emerald-600">emoji_events</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{attempts.length}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Tests Completed</p>
          </div>
          <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                <span className="material-icons text-violet-600">bolt</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{skills.length}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Skills Assessed</p>
          </div>
          <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <span className="material-icons text-amber-600">calendar_today</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {attempts.length > 0
                ? new Date(attempts[0].completed_at).toLocaleDateString()
                : 'N/A'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Last Test</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Bar Chart */}
          <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Skill Scores</h2>
            <div className="h-80">
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#258cf4" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                  <span className="material-icons text-4xl">bar_chart</span>
                  <p className="text-sm">Take assessments to see your scores</p>
                </div>
              )}
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Skill Level Distribution</h2>
            <div className="h-80">
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                  <span className="material-icons text-4xl">donut_large</span>
                  <p className="text-sm">Take assessments to see level distribution</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test History Table */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">Test History</h2>
            <Link to="/skills" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
              Take New Test <span className="material-icons text-sm">arrow_forward</span>
            </Link>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            {attempts.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Assessment</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Score</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {attempts.map((attempt) => (
                    <tr key={attempt._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-sm text-slate-900 dark:text-white">
                          {attempt.assessment_id?.title || 'Assessment'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(attempt.completed_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-primary">{attempt.percentage}%</span>
                          <span className="text-xs text-slate-400">{attempt.total_score}/{attempt.max_score}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${levelBadge[attempt.level] || 'bg-slate-100 text-slate-600'}`}>
                          {attempt.level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <span className="material-icons text-4xl text-slate-300 mb-3 block">assignment</span>
                <p className="text-slate-500 mb-2">No tests completed yet</p>
                <Link to="/skills" className="text-primary hover:underline text-sm font-medium">Take your first assessment</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
