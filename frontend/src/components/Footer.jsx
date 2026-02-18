import { Link } from 'react-router-dom';

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-100 mt-12">
      <div className="max-w-6xl mx-auto px-6 py-12 grid gap-10 md:grid-cols-4">
        <div className="space-y-3">
          <p className="text-xl font-semibold tracking-tight">Local Care connect</p>
          <p className="text-sm text-slate-300 leading-relaxed">
            Connecting neighbors, volunteers, and support teams to keep every request moving smoothly.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase text-slate-300 tracking-[0.08em]">Quick Links</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-white transition-colors" to="/login">Sign in</Link></li>
            <li><Link className="hover:text-white transition-colors" to="/register/requester">Register as requester</Link></li>
            <li><Link className="hover:text-white transition-colors" to="/register/volunteer">Register as volunteer</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase text-slate-300 tracking-[0.08em]">Support</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-white transition-colors" to="/login">Dashboard access</Link></li>
            <li><a className="hover:text-white transition-colors" href="mailto:support@localsupport.app">Email support</a></li>
            <li><a className="hover:text-white transition-colors" href="https://example.com/faq" target="_blank" rel="noreferrer">FAQs</a></li>
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase text-slate-300 tracking-[0.08em]">Stay in touch</p>
          <p className="text-sm text-slate-300 leading-relaxed">
            Have an idea or feedback? We would love to hear how we can make the experience better.
          </p>
          <a
            className="inline-flex items-center text-sm font-medium text-white hover:text-slate-200 transition-colors"
            href="mailto:hello@localsupport.app"
          >
            hello@localsupport.app
          </a>
        </div>
      </div>

      <div className="border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">© {year} Local Support. All rights reserved.</p>
          <p className="text-xs text-slate-500">Built for responsive, community-first service.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
