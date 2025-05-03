import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../stores/useProjectStore';
import { serializeProject } from '../../lib/behavior/serializer';
import { Button } from '../../components/ui/button';
import { Plus, Download, Trash, Edit } from 'lucide-react';
import { toast } from 'sonner';

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const project = useProjectStore(state => state.project);
  const createProject = useProjectStore(state => state.createProject);
  const loadProject = useProjectStore(state => state.loadProject);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Load projects from localStorage
  const [projects, setProjects] = useState<any[]>([]);
  
  useEffect(() => {
    // Get all projects from localStorage
    const loadedProjects = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('bt-project-')) {
        try {
          const projectData = JSON.parse(localStorage.getItem(key) || '');
          if (projectData && projectData.scope === 'project') {
            loadedProjects.push(projectData);
          }
        } catch (e) {
          console.error('Error parsing project from localStorage:', e);
        }
      }
    }
    
    // If no projects in localStorage but we have a current project, use that
    if (loadedProjects.length === 0 && project) {
      setProjects([project]);
    } else {
      setProjects(loadedProjects);
    }
  }, [project]);

  const handleCreateProject = () => {
    if (projectName.trim() === '') return;
    
    createProject(projectName, projectDescription);
    
    // Get the created project
    const newProject = useProjectStore.getState().project;
    if (newProject) {
      // Save to localStorage
      try {
        const serialized = serializeProject(newProject);
        localStorage.setItem(`bt-project-${newProject.id}`, JSON.stringify(serialized));
        toast.success('Project created successfully');
      } catch (error) {
        console.error('Error saving new project:', error);
      }
    }
    
    setProjectName('');
    setProjectDescription('');
    setIsCreating(false);
    navigate('/editor');
  };

  const handleExportProject = (project: any) => {
    const serialized = serializeProject(project);
    const dataStr = JSON.stringify(serialized, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportName = `${project.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
  };

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        loadProject(json);
        navigate('/editor');
      } catch (error) {
        console.error('Failed to parse project file', error);
        alert('Invalid project file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Projects</h1>
        <div className="flex space-x-4">
          <Button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2"
          >
            <Plus size={18} /> New Project
          </Button>
          <div className="relative">
            <Button 
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              Import Project
            </Button>
            <input 
              type="file" 
              id="file-input" 
              accept=".json" 
              className="hidden" 
              onChange={handleImportProject}
            />
          </div>
        </div>
      </div>

      {isCreating && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
                placeholder="My Behavior Tree Project"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
                placeholder="Description of your project"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject}>
                Create Project
              </Button>
            </div>
          </div>
        </div>
      )}

      {projects.length > 0 ? (
        <div className="grid gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">{project.name}</h3>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">{project.description}</p>
                  <div className="flex mt-2 text-sm text-slate-500 dark:text-slate-400">
                    <span className="mr-4">Trees: {Object.keys(project.trees).length}</span>
                    <span>Last updated: {new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      // Load this project
                      loadProject(project);
                      navigate('/editor');
                    }}
                  >
                    <Edit size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleExportProject(project)}>
                    <Download size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      // Remove from localStorage
                      localStorage.removeItem(`bt-project-${project.id}`);
                      
                      // Update the local state
                      setProjects(prev => prev.filter(p => p.id !== project.id));
                      
                      toast.success('Project deleted');
                    }}
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold mb-2">No Projects Yet</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Get started by creating your first behavior tree project.
          </p>
          <Button onClick={() => setIsCreating(true)}>
            Create Your First Project
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;