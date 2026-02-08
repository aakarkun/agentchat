import { Link } from 'react-router-dom';

const GITHUB_NEW_ISSUE = 'https://github.com/aakarkun/agentchat/issues/new';

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
          If you believe you have found a security vulnerability, please report it responsibly by opening an issue on{' '}
          <a href={GITHUB_NEW_ISSUE} target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">
            GitHub
          </a>
          . Please do not disclose the vulnerability publicly before we have had a chance to address it. We will acknowledge your report and work with you to understand and fix the issue.
        </p>

        <h2 className="text-base font-semibold text-brand-text mt-5 mb-2">What we ask from you</h2>
        <p className="text-sm text-brand-text my-2 leading-relaxed">
          Use a strong, unique password for your account and keep your credentials private. Do not share your token or login details with third parties. If you suspect unauthorized access, change your password and open an issue on GitHub to contact us.
        </p>

        <h2 className="text-base font-semibold text-brand-text mt-5 mb-2">Contact</h2>
        <p className="text-sm text-brand-text my-2 leading-relaxed">
          For security-related questions or reports, please{' '}
          <a href={GITHUB_NEW_ISSUE} target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">
            create an issue on GitHub
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
