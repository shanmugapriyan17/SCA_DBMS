import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 font-display">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
            {/* Text Content */}
            <div className="lg:col-span-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
                <span className="material-icons text-base">auto_awesome</span>
                <span>AI-Powered Career Intelligence</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
                Discover Your Skills, <br />
                <span className="gradient-text">Unlock Your Future</span>
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Smart Career Advisor uses advanced AI neural networks to analyze your strengths, map personalized career paths, and bridge the gap between where you are and where you want to be.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/signup"
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-xl shadow-primary/20 hover:shadow-primary/40 flex items-center justify-center gap-2"
                >
                  Start Free Assessment
                  <span className="material-icons text-sm">arrow_forward</span>
                </Link>
                <Link
                  to="/about"
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/50 text-slate-700 dark:text-slate-200 px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-2"
                >
                  <span className="material-icons text-primary">play_circle</span>
                  View Demo
                </Link>
              </div>
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-background-dark bg-primary/10 flex items-center justify-center">
                      <span className="material-icons text-primary text-xs">person</span>
                    </div>
                  ))}
                </div>
                <p>Trusted by 50,000+ professionals</p>
              </div>
            </div>

            {/* Visual Content — Hero Image */}
            <div className="hidden lg:block lg:col-span-6 relative mt-12 lg:mt-0">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20 dark:border-slate-700/50">
                {/* Glow effect behind image */}
                <div className="absolute -inset-4 bg-primary/20 rounded-3xl blur-2xl opacity-60 pointer-events-none"></div>
                <img
                  src="/quizzes.png"
                  alt="Smart Career Advisor — Skill Assessment Dashboard"
                  className="relative w-full h-auto rounded-2xl object-cover"
                  loading="eager"
                />
                {/* Floating Skill Match Card */}
                <div className="absolute top-6 right-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 animate-[bounce_3s_infinite]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                      <span className="material-icons text-sm">trending_up</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">Skill Match</p>
                      <p className="font-bold text-slate-800 dark:text-white">98% Match</p>
                    </div>
                  </div>
                  <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[98%]"></div>
                  </div>
                </div>
                {/* Floating Analysis Card */}
                <div className="absolute bottom-6 left-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-icons">psychology</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">Analysis Complete</p>
                      <p className="text-xs text-slate-500">Ready for review</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-slate-900/50" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Precision Engineered for Growth</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">Our platform combines psychometrics with machine learning to provide insights that traditional career tests miss.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: 'quiz', title: 'Adaptive Skill Tests', desc: 'Forget multiple choice. Our AI adapts questions in real-time to dig deeper than a resume, uncovering hidden talents and soft skills.' },
              { icon: 'insights', title: 'Progress Dashboard', desc: 'Visualize your professional growth with real-time analytics. Track skill acquisition and benchmark yourself against industry standards.' },
              { icon: 'work_outline', title: 'Career Recommendations', desc: 'Stop searching, start matching. Get AI-driven job recommendations tailored specifically to your unique cognitive and skill profile.' },
            ].map((feature, i) => (
              <div
                key={i}
                className="group bg-background-light dark:bg-background-dark p-8 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/30 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <span className="material-icons text-3xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 relative overflow-hidden" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="text-primary font-semibold tracking-wider uppercase text-sm">The Process</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mt-2">From Analysis to Action in 4 Steps</h2>
          </div>
          <div className="relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-800 z-0"></div>
            <div className="grid md:grid-cols-4 gap-8 relative z-10">
              {[
                { num: 1, icon: 'person_add', title: 'Create Profile', desc: 'Setup your account and import your resume.' },
                { num: 2, icon: 'psychology_alt', title: 'Take Assessment', desc: 'Complete our 15-minute cognitive deep dive.' },
                { num: 3, icon: 'analytics', title: 'View Analysis', desc: 'Get your comprehensive skills report.' },
                { num: 4, icon: 'rocket_launch', title: 'Get Hired', desc: 'Apply to curated roles that fit you perfectly.' },
              ].map((step) => (
                <div key={step.num} className="text-center">
                  <div className="w-24 h-24 mx-auto bg-white dark:bg-background-dark border-4 border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-center mb-6 relative">
                    <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold shadow-lg">{step.num}</span>
                    <span className="material-icons text-4xl text-slate-400">{step.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 px-4">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 dark:text-white mb-16">Stories from the Community</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Michael Chen',
                role: 'Data Analyst at TechCorp',
                quote: 'I was stuck in a rut for years. The skill analysis showed me I had a knack for data science I never knew existed. Two months later, I pivoted careers completely.',
                stars: 5,
              },
              {
                name: 'Sarah Jenkins',
                role: 'HR Director at Studio',
                quote: 'As a hiring manager, Smart Career Advisor candidates are consistently better matches. The pre-assessment saves us dozens of interview hours.',
                stars: 5,
              },
              {
                name: 'David Rossi',
                role: 'Product Manager',
                quote: "The career recommendations were scary accurate. It suggested roles I'd dreamed of but never thought I was qualified for. Turns out, I was.",
                stars: 4.5,
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-white dark:bg-background-dark p-8 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1 text-yellow-400 mb-6">
                  {Array.from({ length: Math.floor(testimonial.stars) }).map((_, j) => (
                    <span key={j} className="material-icons text-sm">star</span>
                  ))}
                  {testimonial.stars % 1 !== 0 && (
                    <span className="material-icons text-sm">star_half</span>
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-icons text-primary text-sm">person</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{testimonial.name}</h4>
                    <p className="text-xs text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 bg-background-light dark:bg-background-dark border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">Ready to upgrade your career?</h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">Join 50,000+ professionals who have already discovered their true potential with Smart Career Advisor.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-primary hover:bg-primary/90 text-white px-10 py-4 rounded-lg font-bold text-lg transition-all shadow-xl shadow-primary/20 hover:shadow-primary/40"
            >
              Get Started Now
            </Link>
          </div>
          <p className="mt-8 text-sm text-slate-500">No credit card required for initial assessment.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 py-12 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <span className="material-icons text-sm">psychology</span>
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white">Smart Career Advisor</span>
          </div>
          <div className="flex gap-8 text-sm text-slate-600 dark:text-slate-400">
            <a className="hover:text-primary" href="#">Privacy Policy</a>
            <a className="hover:text-primary" href="#">Terms of Service</a>
            <a className="hover:text-primary" href="#">Contact Support</a>
          </div>
          <div className="text-sm text-slate-500">
            © 2025 Smart Career Advisor Inc.
          </div>
        </div>
      </footer>
    </div>
  );
}
