// app/dashboard/(dashboard pages)/account/page.jsx - FINAL VERSION
"use client"; 

import { useTranslation } from '@/lib/useTranslation';
import ManageTeamSection from './components/ManageTeamSection';

// Correcting the component name to follow standard React conventions (PascalCase)
export default function AccountPage() {
    const { t } = useTranslation();

    return (
        <div className="flex-1 py-2 flex flex-col max-h-full overflow-y-auto pb-20">
            <div className="p-4 md:p-6">
                {/* Page Title */}
                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                    {t('account.settings_title') || 'Account Settings'}
                </h1>
                
                {/* 
                    You can place any other account settings components here if you have them,
                    like profile details, password change forms, etc.
                */}
                
                {/* Team Management Section is now the main content of this page */}
                <div className="mt-2">
                    <ManageTeamSection />
                </div>
            </div>
        </div>
    );
}