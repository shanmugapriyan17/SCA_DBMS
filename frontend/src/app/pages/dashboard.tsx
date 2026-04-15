import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { skillsApi, careersApi, assessmentsApi, analyticsApi } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';

interface UserSkill {
  skill_id: string;
  skill_name: string;
  score: number;
  level: string;
  attempts_count: number;
}

interface CareerRecommendation {
  career_id: string;
  title: string;
  match_percentage: number;
  skill_analysis: { skill_name: string; met: boolean }[];
}

interface UserActivity {
  total_logins: number;
  total_assessments: number;
  total_skills_learned: number;
  avg_assessment_score: string;
  engagement_score: number;
  recentLogins: { login_time: string; ip_address: string; success: number }[];
}

export function DashboardPage() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  const [recentTests, setRecentTests] = useState<any[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?._id) {
      fetchData();
    }
  }, [user]);

  async function fetchData() {
    try {
      const results = await Promise.allSettled([
        skillsApi.getUserSkills(),
        careersApi.getRecommendations(),
        assessmentsApi.getHistory(),
        analyticsApi.getUserActivity(user!._id)
      ]);

      const [skillsRes, careersRes, historyRes, activityRes] = results;

      if (skillsRes.status === 'fulfilled') {
        setSkills(skillsRes.value.data?.userSkills || []);
      }
      if (careersRes.status === 'fulfilled') {
        setRecommendations(careersRes.value.data?.recommendations || []);
      }
      if (historyRes.status === 'fulfilled') {
        setRecentTests(historyRes.value.data?.attempts?.slice(0, 3) || []);
      }
      if (activityRes.status === 'fulfilled') {
        setUserActivity(activityRes.value.data || null);
      } else {
        console.warn('Could not fetch user activity (may be a new user)');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const radarData = skills.slice(0, 6).map(s => ({
    skill: s.skill_name,
    score: s.score
  }));

  // Build real progress chart from attempt history (group by month)
  const buildProgressData = () => {
    if (recentTests.length === 0) {
      return [
        { month: 'Start', score: 0 },
        { month: 'Now', score: skills.length > 0 ? Math.round(skills.reduce((a, b) => a + b.score, 0) / skills.length) : 0 },
      ];
    }
    const monthMap: Record<string, number[]> = {};
    [...recentTests].reverse().forEach((t: any) => {
      const d = new Date(t.completed_at || t.finished_at || t.createdAt);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!monthMap[key]) monthMap[key] = [];
      monthMap[key].push(t.percentage ?? 0);
    });
    return Object.entries(monthMap).map(([month, scores]) => ({
      month,
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));
  };
  const progressData = buildProgressData();

  const avgScore = userActivity?.avg_assessment_score
    ? Math.round(parseFloat(userActivity.avg_assessment_score))
    : (skills.length > 0 ? Math.round(skills.reduce((a, b) => a + b.score, 0) / skills.length) : 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500">Loading your analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Banner */}
        <div className="relative bg-gradient-to-r from-primary to-blue-600 dark:from-purple-700 dark:to-purple-900 rounded-2xl p-8 mb-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user?.profile?.full_name || user?.username || 'User'} 👋
            </h1>
            <p className="text-blue-100 dark:text-purple-200 text-lg">Here's your real-time skill & activity overview</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Average Score */}
          <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-icons-outlined">grade</span>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full flex items-center gap-1">
                <span className="material-icons-outlined text-xs">trending_up</span> +12%
              </span>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Average Score</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{avgScore}%</span>
            </div>
          </div>

          {/* Login Count (Real Data from MySQL) */}
          <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <span className="material-icons-outlined">login</span>
              </div>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Total Logins</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{userActivity?.total_logins || 0}</span>
              <span className="text-xs text-slate-400">Sessions</span>
            </div>
          </div>

          {/* Total Assessments (from MySQL) */}
          <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <span className="material-icons-outlined">local_fire_department</span>
              </div>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Tests Taken</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{userActivity?.total_assessments || recentTests.length || 0}</span>
              <span className="text-xs text-slate-400">Assessments</span>
            </div>
          </div>

          {/* Top Career Match */}
          <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <span className="material-icons-outlined">work_outline</span>
              </div>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Top Career Match</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{recommendations[0]?.match_percentage || 0}%</span>
              <span className="text-xs text-slate-400">Match</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Skill Radar Chart */}
          <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">Skill Profile</h2>
              <Link to="/results" className="text-primary text-sm font-medium hover:underline">View Details</Link>
            </div>
            <div className="h-80">
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                    <Radar
                      name="Your Score"
                      dataKey="score"
                      stroke="#258cf4"
                      fill="#258cf4"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                  <span className="material-icons-outlined text-4xl">analytics</span>
                  <p className="text-sm">Take assessments to see your skill profile</p>
                </div>
              )}
            </div>
          </div>

          {/* Progress Chart */}
          <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">Monthly Growth</h2>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8' }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#258cf4"
                    strokeWidth={3}
                    dot={{ fill: '#258cf4', r: 5.5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Login Activity (New Section) */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-icons-outlined text-slate-400">history</span>
              Recent Activity
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Activity</th>
                  <th className="px-6 py-3">IP Address</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {userActivity?.recentLogins?.map((login, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {new Date(login.login_time).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">Login</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{login.ip_address}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${login.success
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {login.success ? 'Success' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!userActivity?.recentLogins || userActivity.recentLogins.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      No recent activity found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Career Recommendations */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">Career Recommendations</h2>
            <Link to="/skills" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
              Take Assessment <span className="material-icons-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <div className="p-6">
            {recommendations.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.slice(0, 3).map((career, index) => (
                  <div
                    key={index}
                    className="group bg-background-light dark:bg-background-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{career.title}</h3>
                      <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
                        {career.match_percentage}%
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {career.skill_analysis?.slice(0, 4).map((skill: any) => (
                        <span
                          key={skill.skill_name}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${skill.met
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            }`}
                        >
                          {skill.skill_name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <span className="material-icons-outlined text-4xl mb-3 block">work_outline</span>
                <p className="text-sm">Take assessments to get career recommendations</p>
                <Link to="/skills" className="mt-3 inline-block text-primary text-sm font-medium hover:underline">Start an Assessment →</Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Tests — Real data from MongoDB */}
        {recentTests.length > 0 && (
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden mt-8">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-icons-outlined text-slate-400">assignment_turned_in</span>
                Recent Assessments
              </h2>
              <Link to="/results" className="text-primary text-sm font-medium hover:underline">View All →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-6 py-3 text-left">Assessment</th>
                    <th className="px-6 py-3 text-left">Score</th>
                    <th className="px-6 py-3 text-left">Level</th>
                    <th className="px-6 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentTests.map((t: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {t.assessment_id?.title || 'Assessment'}
                        {t.assessment_id?.career_role && (
                          <span className="ml-2 text-xs text-slate-400">{t.assessment_id.career_role}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-primary font-bold">{t.percentage ?? 0}%</span>
                        <span className="text-slate-400 text-xs ml-1">{t.total_score}/{t.max_score}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          t.level === 'Expert' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : t.level === 'Advanced' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : t.level === 'Intermediate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                        }`}>
                          {t.level || 'Beginner'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {t.completed_at ? new Date(t.completed_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
