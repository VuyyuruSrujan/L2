import { Link } from 'react-router-dom';
import { useEffect } from 'react';

const sections = [
  {
    title: 'How it works',
    points: [
      'Customers post a request with location, urgency, and details.',
      'Verified volunteers pick requests that match their skills and availability.',
      'Progress is tracked with clear statuses until completion.',
      'Feedback keeps quality high for everyone.',
    ],
  },
  {
    title: 'Why it helps customers (requesters)',
    points: [
      'Fast matching with nearby, ready-to-help volunteers.',
      'Clear status updates from accepted to completed.',
      'Verified helpers for safer interactions.',
      'Support for medical, transport, grocery, technical, and more.',
    ],
  },
  {
    title: 'Why volunteers love it',
    points: [
      'Choose requests by city, category, and urgency.',
      'Stay in control with availability toggles and timelines.',
      'Build reputation through feedback and completion history.',
      'Serve your community with meaningful, trackable impact.',
    ],
  },
];

const roles = [
  {
    name: 'Customer / Requester',
    desc: 'Creates help requests with location, urgency, and contact details.',
    cta: 'Sign in to request help',
    to: '/login',
    accent: 'from-rose-500 to-orange-500',
    animation: 'https://assets7.lottiefiles.com/packages/lf20_touohxv0.json',
  },
  {
    name: 'Volunteer',
    desc: 'Browses nearby requests, accepts matches, updates status, and completes tasks.',
    cta: 'Sign in to volunteer',
    to: '/login',
    accent: 'from-green-500 to-emerald-500',
    animation: 'https://assets7.lottiefiles.com/packages/lf20_rycdh53q.json',
  },
];

function Landing() {
  useEffect(() => {
    // Load the lightweight Lottie player once for animated illustrations
    if (!document.querySelector('script[data-lottie-player]')) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js';
      script.async = true;
      script.setAttribute('data-lottie-player', 'true');
      document.body.appendChild(script);
    }
  }, []);

  const heroAnimation = 'https://assets7.lottiefiles.com/packages/lf20_jcikwtux.json';

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold">LS</div>
            <div>
              <p className="text-lg font-semibold">Local Support</p>
              <p className="text-xs text-slate-500">Neighbors helping neighbors</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-700 hover:text-slate-900"
            >
              Login
            </Link>
            <Link
              to="/register/volunteer"
              className="text-sm font-semibold px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 shadow-sm"
            >
              Become a Volunteer
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        <section className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold uppercase tracking-[0.12em]">Community-first</p>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-slate-900">
              Get help or volunteer faster with transparent, trackable requests.
            </h1>
            <p className="text-lg text-slate-700 leading-relaxed">
              Local Support connects customers who need assistance with nearby volunteers. See status updates in real time, stay safe with verified helpers, and close the loop with feedback.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/login"
                className="px-5 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 shadow"
              >
                Login to continue
              </Link>
              <Link
                to="/register/requester"
                className="px-5 py-3 rounded-lg border border-slate-300 text-slate-800 font-semibold hover:border-slate-400"
              >
                Register as Customer
              </Link>
            </div>
          </div>
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6 grid gap-4">
            <div className="w-full h-full flex items-center justify-center rounded-lg bg-slate-50 border border-slate-100 p-2">
              <lottie-player
                src={heroAnimation}
                background="transparent"
                speed="1"
                loop
                autoplay
                style={{ width: '100%', maxWidth: '420px', height: '320px' }}
              />
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-white border border-green-100">
                <p className="text-sm text-green-800 font-semibold">Track every request</p>
                <p className="text-slate-700 mt-1">Status moves from open → accepted → in-progress → completed with timeline notes.</p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-white border border-amber-100">
                <p className="text-sm text-amber-800 font-semibold">Stay safe</p>
                <p className="text-slate-700 mt-1">Volunteers can be verified by admins before they take requests.</p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-white border border-blue-100">
                <p className="text-sm text-blue-800 font-semibold">Built for speed</p>
                <p className="text-slate-700 mt-1">Filter by city, category, and urgency so the right helper sees it first.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {roles.map((role) => (
            <div key={role.name} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${role.accent} flex items-center justify-center text-white font-bold mb-3`}>
                {role.name.charAt(0)}
              </div>
              <h3 className="text-xl font-semibold text-slate-900">{role.name}</h3>
              <p className="text-slate-700 mt-2 leading-relaxed">{role.desc}</p>
              <div className="mt-3 mb-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                <lottie-player
                  src={role.animation}
                  background="transparent"
                  speed="1"
                  loop
                  autoplay
                  style={{ width: '100%', maxWidth: '220px', height: '180px' }}
                />
              </div>
              <Link
                to={role.to}
                className="inline-flex mt-4 text-sm font-semibold text-green-700 hover:text-green-800"
              >
                {role.cta} →
              </Link>
            </div>
          ))}
        </section>

        <section className="grid gap-4">
          <h2 className="text-2xl font-bold text-slate-900">What you get</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {sections.map((section) => (
              <div key={section.title} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">{section.title}</h3>
                <ul className="space-y-2 text-slate-700 text-sm">
                  {section.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Landing;
