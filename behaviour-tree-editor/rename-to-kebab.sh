#!/bin/bash

# Rename component files to kebab-case and update imports

# Function to convert PascalCase/camelCase to kebab-case
function to_kebab_case() {
    echo "$1" | sed -E 's/([a-z0-9])([A-Z])/\1-\2/g' | tr '[:upper:]' '[:lower:]'
}

# Create a mapping of files to rename
declare -A file_mapping

# App.tsx is a special case
file_mapping["/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/App.tsx"]="/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/app.tsx"

# Process editor component files
file_mapping["/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/editor/BehaviorTreeEditor.tsx"]="/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/editor/behavior-tree-editor.tsx"
file_mapping["/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/editor/EdgeContextMenu.tsx"]="/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/editor/edge-context-menu.tsx"
file_mapping["/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/editor/NodeContextMenu.tsx"]="/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/editor/node-context-menu.tsx"
file_mapping["/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/editor/edges/ContextEdge.tsx"]="/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/editor/edges/context-edge.tsx"

# Process node component files
file_mapping["/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/editor/nodes/ActionNode.tsx"]="/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/editor/nodes/action-node.tsx"
file_mapping["/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/editor/nodes/BaseNode.tsx"]="/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/editor/nodes/base-node.tsx"
file_mapping["/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/editor/nodes/CompositeNode.tsx"]="/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/editor/nodes/composite-node.tsx"
file_mapping["/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/editor/nodes/ConditionNode.tsx"]="/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/editor/nodes/condition-node.tsx"
file_mapping["/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/editor/nodes/DecoratorNode.tsx"]="/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/editor/nodes/decorator-node.tsx"
file_mapping["/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/editor/nodes/RootNode.tsx"]="/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/editor/nodes/root-node.tsx"

# Process layout component files
file_mapping["/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/layouts/AppLayout.tsx"]="/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/layouts/app-layout.tsx"
file_mapping["/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/layouts/EditorLayout.tsx"]="/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/layouts/editor-layout.tsx"

# Process panel component files
file_mapping["/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/panels/NodesPanel.tsx"]="/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/panels/nodes-panel.tsx"
file_mapping["/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/panels/PropertiesPanel.tsx"]="/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/panels/properties-panel.tsx"
file_mapping["/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/panels/TreesPanel.tsx"]="/Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src/components/panels/trees-panel.tsx"

# UI components already use kebab-case, no need to rename them

# Rename files
for old_path in "${!file_mapping[@]}"; do
    new_path="${file_mapping[$old_path]}"
    echo "Renaming $old_path to $new_path"
    mv "$old_path" "$new_path"
done

# Update imports in all .tsx and .ts files
find /Users/alanhoskins/workspace/projects/behaviortrees/behaviour-tree-editor/src -name "*.tsx" -o -name "*.ts" | while read -r file; do
    for old_path in "${!file_mapping[@]}"; do
        new_path="${file_mapping[$old_path]}"
        
        # Extract the filename without extension and path
        old_name=$(basename "$old_path" .tsx)
        new_name=$(basename "$new_path" .tsx)
        
        # Replace imports like "import X from './ComponentName'" with "import X from './component-name'"
        old_import_path="${old_name}"
        new_import_path="${new_name}"
        
        # Perform the replacement
        sed -i "" "s/from ['\"][\.\/]*[^'\"]*\/${old_import_path}['\"/]/from '..\/${new_import_path}'/g" "$file"
        sed -i "" "s/from ['\"][\.\/]*[^'\"]*\/${old_import_path}['\"/]/from '..\/${new_import_path}'/g" "$file"
        sed -i "" "s/from ['\"][\.\/]*${old_import_path}['\"/]/from '..\/${new_import_path}'/g" "$file"
        sed -i "" "s/from ['\"]\.\/${old_import_path}['\"/]/from './${new_import_path}'/g" "$file"
    done
done

echo "Conversion to kebab-case complete!"