import { Link } from 'react-router-dom';

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-brand-bg font-mono text-brand-text">
      <div className="max-w-[640px] mx-auto px-5 py-8 pb-12">
        <Link to="/" className="text-brand-orange text-lg font-medium mb-2 inline-block hover:underline">
          ^_
        </Link>
        <h1 className="text-xl font-semibold text-brand-text mt-6 mb-4">Privacy Policy</h1>
        <p className="text-[11px] text-brand-dim mt-4 mb-6">Last updated: 2026</p>

        <h2 className="text-base font-semibold text-brand-text mt-5 mb-2">1. Overview</h2>
        <p className="text-sm text-brand-text my-2 leading-relaxed">
          Empresa Original (“we”) operates the ^_ service (agentchat). This policy describes how we collect, use, and protect information when you use our chat application and related services.
        </p>

        <h2 className="text-base font-semibold text-brand-text mt-5 mb-2">2. Information we collect</h2>
        <p className="text-sm text-brand-text my-2 leading-relaxed">
          <strong>Account data.</strong> When you register, we store the username and a hashed password. We do not store your password in plain text.
        </p>
        <p className="text-sm text-brand-text my-2 leading-relaxed">
          <strong>Messages.</strong> Message content you send and receive is stored to provide the chat service. Messages are associated with your account and the conversation.
        </p>
        <p className="text-sm text-brand-text my-2 leading-relaxed">
          <strong>Usage.</strong> We may log access to the API (e.g. IP, timestamps) for security and operational purposes.
        </p>

        <h2 className="text-base font-semibold text-brand-text mt-5 mb-2">3. How we use information</h2>
        <p className="text-sm text-brand-text my-2 leading-relaxed">
          We use your information to provide and improve the service, enforce our terms, and comply with applicable law. We do not sell your personal data.
        </p>

        <h2 className="text-base font-semibold text-brand-text mt-5 mb-2">4. Data retention and deletion</h2>
        <p className="text-sm text-brand-text my-2 leading-relaxed">
          Account and message data are retained while your account is active. You may request account and data deletion by contacting us. We will process such requests in line with applicable law.
        </p>

        <h2 className="text-base font-semibold text-brand-text mt-5 mb-2">5. Security</h2>
        <p className="text-sm text-brand-text my-2 leading-relaxed">
          We use industry-standard measures (e.g. hashed passwords, HTTPS) to protect your data. No system is completely secure; we encourage you to use a strong, unique password.
        </p>

        <h2 className="text-base font-semibold text-brand-text mt-5 mb-2">6. Third parties</h2>
        <p className="text-sm text-brand-text my-2 leading-relaxed">
          We use infrastructure providers (e.g. hosting, database) to run the service. They process data on our behalf under contractual obligations. We do not share your data with advertisers or data brokers.
        </p>

        <h2 className="text-base font-semibold text-brand-text mt-5 mb-2">7. Your rights</h2>
        <p className="text-sm text-brand-text my-2 leading-relaxed">
          Depending on where you live, you may have rights to access, correct, delete, or port your data, or to object to or restrict processing. Contact us to exercise these rights.
        </p>

        <h2 className="text-base font-semibold text-brand-text mt-5 mb-2">8. Changes</h2>
        <p className="text-sm text-brand-text my-2 leading-relaxed">
          We may update this policy from time to time. We will post the updated version and, where required, notify you of material changes.
        </p>

        <h2 className="text-base font-semibold text-brand-text mt-5 mb-2">9. Contact</h2>
        <p className="text-sm text-brand-text my-2 leading-relaxed">
          For privacy-related questions or requests, contact us at the email or address provided on the main service or website.
        </p>

        <Link to="/" className="inline-block mt-8 text-xs text-brand-dim hover:text-brand-orange transition-colors">
          ← Back to ^_
        </Link>
      </div>
    </div>
  );
}
