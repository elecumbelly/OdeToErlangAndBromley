import { useState } from 'react';
import StaffManager from './StaffManager';
import RolesConfiguration from './RolesConfiguration';
import RecruitmentTab from './RecruitmentTab';

export default function WorkforceTab() {
  const [activeSubTab, setActiveSubTab] = useState<'staff' | 'roles' | 'recruitment'>('staff');

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b border-border-subtle">
        <button
          onClick={() => setActiveSubTab('staff')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeSubTab === 'staff'
              ? 'border-cyan text-cyan'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-active'
          }`}
        >
          Staff Directory
        </button>
        <button
          onClick={() => setActiveSubTab('roles')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeSubTab === 'roles'
              ? 'border-cyan text-cyan'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-active'
          }`}
        >
          Roles & Configuration
        </button>
        <button
          onClick={() => setActiveSubTab('recruitment')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeSubTab === 'recruitment'
              ? 'border-cyan text-cyan'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-active'
          }`}
        >
          Recruitment
        </button>
      </div>

      <div className="animate-fade-in">
        {activeSubTab === 'staff' && <StaffManager />}
        {activeSubTab === 'roles' && <RolesConfiguration />}
        {activeSubTab === 'recruitment' && <RecruitmentTab />}
      </div>
    </div>
  );
}
