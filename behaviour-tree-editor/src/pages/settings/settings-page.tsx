import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { useProjectStore } from '../../stores/useProjectStore';
import { toast } from 'sonner';

interface ThemeOption {
  id: string;
  name: string;
}

const SettingsPage: React.FC = () => {
  const project = useProjectStore(state => state.project);
  const [theme, setTheme] = useState<string>('system');
  const [autoSave, setAutoSave] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  
  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('bt-theme') || 'system';
    const savedAutoSave = localStorage.getItem('bt-auto-save') === 'true';
    const savedShowGrid = localStorage.getItem('bt-show-grid') !== 'false'; // Default to true
    
    setTheme(savedTheme);
    setAutoSave(savedAutoSave);
    setShowGrid(savedShowGrid);
  }, []);
  
  const themeOptions: ThemeOption[] = [
    { id: 'light', name: 'Light' },
    { id: 'dark', name: 'Dark' },
    { id: 'system', name: 'System' }
  ];
  
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('bt-theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    toast.success(`Theme changed to ${newTheme}`);
  };
  
  const handleAutoSaveChange = (enabled: boolean) => {
    setAutoSave(enabled);
    localStorage.setItem('bt-auto-save', String(enabled));
    toast.success(`Auto-save ${enabled ? 'enabled' : 'disabled'}`);
  };
  
  const handleShowGridChange = (enabled: boolean) => {
    setShowGrid(enabled);
    localStorage.setItem('bt-show-grid', String(enabled));
    toast.success(`Grid display ${enabled ? 'enabled' : 'disabled'}`);
  };
  
  // Note: In a full app, there would be more settings here

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="space-y-10">
        {/* Appearance Settings */}
        <section className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Appearance</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <div className="flex space-x-2">
                {themeOptions.map(option => (
                  <Button
                    key={option.id}
                    variant={theme === option.id ? "default" : "outline"}
                    onClick={() => handleThemeChange(option.id)}
                    className="min-w-24"
                  >
                    {option.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* Editor Settings */}
        <section className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Editor</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Auto-save projects</label>
              <div 
                className={`relative inline-block w-12 h-6 rounded-full ${autoSave ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'} cursor-pointer`}
                onClick={() => handleAutoSaveChange(!autoSave)}
              >
                <span className={`absolute transition-transform duration-200 left-1 top-1 w-4 h-4 rounded-full bg-white ${autoSave ? 'translate-x-6' : ''}`}></span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Show grid in editor</label>
              <div 
                className={`relative inline-block w-12 h-6 rounded-full ${showGrid ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'} cursor-pointer`}
                onClick={() => handleShowGridChange(!showGrid)}
              >
                <span className={`absolute transition-transform duration-200 left-1 top-1 w-4 h-4 rounded-full bg-white ${showGrid ? 'translate-x-6' : ''}`}></span>
              </div>
            </div>
          </div>
        </section>
        
        {/* Project Details */}
        {project && (
          <section className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Current Project</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Project Name</label>
                <div className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700">
                  {project.name}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <div className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 min-h-16">
                  {project.description || "No description"}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Project ID</label>
                <div className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 font-mono text-sm">
                  {project.id}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;