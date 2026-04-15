import { Link } from 'react-router-dom';

export function AboutPage() {
  const steps = [
    {
      step: '01',
      icon: 'person_add',
      title: 'Create Your Profile',
      description:
        'Start by building your professional identity. Import your history directly from LinkedIn or upload your CV. Our system instantly parses your experience to create a baseline profile.',
      checklist: ['One-click LinkedIn Import', 'CV/Resume Parsing'],
      imageGradient: 'from-primary/20 to-blue-400/20',
    },
    {
      step: '02',
      icon: 'quiz',
      title: 'Take AI Assessments',
      description:
        'Engage with our adaptive AI tests designed to measure both hard technical skills and soft cognitive aptitudes. The questions evolve in real-time based on your responses.',
      checklist: ['Adaptive Difficulty Engine', 'Cognitive & Personality Analysis'],
      imageGradient: 'from-violet-500/20 to-pink-400/20',
    },
    {
      step: '03',
      icon: 'analytics',
      title: 'Analyze Deep Insights',
      description:
        'Once completed, our neural engine processes your data to generate a comprehensive breakdown. Visualize your strengths, identify blind spots, and understand your true market value.',
      checklist: ['Detailed Skill Radar Charts', 'Market Value Benchmarking'],
      imageGradient: 'from-emerald-500/20 to-teal-400/20',
    },
    {
      step: '04',
      icon: 'rocket_launch',
      title: 'Get Recommendations',
      description:
        "Unlock personalized career paths, role suggestions, and upskilling roadmaps. Deep Think connects the dots between where you are and where you could be.",
      checklist: ['Tailored Learning Paths', 'Job Role Matching'],
      imageGradient: 'from-amber-500/20 to-orange-400/20',
    },
  ];

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 font-display">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            The Process
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-primary to-slate-900 dark:from-white dark:via-blue-300 dark:to-white">
            How Deep Think Works
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            From raw potential to career mastery in four simple steps. Our AI analyzes your skills, personality, and goals to build your perfect career roadmap.
          </p>
        </div>
      </section>

      {/* Steps Container */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        {/* Connecting Line (Desktop) */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/0 via-primary/30 to-primary/0 hidden lg:block -translate-x-1/2"></div>

        {steps.map((step, index) => (
          <div key={step.step} className={`relative ${index < steps.length - 1 ? 'mb-24 lg:mb-32' : ''}`}>
            <div className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-24`}>
              {/* Text Content */}
              <div className={`flex-1 text-center ${index % 2 === 0 ? 'lg:text-right order-2 lg:order-1' : 'lg:text-left order-2'}`}>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary font-bold text-lg mb-6 shadow-sm border border-primary/20 lg:hidden">
                  {step.step}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
                  {step.title}
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  {step.description}
                </p>
                <ul className="inline-block text-left space-y-3">
                  {step.checklist.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                      <span className="material-icons text-primary text-sm">check_circle</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Center Badge (Desktop) */}
              <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-16 h-16 rounded-2xl bg-white dark:bg-background-dark border-4 border-background-light dark:border-background-dark shadow-xl items-center justify-center">
                <span className="text-xl font-bold text-primary">{step.step}</span>
              </div>

              {/* Illustration */}
              <div className={`flex-1 ${index % 2 === 0 ? 'order-1 lg:order-2' : 'order-1'}`}>
                <div className={`relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br ${step.imageGradient} border border-slate-100 dark:border-white/10 aspect-[4/3] group hover:scale-[1.02] transition-transform duration-500`}>
                  <div className="absolute inset-0 bg-white/30 dark:bg-black/20 backdrop-blur-[1px]"></div>
                  <div className="relative z-10 h-full flex items-center justify-center p-8">
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-6 shadow-lg border border-slate-100 dark:border-slate-700 w-full max-w-sm">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="p-2.5 bg-primary/10 rounded-lg">
                          <span className="material-icons text-primary">{step.icon}</span>
                        </div>
                        <div>
                          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                          <div className="h-2 w-16 bg-slate-100 dark:bg-slate-800 rounded mt-2"></div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {[75, 60, 90].map((w, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="h-2 w-12 bg-slate-100 dark:bg-slate-800 rounded"></div>
                            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                              <div className="h-2 bg-primary rounded-full" style={{ width: `${w}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Final CTA Section */}
      <section className="relative py-24 bg-white dark:bg-slate-900/80 overflow-hidden border-t border-slate-100 dark:border-white/5">
        <div className="absolute inset-0 z-0 opacity-30 dark:opacity-20">
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute -left-20 -top-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 text-slate-900 dark:text-white">
            Ready to unlock your potential?
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
            Join thousands of professionals who have accelerated their careers with Deep Think's AI-powered guidance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-full shadow-lg text-white bg-primary hover:bg-primary/90 transition-all hover:-translate-y-1"
            >
              Start Your Assessment Now
              <span className="material-icons ml-2">arrow_forward</span>
            </Link>
            <Link
              to="/results"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-full text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
            >
              View Sample Report
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background-light dark:bg-background-dark border-t border-slate-200 dark:border-white/10 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-icons text-primary">psychology</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">Deep Think</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                AI-powered career intelligence for the modern professional.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Product</h3>
              <ul className="space-y-3">
                <li><Link to="/skills" className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">Assessments</Link></li>
                <li><Link to="/results" className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">Career Paths</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Company</h3>
              <ul className="space-y-3">
                <li><Link to="/about" className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Connect</h3>
              <div className="flex space-x-4">
                <a className="text-slate-400 hover:text-primary transition-colors" href="#">
                  <span className="material-icons">public</span>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">© 2025 Deep Think Inc. All rights reserved.</p>
            <div className="flex space-x-6">
              <a className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors" href="#">Privacy Policy</a>
              <a className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors" href="#">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
