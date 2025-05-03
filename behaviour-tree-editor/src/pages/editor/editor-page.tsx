import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BehaviorTreeEditor from '../../components/editor/behavior-tree-editor';
import { useProjectStore } from '../../stores/useProjectStore';

const EditorPage: React.FC = () => {
  const navigate = useNavigate();
  const project = useProjectStore(state => state.project);
  const createProject = useProjectStore(state => state.createProject);
  const [initialized, setInitialized] = useState(false);

  // Redirect to home if no project, or create a demo project
  useEffect(() => {
    if (!project && !initialized) {
      createProject('Demo Project', 'A demo behavior tree project');
      setInitialized(true);
    }
  }, [project, initialized, createProject, navigate]);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading project...</h2>
        </div>
      </div>
    );
  }

  return <BehaviorTreeEditor />;
};

export default EditorPage;