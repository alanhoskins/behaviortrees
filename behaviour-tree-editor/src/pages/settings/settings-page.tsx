import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { useProjectStore } from '../../stores/useProjectStore';
import { getThemePreference, setThemePreference, type ThemePreference } from '../../lib/theme';
import { toast } from 'sonner';

interface ThemeOption {
  id: string;
  name: string;
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`relative inline-block w-12 h-6 rounded-full cursor-pointer transition-colors ${
      checked ? 'bg-accent' : 'bg-border'
    }`}
  >
    <span
      className={`absolute transition-all duration-200 top-1 w-4 h-4 rounded-full bg-knob ${
        checked ? 'left-7' : 'left-1'
      }`}
    />
  </button>
);

const SettingsPage: React.FC = () => {
  const project = useProjectStore(state => state.project);
  const [theme, setTheme] = useState<string>('system');
  const [autoSave, setAutoSave] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedTheme = getThemePreference();
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
    setThemePreference(newTheme as ThemePreference);
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
      <h1 className="text-3xl font-medium mb-8">Settings</h1>

      <div className="space-y-10">
        {/* Appearance Settings */}
        <section className="card">
          <h2 className="text-xl font-medium mb-4">Appearance</h2>

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
        <section className="card">
          <h2 className="text-xl font-medium mb-4">Editor</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Auto-save projects</label>
              <Toggle
                checked={autoSave}
                onChange={handleAutoSaveChange}
                label="Auto-save projects"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Show grid in editor</label>
              <Toggle
                checked={showGrid}
                onChange={handleShowGridChange}
                label="Show grid in editor"
              />
            </div>
          </div>
        </section>

        {/* Project Details */}
        {project && (
          <section className="card">
            <h2 className="text-xl font-medium mb-4">Current Project</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Project Name</label>
                <div className="px-4 py-2 border border-border rounded-md bg-inset">
                  {project.name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <div className="px-4 py-2 border border-border rounded-md bg-inset min-h-16 text-muted">
                  {project.description || "No description"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Project ID</label>
                <div className="px-4 py-2 border border-border rounded-md bg-inset font-mono text-sm text-muted">
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
