import React, { useEffect, useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useProjectStore } from '../../stores/useProjectStore';
import { Node, NodeCategory } from '../../types';

type PropertyRow = { key: string; value: string };

type NodeEditModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	// When set, the modal edits this custom node; otherwise it creates one
	node?: Node | null;
	defaultCategory?: NodeCategory;
};

const CATEGORIES: NodeCategory[] = ['composite', 'decorator', 'action', 'condition'];

// Property values round-trip as JSON scalars; the inputs hold strings
const toRows = (properties: Record<string, unknown>): PropertyRow[] =>
	Object.entries(properties).map(([key, value]) => ({ key, value: JSON.stringify(value) }));

const parseValue = (raw: string): unknown => {
	const text = raw.trim();
	if (text === '') return '';
	try {
		return JSON.parse(text);
	} catch {
		return text; // plain unquoted string
	}
};

const NodeEditModal: React.FC<NodeEditModalProps> = ({
	open,
	onOpenChange,
	node = null,
	defaultCategory = 'action',
}) => {
	const project = useProjectStore((state) => state.project);
	const createNode = useProjectStore((state) => state.createNode);
	const updateNode = useProjectStore((state) => state.updateNode);

	const [name, setName] = useState('');
	const [category, setCategory] = useState<NodeCategory>(defaultCategory);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [rows, setRows] = useState<PropertyRow[]>([]);

	useEffect(() => {
		if (!open) return;
		setName(node?.name ?? '');
		setCategory(node?.category ?? defaultCategory);
		setTitle(node?.title ?? '');
		setDescription(node?.description ?? '');
		setRows(node ? toRows(node.properties) : []);
	}, [open, node, defaultCategory]);

	const handleSave = () => {
		const trimmed = name.trim();
		if (!trimmed) {
			toast.error('Node name is required');
			return;
		}
		if (project?.nodes[trimmed] && trimmed !== node?.name) {
			toast.error(`A node named "${trimmed}" already exists`);
			return;
		}

		const properties: Record<string, unknown> = {};
		for (const row of rows) {
			const key = row.key.trim();
			if (!key) continue;
			properties[key] = parseValue(row.value);
		}

		if (node) {
			updateNode(node.name, {
				name: trimmed,
				category,
				title: title.trim() || undefined,
				description: description.trim() || undefined,
				properties,
			});
			toast.success(`Node "${trimmed}" updated`);
		} else {
			createNode({
				name: trimmed,
				category,
				title: title.trim() || undefined,
				description: description.trim() || undefined,
				properties,
			});
			toast.success(`Node "${trimmed}" created`);
		}
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[520px]">
				<DialogHeader>
					<DialogTitle>{node ? `Edit Node: ${node.name}` : 'New Node'}</DialogTitle>
					<DialogDescription>
						{node
							? 'Changes apply to every block using this node.'
							: 'Define a custom node for this project.'}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="block text-sm font-medium mb-1">Name</label>
							<input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="MyCustomAction"
								className="text-sm"
								autoFocus
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Category</label>
							<select
								value={category}
								onChange={(e) => setCategory(e.target.value as NodeCategory)}
								className="text-sm"
							>
								{CATEGORIES.map((c) => (
									<option key={c} value={c}>
										{c.charAt(0).toUpperCase() + c.slice(1)}
									</option>
								))}
							</select>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1">Title</label>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Shown on blocks (defaults to name)"
							className="text-sm"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1">Description</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={2}
							className="text-sm"
						/>
					</div>

					<div>
						<div className="flex items-center justify-between mb-1">
							<label className="text-sm font-medium">Properties</label>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setRows((r) => [...r, { key: '', value: '' }])}
								className="h-7 gap-1 text-accent-soft"
							>
								<Plus size={14} /> Add
							</Button>
						</div>
						{rows.length === 0 ? (
							<div className="text-xs text-faint italic">
								No properties. Blocks created from this node inherit these as defaults.
							</div>
						) : (
							<div className="space-y-2">
								{rows.map((row, i) => (
									<div key={i} className="flex gap-2">
										<input
											type="text"
											value={row.key}
											placeholder="key"
											onChange={(e) =>
												setRows((r) => r.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))
											}
											className="text-sm"
										/>
										<input
											type="text"
											value={row.value}
											placeholder="value"
											onChange={(e) =>
												setRows((r) => r.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
											}
											className="text-sm"
										/>
										<button
											onClick={() => setRows((r) => r.filter((_, j) => j !== i))}
											className="px-2 text-faint hover:text-danger-soft"
											title="Remove property"
										>
											<Trash2 size={14} />
										</button>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleSave}>{node ? 'Save Changes' : 'Create Node'}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default NodeEditModal;
