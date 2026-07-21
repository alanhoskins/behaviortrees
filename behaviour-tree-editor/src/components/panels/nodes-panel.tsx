import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { Node, NodeCategory } from '../../types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import {
	CATEGORY_ORDER,
	CATEGORY_RAIL,
	CATEGORY_TEXT,
	NODE_CATEGORIES,
} from '../../lib/node-categories';
import NodeEditModal from '../modals/node-edit-modal';

/**
 * Tracks whether a horizontally scrollable strip has content off either edge,
 * so the overflow arrows can be shown only when they mean something.
 */
function useOverflowArrows() {
	const ref = useRef<HTMLDivElement>(null);
	const [edges, setEdges] = useState({ start: false, end: false });

	const measure = useCallback(() => {
		const el = ref.current;
		if (!el) return;
		const max = el.scrollWidth - el.clientWidth;
		const start = el.scrollLeft > 1;
		const end = max > 1 && el.scrollLeft < max - 1;
		// Bail out when nothing changed: this runs after every render, so
		// returning a fresh object unconditionally would loop forever.
		setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
	}, []);

	useLayoutEffect(measure);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		// The rail is drag-resizable, so overflow changes without any scroll event
		const observer = new ResizeObserver(measure);
		observer.observe(el);
		el.addEventListener('scroll', measure, { passive: true });
		return () => {
			observer.disconnect();
			el.removeEventListener('scroll', measure);
		};
	}, [measure]);

	const scrollBy = (delta: number) => ref.current?.scrollBy({ left: delta, behavior: 'smooth' });

	return { ref, edges, scrollBy };
}

const NodesPanel: React.FC = () => {
	const [activeTab, setActiveTab] = useState<NodeCategory>('composite');
	const [modalOpen, setModalOpen] = useState(false);
	const [editingNode, setEditingNode] = useState<Node | null>(null);
	const project = useProjectStore((state) => state.project);
	const deleteNode = useProjectStore((state) => state.deleteNode);
	const tabs = useOverflowArrows();

	if (!project) {
		return <div className="p-4 text-center text-faint">No project loaded</div>;
	}

	// Group nodes by category
	const nodesByCategory = Object.values(project.nodes).reduce((acc, node) => {
		if (!acc[node.category]) {
			acc[node.category] = [];
		}
		acc[node.category].push(node);
		return acc;
	}, {} as Record<NodeCategory, Node[]>);

	// Sort nodes by name
	for (const category in nodesByCategory) {
		nodesByCategory[category as NodeCategory].sort((a, b) => a.name.localeCompare(b.name));
	}

	// Root is a block category, not a palette one — every tree has exactly one,
	// created for it. Only show the tab if custom root templates actually exist.
	const visibleCategories = CATEGORY_ORDER.filter(
		(category) => category !== 'root' || (nodesByCategory.root?.length ?? 0) > 0,
	);

	const handleCreateNode = () => {
		setEditingNode(null);
		setModalOpen(true);
	};

	const handleEditNode = (node: Node) => {
		setEditingNode(node);
		setModalOpen(true);
	};

	const handleDeleteNode = (node: Node) => {
		if (!confirm(`Delete node "${node.name}"? Blocks using it stay in trees but lose their template.`)) {
			return;
		}
		deleteNode(node.name);
		toast.success(`Node "${node.name}" deleted`);
	};

	const onDragStart = (event: React.DragEvent, nodeType: string) => {
		event.dataTransfer.setData('application/reactflow', nodeType);
		event.dataTransfer.effectAllowed = 'move';
	};

	const handleTabChange = (value: string) => {
		setActiveTab(value as NodeCategory);
	};

	return (
		<div className="flex flex-col h-full">
			<Tabs
				defaultValue={activeTab}
				value={activeTab}
				onValueChange={handleTabChange}
				className="w-full"
			>
				{/* The rail is drag-resizable, so the strip can overflow at narrow
				    widths. Arrows appear only on the side that has hidden tabs —
				    a bare scroll region gives no hint there's more. */}
				<div className="relative mx-3 mt-3 rounded-md bg-inset">
					<TabsList
						ref={tabs.ref}
						className="no-scrollbar flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-md border-transparent bg-transparent p-1"
					>
						{visibleCategories.map((category) => (
							<TabsTrigger
								key={category}
								value={category}
								className="shrink-0 rounded-md px-2.5 py-1 text-xs whitespace-nowrap text-muted data-[state=active]:bg-accent-wash data-[state=active]:text-accent-soft"
							>
								{NODE_CATEGORIES[category].title}
							</TabsTrigger>
						))}
					</TabsList>

					{tabs.edges.start && (
						<button
							type="button"
							aria-label="Scroll categories left"
							onClick={() => tabs.scrollBy(-120)}
							className="absolute inset-y-0 left-0 grid w-7 place-items-center rounded-l-md bg-gradient-to-r from-inset from-60% to-transparent text-muted hover:text-accent-soft"
						>
							<ChevronLeft size={14} />
						</button>
					)}
					{tabs.edges.end && (
						<button
							type="button"
							aria-label="Scroll categories right"
							onClick={() => tabs.scrollBy(120)}
							className="absolute inset-y-0 right-0 grid w-7 place-items-center rounded-r-md bg-gradient-to-l from-inset from-60% to-transparent text-muted hover:text-accent-soft"
						>
							<ChevronRight size={14} />
						</button>
					)}
				</div>

				{CATEGORY_ORDER.map((category) => (
					<TabsContent
						key={category}
						value={category}
						className="flex-1 overflow-auto p-3 space-y-3 mt-0"
					>
						{nodesByCategory[category] && nodesByCategory[category].length > 0 ? (
							nodesByCategory[category].map((node) => (
								<div
									key={node.name}
									data-palette-node
									draggable
									onDragStart={(event) => {
										// Find the key for this node
										const nodeKey = Object.keys(project.nodes).find(
											(key) => project.nodes[key].name === node.name,
										);
										onDragStart(event, nodeKey || node.name);
									}}
									className="group relative overflow-hidden bg-surface border border-border rounded-md pl-3 pr-3 py-2 cursor-grab active:cursor-grabbing hover:border-accent"
								>
									<span
										className={cn(
											'absolute left-0 top-0 bottom-0 w-[3px]',
											CATEGORY_RAIL[node.category],
										)}
									/>
									<div className={cn('kicker', CATEGORY_TEXT[node.category])}>
										{NODE_CATEGORIES[node.category].kicker}
									</div>
									<div className="text-accent-soft font-medium text-sm">
										{node.title || node.name}
									</div>
									{node.description && (
										<div className="text-muted text-xs leading-relaxed">{node.description}</div>
									)}
									{!node.isDefault && (
										<div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
											<button
												onClick={(e) => {
													e.stopPropagation();
													handleEditNode(node);
												}}
												className="p-1 rounded-md bg-overlay hover:bg-fg/20"
												title="Edit node"
											>
												<Pencil size={12} />
											</button>
											<button
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteNode(node);
												}}
												className="p-1 rounded-md bg-overlay hover:bg-fg/20"
												title="Delete node"
											>
												<Trash2 size={12} />
											</button>
										</div>
									)}
								</div>
							))
						) : (
							<div className="p-4 text-center text-faint">
								No {NODE_CATEGORIES[category].title.toLowerCase()} nodes available
							</div>
						)}
					</TabsContent>
				))}
			</Tabs>

			{/* Add Node Button */}
			<div className="p-3 border-t border-divider mt-auto">
				<Button onClick={handleCreateNode} variant="outline" className="w-full">
					<Plus className="h-5 w-5 mr-2" />
					{/* Root isn't a palette category, so that tab creates an Action —
					    matching the defaultCategory passed to the modal below */}
					New {NODE_CATEGORIES[activeTab === 'root' ? 'action' : activeTab].kicker}
				</Button>
			</div>

			<NodeEditModal
				open={modalOpen}
				onOpenChange={setModalOpen}
				node={editingNode}
				defaultCategory={activeTab === 'root' ? 'action' : activeTab}
			/>
		</div>
	);
};

export default NodesPanel;
