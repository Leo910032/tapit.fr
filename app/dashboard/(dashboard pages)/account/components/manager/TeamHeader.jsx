// app/dashboard/(dashboard pages)/account/components/team/manager/TeamHeader.jsx

import { useTranslation } from '@/lib/useTranslation';
import { toast } from 'react-hot-toast';

export const TeamHeader = ({ teamData, onShowInviteModal, onShowSettings }) => {
    const { t } = useTranslation();

    const copyTeamCode = async () => {
        try {
            await navigator.clipboard.writeText(teamData.teamCode);
            toast.success(t('teams.code_copied') || 'Team code copied to clipboard!');
        } catch (error) {
            toast.error(t('teams.copy_failed') || 'Failed to copy code');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{teamData.teamName}</h2>
                    <p className="text-gray-600">{teamData.description || 'No description'}</p>
                    {teamData.teamStats?.lastUpdated && (
                        <p className="text-xs text-gray-500 mt-1">
                            <span className="inline-flex items-center">
                                <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                                Live data · Last updated: {new Date(teamData.teamStats.lastUpdated.seconds * 1000).toLocaleString()}
                            </span>
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onShowInviteModal}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        {t('teams.invite_member') || 'Invite Member'}
                    </button>
                    <button
                        onClick={onShowSettings}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        {t('teams.settings') || 'Settings'}
                    </button>
                </div>
            </div>

            {/* Enhanced Team Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{teamData.memberCount}</div>
                    <div className="text-sm text-gray-600">{t('teams.members') || 'Members'}</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{teamData.teamStats?.totalViews || 0}</div>
                    <div className="text-sm text-gray-600">{t('teams.total_views') || 'Total Views'}</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{teamData.teamStats?.totalClicks || 0}</div>
                    <div className="text-sm text-gray-600">{t('teams.total_clicks') || 'Total Clicks'}</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{teamData.teamStats?.totalContacts || 0}</div>
                    <div className="text-sm text-gray-600">{t('teams.total_contacts') || 'Total Contacts'}</div>
                </div>
                <div className="text-center">
                    <div 
                        className="text-2xl font-bold text-indigo-600 cursor-pointer hover:bg-indigo-50 px-2 py-1 rounded"
                        onClick={copyTeamCode}
                        title="Click to copy"
                    >
                        {teamData.teamCode}
                    </div>
                    <div className="text-sm text-gray-600">{t('teams.join_code') || 'Join Code'}</div>
                </div>
            </div>
        </div>
    );
};