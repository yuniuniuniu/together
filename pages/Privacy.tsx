import React from 'react';
import { useNavigate } from 'react-router-dom';

const Privacy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col bg-paper min-h-screen font-sans">
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-paper/80 backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors -ml-2"
        >
          <span className="material-symbols-outlined text-ink/80">arrow_back</span>
        </button>
        <h1 className="text-xs font-bold tracking-[0.15em] uppercase text-soft-gray text-center">Privacy Policy</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-6 py-4">
        <div className="prose prose-sm max-w-none text-ink/80">
          <p className="text-sm text-soft-gray mb-6">Last updated: January 2025</p>

          <h2 className="text-lg font-bold text-ink mt-6 mb-3">1. Information We Collect</h2>
          <p className="mb-4 leading-relaxed">
            We collect information you provide directly to us, including:
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li>Phone number for account verification</li>
            <li>Profile information (nickname, avatar)</li>
            <li>Memories, photos, and milestones you create</li>
            <li>Location data when you choose to add it to memories</li>
          </ul>

          <h2 className="text-lg font-bold text-ink mt-6 mb-3">2. How We Use Your Information</h2>
          <p className="mb-4 leading-relaxed">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li>Provide, maintain, and improve our services</li>
            <li>Send you notifications about your account and activities</li>
            <li>Protect against fraudulent or unauthorized activity</li>
          </ul>

          <h2 className="text-lg font-bold text-ink mt-6 mb-3">3. Information Sharing</h2>
          <p className="mb-4 leading-relaxed">
            Your memories and content are only shared with your connected partner within the App. We do not sell, trade, or otherwise transfer your personal information to outside parties.
          </p>

          <h2 className="text-lg font-bold text-ink mt-6 mb-3">4. Data Security</h2>
          <p className="mb-4 leading-relaxed">
            We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
          </p>

          <h2 className="text-lg font-bold text-ink mt-6 mb-3">5. Data Retention</h2>
          <p className="mb-4 leading-relaxed">
            We retain your information for as long as your account is active. You can request deletion of your data at any time by contacting us.
          </p>

          <h2 className="text-lg font-bold text-ink mt-6 mb-3">6. Your Rights</h2>
          <p className="mb-4 leading-relaxed">
            You have the right to:
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data</li>
          </ul>

          <h2 className="text-lg font-bold text-ink mt-6 mb-3">7. Children's Privacy</h2>
          <p className="mb-4 leading-relaxed">
            Our service is not intended for users under the age of 18. We do not knowingly collect information from children under 18.
          </p>

          <h2 className="text-lg font-bold text-ink mt-6 mb-3">8. Changes to This Policy</h2>
          <p className="mb-4 leading-relaxed">
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.
          </p>

          <h2 className="text-lg font-bold text-ink mt-6 mb-3">9. Contact Us</h2>
          <p className="mb-4 leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us at privacy@together-app.com.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
