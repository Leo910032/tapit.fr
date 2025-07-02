// app/dashboard/(dashboard pages)/account/page.jsx - VERSION MISE À JOUR
"use client"; 

import { useTranslation } from '@/lib/useTranslation';
import ManageTeamSection from './components/ManageTeamSection';
import ContactInfoSection from './components/ContactInfoSection';

export default function AccountPage() {
    const { t } = useTranslation();

    return (
        <div className="flex-1 py-2 flex flex-col max-h-full overflow-y-auto pb-20">
            <div className="p-4 md:p-6 space-y-8">
                {/* Page Title */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {t('account.settings_title') || 'Account Settings'}
                    </h1>
                    <p className="text-gray-600">
                        {t('account.settings_subtitle') || 'Manage your profile information and team settings'}
                    </p>
                </div>
                
                {/* Contact Information Section */}
                <ContactInfoSection />
                
                {/* Team Management Section */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        {t('account.team_management') || 'Team Management'}
                    </h2>
                    <ManageTeamSection />
                </div>
            </div>
        </div>
    );
}