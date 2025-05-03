import React, { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

type AppLayoutProps = {
  children: ReactNode;
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <header className="bg-white dark:bg-slate-800 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24"
              className="h-6 w-6 text-emerald-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 21V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14l-3-2-2 2-2-2-2 2-2-2-3 2z"/>
              <line x1="12" y1="7" x2="12" y2="13"/>
              <line x1="9" y1="10" x2="15" y2="10"/>
            </svg>
            <h1 className="text-xl font-bold tracking-tight">Behavior Tree Editor</h1>
          </div>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <NavLink to="/" className={({ isActive }) => 
                  isActive 
                    ? "text-emerald-500 dark:text-emerald-400" 
                    : "text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400"
                }>
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink to="/editor" className={({ isActive }) => 
                  isActive 
                    ? "text-emerald-500 dark:text-emerald-400" 
                    : "text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400"
                }>
                  Editor
                </NavLink>
              </li>
              <li>
                <NavLink to="/projects" className={({ isActive }) => 
                  isActive 
                    ? "text-emerald-500 dark:text-emerald-400" 
                    : "text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400"
                }>
                  Projects
                </NavLink>
              </li>
              <li>
                <NavLink to="/settings" className={({ isActive }) => 
                  isActive 
                    ? "text-emerald-500 dark:text-emerald-400" 
                    : "text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400"
                }>
                  Settings
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
      <footer className="bg-white dark:bg-slate-800 shadow-inner mt-10">
        <div className="container mx-auto px-4 py-3 text-center text-slate-500 dark:text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} Behavior Tree Editor. Modern version of <a href="http://behavior3.com" className="text-emerald-500 hover:underline">Behavior3 Editor</a>.
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;