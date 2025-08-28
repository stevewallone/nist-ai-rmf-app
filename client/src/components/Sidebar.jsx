import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  HomeIcon,
  DocumentCheckIcon,
  FolderIcon,
  ChartBarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Assessments', href: '/assessments', icon: DocumentCheckIcon },
  { name: 'Documents', href: '/documents', icon: FolderIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Sidebar({ open, setOpen }) {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={classNames(
        open ? 'translate-x-0' : '-translate-x-full',
        'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0'
      )}>
        <div className="flex items-center justify-between flex-shrink-0 h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <DocumentCheckIcon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-sm font-semibold text-gray-900">AI RMF</h1>
              <p className="text-xs text-gray-500">Compliance</p>
            </div>
          </div>
          
          <button
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            onClick={() => setOpen(false)}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
                           (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={classNames(
                  isActive
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center px-3 py-2 text-sm font-medium border-l-4 rounded-r-md transition-colors'
                )}
                onClick={() => setOpen(false)}
              >
                <item.icon
                  className={classNames(
                    isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500',
                    'mr-3 flex-shrink-0 h-6 w-6'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Organization info */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Organization</div>
          <div className="text-sm font-medium text-gray-900 truncate">
            {user?.organization?.name || 'Loading...'}
          </div>
          <div className="text-xs text-gray-500">
            NIST AI RMF Compliance
          </div>
        </div>
      </div>
    </>
  );
}