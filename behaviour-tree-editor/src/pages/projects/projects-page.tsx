import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../stores/useProjectStore';
import { b3ToProject, parseImportedJson, projectToB3 } from '../../lib/behavior/b3';
import { Button } from '../../components/ui/button';
import { Plus, Download, Trash, FolderOpen, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const project = useProjectStore(state => state.project);
  const createProject = useProjectStore(state => state.createProject);
  const loadProject = useProjectStore(state => state.loadProject);
  const renameProject = useProjectStore(state => state.renameProject);
  const closeProject = useProjectStore(state => state.closeProject);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  // Load projects from localStorage
  const [projects, setProjects] = useState<any[]>([]);
  
  useEffect(() => {
    // Get all projects from localStorage
    const loadedProjects = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('bt-project-')) {
        try {
          const raw = JSON.parse(localStorage.getItem(key) || '');
          const imported = parseImportedJson(raw);
          if (imported.kind === 'project') {
            loadedProjects.push(imported.project);
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
        const serialized = projectToB3(newProject);
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
    const serialized = projectToB3(project);
    const dataStr = JSON.stringify(serialized, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportName = `${project.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
  };

  const commitRename = (target: any) => {
    const name = renameValue.trim();
    setRenamingId(null);
    if (!name || name === target.name) return;

    if (project?.id === target.id) {
      // Open project: rename through the store (also persists)
      renameProject(name);
    } else {
      // Closed project: rewrite its stored payload directly
      try {
        const updated = { ...target, name, updatedAt: new Date().toISOString() };
        localStorage.setItem(`bt-project-${target.id}`, JSON.stringify(projectToB3(updated)));
      } catch (error) {
        console.error('Error renaming project:', error);
        toast.error('Failed to rename project');
        return;
      }
    }
    setProjects(prev => prev.map(p => (p.id === target.id ? { ...p, name } : p)));
    toast.success('Project renamed');
  };

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const imported = parseImportedJson(json);

        if (imported.kind === 'project') {
          loadProject(imported.project);
        } else if (imported.kind === 'tree') {
          // A standalone tree file becomes a new single-tree project
          loadProject(b3ToProject({ trees: [imported.tree], custom_nodes: imported.tree.custom_nodes }));
        } else {
          toast.error('Node files can be imported from within the editor');
          return;
        }
        navigate('/editor');
      } catch (error) {
        console.error('Failed to parse project file', error);
        toast.error('Invalid behavior tree file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-medium">Projects</h1>
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
        <div className="card mb-8">
          <h2 className="text-xl font-medium mb-4">Create New Project</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Behavior Tree Project"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
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
          {projects.map((item) => (
            <div key={item.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {renamingId === item.id ? (
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => commitRename(item)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename(item);
                          else if (e.key === 'Escape') setRenamingId(null);
                        }}
                        className="text-xl font-medium"
                        autoFocus
                      />
                    ) : (
                      <h3 className="text-xl font-medium truncate">{item.name}</h3>
                    )}
                    {project?.id === item.id && (
                      <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border border-accent bg-accent-wash text-accent-soft">
                        Open
                      </span>
                    )}
                  </div>
                  <p className="text-muted mt-1">{item.description}</p>
                  <div className="flex mt-2 text-sm text-faint">
                    <span className="mr-4">Trees: {Object.keys(item.trees).length}</span>
                    <span>Last updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {project?.id === item.id ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Close project"
                      onClick={() => {
                        closeProject();
                        toast.success('Project closed');
                      }}
                    >
                      <X size={16} />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Open project"
                      onClick={() => {
                        loadProject(item);
                        navigate('/editor');
                      }}
                    >
                      <FolderOpen size={16} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Rename project"
                    onClick={() => {
                      setRenamingId(item.id);
                      setRenameValue(item.name);
                    }}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" title="Export project" onClick={() => handleExportProject(item)}>
                    <Download size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Delete project"
                    className="text-danger-soft hover:bg-danger/10"
                    onClick={() => {
                      if (!confirm(`Delete project "${item.name}"?`)) return;
                      localStorage.removeItem(`bt-project-${item.id}`);
                      if (project?.id === item.id) {
                        closeProject();
                      }
                      setProjects(prev => prev.filter(p => p.id !== item.id));
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
        <div className="card text-center">
          <h2 className="text-xl font-medium mb-2">No Projects Yet</h2>
          <p className="text-muted mb-6">
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