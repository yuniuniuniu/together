import React from 'react';
import { useNavigate } from 'react-router-dom';

const Terms: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col bg-paper min-h-screen font-sans">
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 pb-4 pt-safe-offset-4 bg-paper/80 backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors -ml-2"
        >
          <span className="material-symbols-outlined text-ink/80">arrow_back</span>
        </button>
        <h1 className="text-xs font-bold tracking-[0.15em] uppercase text-soft-gray text-center">Terms of Service</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-6 py-4">
        <div className="prose prose-sm max-w-none text-ink/80">
          <p className="text-sm text-soft-gray mb-6">Last updated: January 2025</p>

          <h2 className="text-lg font-bold text-ink mt-6 mb-3">1. Acceptance of Terms</h2>
          <p className="mb-4 leading-relaxed">
            By accessing and using Together ("the App"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.
          </p>

          <h2 className="text-lg font-bold text-ink mt-6 mb-3">2. Description of Service</h2>
          <p className="mb-4 leading-relaxed">
            Together is a private couples' app designed to help partners share memories, milestones, and moments together. The service is intended for personal, non-commercial use only.
          </p>

          <h2 className="text-lg font-bold text-ink mt-6 mb-3">3. User Accounts</h2>
          <p className="mb-4 leading-relaxed">
            You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
          </p>

          <h2 className="text-lg font-bold text-ink mt-6 mb-3">4. User Content</h2>
          <p className="mb-4 leading-relaxed">
            You retain ownership of all content you create and share within the App. By using the App, you grant us a limited license to store and display your content to you and your connected partner.
          </p>

          <h2 className="text-lg font-bold text-ink mt-6 mb-3">5. Prohibited Conduct</h2>
          <p className="mb-4 leading-relaxed">
            You agree not to use the App for any unlawful purpose or in any way that could damage, disable, or impair the service.
          </p>

          <h2 className="text-lg font-bold text-ink mt-6 mb-3">6. Termination</h2>
          <p className="mb-4 leading-relaxed">
            We reserve the right to terminate or suspend your account at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users of the App.
          </p>

          <h2 className="text-lg font-bold text-ink mt-6 mb-3">7. Changes to Terms</h2>
          <p className="mb-4 leading-relaxed">
            We reserve the right to modify these terms at any time. We will notify users of any material changes via the App or email.
          </p>

          <h2 className="text-lg font-bold text-ink mt-6 mb-3">8. Contact</h2>
          <p className="mb-4 leading-relaxed">
            If you have any questions about these Terms, please contact us at support@together-app.com.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Terms;
