import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { assessmentsApi } from '../../lib/api';

interface Question {
  _id: string;
  content: string;
  options: string[];
  difficulty?: number;
}

interface AnswerReview {
  question_id: string;
  user_answer: string | null;
  is_correct: boolean;
  marks_obtained: number;
}

interface TestResult {
  total_score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  level: string;
  answers: AnswerReview[];
}

const LEVEL_CONFIG: Record<string, { color: string; bg: string; icon: string; msg: string }> = {
  Expert:       { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20',  icon: '🏆', msg: 'Outstanding! You have expert-level mastery.' },
  Advanced:     { color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20',        icon: '🎯', msg: 'Great work! You have strong advanced skills.' },
  Intermediate: { color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20',      icon: '⚡', msg: 'Good progress! Keep building on your skills.' },
  Beginner:     { color: 'text-rose-600',    bg: 'bg-rose-50 dark:bg-rose-900/20',        icon: '🌱', msg: 'Good start! Practice more to level up.' },
};

export function TestPage() {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();

  const [attemptId, setAttemptId]         = useState<string | null>(null);
  const [questions, setQuestions]         = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex]   = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers]             = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft]           = useState(0);
  const [loading, setLoading]             = useState(true);
  const [submitting, setSubmitting]       = useState(false);
  const [results, setResults]             = useState<TestResult | null>(null);
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [careerRole, setCareerRole]       = useState('');
  const [difficulty, setDifficulty]       = useState('');
  const [showReview, setShowReview]       = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  useEffect(() => {
    if (skillId) startAssessment();
  }, [skillId]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || results) return;
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, results]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && !loading && !results && attemptId) {
      handleSubmit();
    }
  }, [timeLeft]);

  // Warn before leaving an in-progress assessment
  useEffect(() => {
    if (loading || results) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have an assessment in progress. Are you sure you want to leave?';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [loading, results]);

  function handleEndAssessment() {
    // Mark attempt as abandoned then navigate away
    navigate('/skills');
  }

  async function startAssessment() {
    try {
      const response: any = await assessmentsApi.startAssessment(skillId!);
      setAttemptId(response.data.attempt_id);
      setQuestions(response.data.questions);
      setTimeLeft(response.data.time_limit * 60);
      setAssessmentTitle(response.data.assessment_title || 'Assessment');
      setCareerRole(response.data.career_role || '');
      setDifficulty(response.data.difficulty || '');
    } catch (error) {
      console.error('Failed to start assessment:', error);
      navigate('/skills');
    } finally {
      setLoading(false);
    }
  }

  async function handleNext() {
    // Save current answer
    if (selectedAnswer && attemptId) {
      try {
        await assessmentsApi.submitAnswer(attemptId, questions[currentIndex]._id, selectedAnswer);
        setAnswers(prev => ({ ...prev, [questions[currentIndex]._id]: selectedAnswer }));
      } catch (error) {
        console.error('Failed to submit answer:', error);
      }
    }
    if (currentIndex < questions.length - 1) {
      setSelectedAnswer(answers[questions[currentIndex + 1]?._id] || null);
      setCurrentIndex(i => i + 1);
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setSelectedAnswer(answers[questions[currentIndex - 1]._id] || null);
      setCurrentIndex(i => i - 1);
    }
  }

  async function handleSubmit() {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    try {
      // Submit last answer if selected
      if (selectedAnswer) {
        await assessmentsApi.submitAnswer(attemptId, questions[currentIndex]._id, selectedAnswer);
      }
      const response: any = await assessmentsApi.submitAssessment(attemptId);
      setResults(response.data);
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setSubmitting(false);
    }
  }

  // ─── LOADING ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading assessment…</p>
        </div>
      </div>
    );
  }

  // ─── RESULTS ───────────────────────────────────────────────────────────────
  if (results) {
    const lvl = LEVEL_CONFIG[results.level] || LEVEL_CONFIG.Beginner;
    const correct = results.answers?.filter(a => a.is_correct).length ?? results.total_score;
    const total   = results.answers?.length ?? results.max_score;

    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark py-12 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Score Card */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-8 mb-6 text-center">
            <div className={`w-20 h-20 rounded-full ${lvl.bg} flex items-center justify-center mx-auto mb-4`}>
              <span className="text-4xl">{lvl.icon}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Assessment Complete!</h1>
            <p className="text-slate-500 text-sm mb-1">{assessmentTitle}</p>
            {careerRole && (
              <p className="text-xs text-primary font-medium mb-6">{careerRole} · {difficulty}</p>
            )}

            {/* Big Score */}
            <div className={`${lvl.bg} rounded-2xl p-6 mb-6`}>
              <div className={`text-7xl font-bold ${lvl.color} mb-2`}>{results.percentage}%</div>
              <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${lvl.color} bg-white/60 dark:bg-black/20 mb-3`}>
                {lvl.icon} {results.level}
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm">{lvl.msg}</p>
              <div className="flex justify-center gap-8 mt-4 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{correct}</p>
                  <p className="text-slate-500">Correct</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{total - correct}</p>
                  <p className="text-slate-500">Wrong</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{total}</p>
                  <p className="text-slate-500">Total</p>
                </div>
              </div>
            </div>

            {/* Pass/Fail Banner */}
            {results.passed ? (
              <div className="mb-5 py-2.5 px-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-semibold">
                ✅ Passed! Your skill level has been updated.
              </div>
            ) : (
              <div className="mb-5 py-2.5 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold">
                ❌ Keep practicing! You need 60% to pass.
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button onClick={() => navigate('/dashboard')}
                className="py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all shadow-sm">
                View Dashboard
              </button>
              <button onClick={() => navigate('/skills')}
                className="py-3 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-all">
                More Tests
              </button>
            </div>

            {/* Toggle Review */}
            {results.answers && results.answers.length > 0 && (
              <button
                onClick={() => setShowReview(!showReview)}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-icons text-sm">{showReview ? 'expand_less' : 'expand_more'}</span>
                {showReview ? 'Hide' : 'Show'} Answer Review ({questions.length} questions)
              </button>
            )}
          </div>

          {/* Answer Review */}
          {showReview && questions.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">Answer Review</h2>
              {questions.map((q, idx) => {
                const reviewData = results.answers?.[idx];
                const isCorrect = reviewData?.is_correct ?? false;
                const userAns = reviewData?.user_answer ?? null;

                return (
                  <div key={q._id}
                    className={`bg-white dark:bg-surface-dark rounded-xl border-2 ${isCorrect ? 'border-emerald-200 dark:border-emerald-800' : 'border-red-200 dark:border-red-800'} p-5`}>
                    <div className="flex items-start gap-3 mb-3">
                      <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isCorrect ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                        {idx + 1}
                      </span>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">{q.content}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 ml-11">
                      {q.options.map((opt, oi) => {
                        const letter = ['A', 'B', 'C', 'D'][oi];
                        const isUser = userAns === letter;
                        return (
                          <div key={letter}
                            className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
                              isUser && isCorrect ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-semibold'
                              : isUser && !isCorrect ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-semibold'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                            <span className="font-bold w-4">{letter}.</span> {opt}
                            {isUser && <span className="material-icons text-sm ml-auto">{isCorrect ? 'check_circle' : 'cancel'}</span>}
                          </div>
                        );
                      })}
                    </div>
                    {!isCorrect && userAns && (
                      <p className="ml-11 mt-2 text-xs text-slate-500 dark:text-slate-400">
                        You answered: <strong className="text-red-500">{userAns}</strong>
                      </p>
                    )}
                  </div>
                );
              })}

              <Link to="/careers"
                className="block w-full py-3 text-center rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all">
                View Career Learning Path →
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── QUESTION VIEW ─────────────────────────────────────────────────────────
  const question = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const answeredCount = Object.keys(answers).length + (selectedAnswer ? 1 : 0);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Header Bar */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 min-w-0 mr-3">
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">{assessmentTitle}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {careerRole && <span className="text-primary font-medium">{careerRole} · </span>}
                Question {currentIndex + 1} of {questions.length} · {answeredCount} answered
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-mono font-bold text-base ${timeLeft < 60 ? 'bg-red-50 dark:bg-red-900/20 text-red-600 animate-pulse' : 'bg-primary/10 text-primary'}`}>
                <span className="material-icons text-sm">timer</span>
                {minutes}:{seconds.toString().padStart(2, '0')}
              </div>
              {/* End Assessment Button */}
              <button
                onClick={() => setShowEndConfirm(true)}
                title="End Assessment"
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <span className="material-icons text-sm">stop_circle</span>
                <span className="hidden sm:inline">End</span>
              </button>
            </div>
          </div>
          {/* Progress */}
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          {/* Question dots */}
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {questions.map((_, i) => (
              <div key={i}
                className={`w-5 h-5 rounded text-xs flex items-center justify-center font-semibold cursor-default transition-colors ${
                  i === currentIndex ? 'bg-primary text-white'
                  : answers[questions[i]._id] ? 'bg-emerald-400 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-8 mb-5">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-4">Question {currentIndex + 1}</p>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-8 leading-relaxed">{question.content}</h2>

          <div className="space-y-3">
            {question.options.map((option, idx) => {
              const letter = ['A', 'B', 'C', 'D'][idx];
              const isSelected = selectedAnswer === letter;
              return (
                <button key={letter} onClick={() => setSelectedAnswer(letter)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                    {letter}
                  </div>
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{option}</span>
                  {isSelected && <span className="material-icons text-primary">check_circle</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button onClick={handlePrev} disabled={currentIndex === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <span className="material-icons text-lg">chevron_left</span> Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm">
              Next <span className="material-icons text-lg">chevron_right</span>
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50">
              {submitting
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
                : <>Submit Assessment <span className="material-icons text-lg">check</span></>}
            </button>
          )}
        </div>
      </div>

      {/* ── End Assessment Confirmation Modal ── */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-8 max-w-sm w-full animate-fadeInUp">
            <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-red-500 text-2xl">stop_circle</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">End Assessment?</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-6">
              Your progress will be <strong>lost</strong>. Any unanswered questions will be marked incorrect.
              You have answered <strong>{Object.keys(answers).length}</strong> of <strong>{questions.length}</strong> questions.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Continue Test
              </button>
              <button
                onClick={handleEndAssessment}
                className="py-3 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-all shadow-sm"
              >
                End Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
