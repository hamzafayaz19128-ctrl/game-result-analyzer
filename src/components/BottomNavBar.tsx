import React from 'react';
import {
  PenSquare,
  BarChart2,
  GitCommit,
  History,
  Settings,
} from 'lucide-react';

export type MainTabType =
  | 'record'
  | 'analysis'
  | 'patterns'
  | 'history'
  | 'settings';

interface BottomNavBarProps {
  activeTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const items: { id: MainTabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'record',
      label: 'Record',
      icon: <PenSquare className="w-5 h-5" />,
    },
    {
      id: 'analysis',
      label: 'Analysis',
      icon: <BarChart2 className="w-5 h-5" />,
    },
    {
      id: 'patterns',
      label: 'Patterns',
      icon: <GitCommit className="w-5 h-5" />,
    },
    {
      id: 'history',
      label: 'History',
      icon: <History className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="bg-slate-900 border-t border-slate-800 text-slate-400 py-1.5 px-2 sticky bottom-0 z-30 shadow-2xl pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 min-h-[48px] rounded-xl transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 font-bold'
                  : 'hover:text-slate-200 hover:bg-slate-800/50 text-slate-400'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : ''
                }`}
              >
                {item.icon}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
