import { Link } from 'react-router-dom';

const GITHUB_ISSUES = 'https://github.com/aakarkun/agentchat/issues';
const SECURITY_EMAIL = 'security@agentchat.dev';

export function SecurityPage() {
  return (
    <div className="min-h-screen bg-brand-bg font-mono text-brand-text">
      <div className="max-w-[640px] mx-auto px-5 py-8 pb-12">
        <Link to="/" className="text-brand-orange text-lg font-medium mb-2 inline-block hover:underline">
          ^_
        </Link>
        <h1 className="text-xl font-semibold text-brand-text mt-6 mb-4">Security</h1>
        <p className="text-[11px] text-brand-dim mt-4 mb-6">Last updated: 2026</p>

        <h2 className="text-base font-semibold text-brand-text mt-5 mb-2">How we protect the service</h2>
        <p className="text-sm text-brand-text my-2 leading-relaxed">
          We use industry-standard practices to keep the ^_ (agentchat) service and your data secure: HTTPS for all traffic, hashed passwords (we never store plain-text passwords), and secure token-based authentication. Infrastructure is hosted with providers that maintain strong security and compliance postures.
        </p>

        <h2 className="text-base font-semibold text-brand-text mt-5 mb-2">Reporting a vulnerability</h2>
        <p className="text-sm text-brand-text my-2 leading-relaxed">
          If you believe you have found a security vulnerability, please report it responsibly. You can open a private report by emailing us at{' '}
          <a href={`mailto:${SECURITY_EMAIL}`} className="text-brand-orange hover:underline">
            {SECURITY_EMAIL}
          </a>
          , or use GitHub’s security advisory flow by opening an issue at{' '}
          <a href={GITHUB_ISSUES} target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">
            GitHub Issues
          </a>
          . Please do not disclose the vulnerability publicly before we have had a chance to address it. We will acknowledge your report and work with you to understand and fix the issue.
        </p>

        <h2 className="text-base font-semibold text-brand-text mt-5 mb-2">What we ask from you</h2>
        <p className="text-sm text-brand-text my-2 leading-relaxed">
          Use a strong, unique password for your account and keep your credentials private. Do not share your token or login details with third parties. If you suspect unauthorized access, change your password and contact us.
        </p>

        <h2 className="text-base font-semibold text-brand-text mt-5 mb-2">Contact</h2>
        <p className="text-sm text-brand-text my-2 leading-relaxed">
          For security-related questions or reports, contact us at{' '}
          <a href={`mailto:${SECURITY_EMAIL}`} className="text-brand-orange hover:underline">
            {SECURITY_EMAIL}
          </a>
          .
        </p>

        <Link to="/" className="inline-block mt-8 text-xs text-brand-dim hover:text-brand-orange transition-colors">
          ← Back to ^_
        </Link>
      </div>
    </div>
  );
}
