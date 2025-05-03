import { useState, useEffect } from 'react';
import { useProjectStore } from './stores/useProjectStore';
import AppLayout from './components/layouts/app-layout';
import BehaviorTreeEditor from './components/editor/behavior-tree-editor';
import './App.css';

function App() {
  const [initialized, setInitialized] = useState(false);
  const createProject = useProjectStore((state) => state.createProject);
  const project = useProjectStore((state) => state.project);

  // Create a demo project on first load
  useEffect(() => {
    if (!initialized && !project) {
      createProject('Demo Project', 'A demo behavior tree project');
      setInitialized(true);
    }
  }, [initialized, createProject, project]);

  return (
    <AppLayout>
      <BehaviorTreeEditor />
    </AppLayout>
  );
}

export default App;