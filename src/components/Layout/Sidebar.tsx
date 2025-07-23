import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, ClipboardList, 
  BarChart3, Award, Settings, HelpCircle, Book,
  UserCheck, Shield, Target, Eye, Building, MapPin,
  BookOpen, Trophy, TrendingUp, Timer
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const menuItems = {
  admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/users', icon: Users, label: 'User Management' },
    { to: '/roles', icon: Shield, label: 'Role Management' },
    { to: '/surveys', icon: FileText, label: 'Survey Management' },
    { to: '/questions', icon: Book, label: 'Question Bank' },
    { to: '/results', icon: BarChart3, label: 'Results & Analytics' },
    { to: '/enumerator-status', icon: Eye, label: 'Enumerator Status' },
    { to: '/certificates', icon: Award, label: 'Certificates' },
    { to: '/settings', icon: Settings, label: 'System Settings' }
  ],
  'zo user': [
    { to: '/zo-dashboard', icon: LayoutDashboard, label: 'ZO Dashboard' },
    { to: '/zone-performance', icon: MapPin, label: 'Zone Performance' },
    { to: '/regional-overview', icon: Building, label: 'Regional Overview' },
    { to: '/enumerator-status', icon: Eye, label: 'Enumerator Status' },
    { to: '/results', icon: BarChart3, label: 'Zone Analytics' },
    { to: '/certificates', icon: Award, label: 'Certificates' }
  ],
  'ro user': [
    { to: '/ro-dashboard', icon: LayoutDashboard, label: 'RO Dashboard' },
    { to: '/district-performance', icon: Building, label: 'District Performance' },
    { to: '/supervisor-teams', icon: UserCheck, label: 'Supervisor Teams' },
    { to: '/enumerator-status', icon: Eye, label: 'Enumerator Status' },
    { to: '/results', icon: BarChart3, label: 'Regional Analytics' },
    { to: '/certificates', icon: Award, label: 'Certificates' }
  ],
  supervisor: [
    { to: '/supervisor-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/team-results', icon: BarChart3, label: 'Team Results' },
    { to: '/my-enumerators', icon: UserCheck, label: 'My Enumerators' },
    { to: '/enumerator-status', icon: Eye, label: 'Team Status' },
    { to: '/assigned-surveys', icon: FileText, label: 'Assigned Surveys' },
    { to: '/certificates', icon: Award, label: 'Team Certificates' }
  ],
  enumerator: [
    { to: '/enumerator-dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
    { to: '/available-tests', icon: BookOpen, label: 'Available Tests' },
    { to: '/my-results', icon: TrendingUp, label: 'My Results' },
    { to: '/my-certificates', icon: Trophy, label: 'My Certificates' },
    { to: '/test-schedule', icon: Timer, label: 'Test Schedule' }
  ]
};

export function Sidebar() {
  const { user } = useAuth();
  
  const roleKey = user?.role.name.toLowerCase().replace(' ', '_') as keyof typeof menuItems;
  const items = menuItems[roleKey] || menuItems.enumerator;

  const getRoleIcon = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return 'bg-red-600';
      case 'zo user':
        return 'bg-purple-600';
      case 'ro user':
        return 'bg-indigo-600';
      case 'supervisor':
        return 'bg-green-600';
      case 'enumerator':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 ${getRoleIcon(user?.role.name || '')} rounded-lg flex items-center justify-center`}>
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">eSigma</h2>
            <p className="text-xs text-gray-400">Survey Platform</p>
          </div>
        </div>
        
        {/* User Info */}
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <p className="text-sm font-medium text-white">{user?.name}</p>
          <p className="text-xs text-gray-400">{user?.role.name}</p>
          {user?.zone && (
            <p className="text-xs text-gray-400">{user.zone}</p>
          )}
          {user?.region && (
            <p className="text-xs text-gray-400">{user.region}</p>
          )}
          {user?.district && (
            <p className="text-xs text-gray-400">{user.district}</p>
          )}
        </div>
      </div>
      
      <nav className="flex-1 px-4 pb-4">
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-800">
        <button className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors w-full">
          <HelpCircle className="w-5 h-5" />
          <span>Help & Support</span>
        </button>
      </div>
    </aside>
  );
}