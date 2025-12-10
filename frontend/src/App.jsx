const features = [
  {
    title: 'Expert Instructors',
    description:
      'Learn from industry professionals and certified educators with real-world experience.',
    color: 'from-blue-50 to-blue-100',
    icon: '👩‍🏫',
  },
  {
    title: '100% Free',
    description:
      'Access thousands of high-quality courses without cost. Education should be accessible to everyone.',
    color: 'from-green-50 to-emerald-100',
    icon: '🛡️',
  },
  {
    title: 'Progress Tracking',
    description:
      'Monitor your learning progress and earn certificates upon course completion.',
    color: 'from-purple-50 to-purple-100',
    icon: '⭐',
  },
]

const steps = [
  { step: '1', title: 'Sign Up Free', body: 'Create your account with email or phone number. Verify with OTP for security.' },
  { step: '2', title: 'Browse Courses', body: 'Explore our extensive library across subjects and skill levels.' },
  { step: '3', title: 'Start Learning', body: 'Watch video lectures, take notes, and track your progress as you learn.' },
]

function App() {
  return (
    <div className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <span className="text-emerald-500 text-xl">● ● ●</span>
            <span>READIE</span>
          </div>
          <nav className="hidden gap-6 text-sm font-medium text-slate-700 md:flex">
            {['Home', 'Why Us', 'How It Works', 'Support', 'Contact'].map((item) => (
              <a key={item} href="#" className="hover:text-emerald-600 transition-colors">
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button className="text-sm font-semibold text-slate-700 hover:text-emerald-600">Sign In</button>
            <button className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-emerald-700">
              Get Started
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="bg-gradient-to-b from-emerald-50 via-white to-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-20">
            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Learning Made Easy</p>
              <h1 className="text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
                The App That Makes <span className="text-emerald-600">Learning Fun!</span>
              </h1>
              <p className="text-lg text-slate-600">
                Discover thousands of free courses, learn at your own pace, and join a community of lifelong learners.
                Start your educational journey today!
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-soft hover:bg-emerald-700">
                  Get Started
                </button>
                <button className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-emerald-500 hover:text-emerald-600">
                  Browse Courses
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="glass-card relative mx-auto max-w-xl rotate-2 bg-gradient-to-br from-emerald-200 to-emerald-400 p-6 text-white">
                <div className="rounded-2xl bg-white/95 p-5 text-slate-900 shadow-soft">
                  <div className="mb-3 text-sm font-semibold text-emerald-600">Interactive Learning</div>
                  <h3 className="text-lg font-bold text-slate-900">Engage with courses through videos, quizzes, and projects.</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Stay motivated with hands-on exercises, notes, and progress tracking—all in one place.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center space-y-3 mb-12">
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Why Choose Readie?</p>
              <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">We’re revolutionizing online learning</h2>
              <p className="text-slate-600">
                Built for learners and parents, with free access, experts, and clear progress tracking.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className={`rounded-2xl bg-gradient-to-br ${feature.color} p-6 shadow-soft`}
                >
                  <div className="mb-4 text-3xl">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center space-y-3 mb-12">
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">How It Works</p>
              <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Simple steps to start learning</h2>
              <p className="text-slate-600">From signup to learning, everything is streamlined and secure.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.step} className="rounded-2xl bg-white p-6 shadow-soft border border-slate-100">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
