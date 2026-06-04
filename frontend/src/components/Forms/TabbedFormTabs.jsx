import { PROFILE_PAGE } from "../../constants/uiTokens";

/**
 * Profile-style tab bar for multi-section forms.
 * @param {{ tabs: { id: string, label: string, icon?: React.ReactNode }[], active: string, onChange: (id: string) => void }} props
 */
const TabbedFormTabs = ({ tabs, active, onChange }) => (
  <div className="flex items-center gap-1 mb-6 bg-gray-100/80 dark:bg-white/[0.03] rounded-xl p-1 overflow-x-auto scrollbar-hide">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        onClick={() => onChange(tab.id)}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
          active === tab.id ? PROFILE_PAGE.tabActive : PROFILE_PAGE.tabInactive
        }`}
      >
        {tab.icon}
        {tab.label}
      </button>
    ))}
  </div>
);

export default TabbedFormTabs;
