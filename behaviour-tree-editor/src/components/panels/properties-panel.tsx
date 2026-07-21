import React, { useEffect, useRef, useState } from 'react';
import { MousePointerClick, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useProjectStore } from '../../stores/useProjectStore';
import { formatPropertyValue, inferPropertyValue } from '../../lib/properties';
import { Block } from '../../types';

interface PropertiesPanelProps {
	selectedBlock?: Block;
	onUpdateBlock?: (updates: Partial<Block>) => void;
}

interface PropertyRowProps {
	name: string;
	value: unknown;
	onChange: (value: unknown) => void;
	onRemove: () => void;
}

/**
 * One property. Text and number values are held locally and committed on blur or
 * Enter — committing per keystroke pushed a full deep clone of the project onto
 * the undo stack for every character typed.
 */
const PropertyRow: React.FC<PropertyRowProps> = ({ name, value, onChange, onRemove }) => {
	const [draft, setDraft] = useState(() => formatPropertyValue(value));

	// Re-seed when the value changes underneath us (undo, switching nodes)
	useEffect(() => {
		setDraft(formatPropertyValue(value));
	}, [value]);

	const commit = () => {
		const next = inferPropertyValue(draft);
		if (next !== value) onChange(next);
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter') {
			event.currentTarget.blur();
		} else if (event.key === 'Escape') {
			setDraft(formatPropertyValue(value));
			event.currentTarget.blur();
		}
	};

	return (
		<div className="flex flex-col">
			<div className="mb-1 flex items-center justify-between gap-2">
				<label className="truncate text-xs font-medium text-muted">{name}</label>
				<button
					onClick={onRemove}
					className="shrink-0 text-faint hover:text-danger-soft"
					title={`Remove ${name}`}
				>
					<Trash2 size={12} />
				</button>
			</div>

			{typeof value === 'boolean' ? (
				<label className="inline-flex items-center">
					<input
						type="checkbox"
						checked={value}
						onChange={(e) => onChange(e.target.checked)}
						className="h-4 w-4"
					/>
					<span className="ml-2 text-sm text-fg">{value ? 'True' : 'False'}</span>
				</label>
			) : typeof value === 'object' && value !== null ? (
				<div className="rounded-md bg-inset px-3 py-2 text-sm text-muted">Complex value</div>
			) : (
				<input
					type="text"
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onBlur={commit}
					onKeyDown={handleKeyDown}
					className="text-sm"
				/>
			)}
		</div>
	);
};

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedBlock, onUpdateBlock }) => {
	const project = useProjectStore((state) => state.project);
	const [editingTitle, setEditingTitle] = useState(false);
	const [editingDescription, setEditingDescription] = useState(false);
	const [newKey, setNewKey] = useState('');
	const [newValue, setNewValue] = useState('');
	const descriptionRef = useRef<HTMLTextAreaElement>(null);
	const newKeyRef = useRef<HTMLInputElement>(null);

	if (!project) {
		return <div className="p-4 text-center text-faint">No project loaded</div>;
	}

	if (!selectedBlock) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
				<MousePointerClick size={22} className="text-faint" />
				<p className="text-sm text-muted">Select a node on the canvas to edit its properties.</p>
			</div>
		);
	}

	const handleTitleChange = (title: string) => {
		onUpdateBlock?.({ title });
		setEditingTitle(false);
	};

	const handleDescriptionChange = (description: string) => {
		onUpdateBlock?.({ description });
		setEditingDescription(false);
	};

	const handlePropertyChange = (key: string, value: unknown) => {
		onUpdateBlock?.({
			properties: { ...selectedBlock.properties, [key]: value },
		});
	};

	const handleAddProperty = () => {
		const key = newKey.trim();
		if (!key || !onUpdateBlock) return;
		if (key in selectedBlock.properties) {
			toast.error(`Property "${key}" already exists`);
			return;
		}
		onUpdateBlock({
			properties: { ...selectedBlock.properties, [key]: inferPropertyValue(newValue) },
		});
		setNewKey('');
		setNewValue('');
		newKeyRef.current?.focus();
	};

	const handleRemoveProperty = (key: string) => {
		if (!onUpdateBlock) return;
		const properties = { ...selectedBlock.properties };
		delete properties[key];
		onUpdateBlock({ properties });
	};

	const addOnEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter') handleAddProperty();
	};

	const propertyEntries = Object.entries(selectedBlock.properties);

	return (
		<div className="flex h-full flex-col">
			<div className="border-b border-divider p-4">
				<div className="kicker mb-1">Block Type</div>
				<div className="font-medium">{selectedBlock.name}</div>
				<div className="mt-1 text-xs text-muted">Category: {selectedBlock.category}</div>
			</div>

			<div className="flex-1 space-y-6 overflow-auto p-4">
				{/* Title */}
				<div>
					<div className="mb-2 flex items-center justify-between">
						<label className="text-sm font-medium text-fg">Title</label>
						<button
							onClick={() => setEditingTitle(true)}
							className="text-xs text-accent-soft hover:text-accent-hover"
						>
							Edit
						</button>
					</div>

					{editingTitle ? (
						<div className="mt-1 flex gap-2">
							<input
								type="text"
								defaultValue={selectedBlock.title || ''}
								className="flex-1"
								onBlur={(e) => handleTitleChange(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										handleTitleChange(e.currentTarget.value);
									} else if (e.key === 'Escape') {
										setEditingTitle(false);
									}
								}}
								autoFocus
							/>
							<button
								onClick={() => setEditingTitle(false)}
								className="rounded-md border border-border bg-transparent px-3 py-2 text-fg hover:bg-fg/7"
							>
								Cancel
							</button>
						</div>
					) : (
						<div className="rounded-md bg-inset px-3 py-2">
							{selectedBlock.title || selectedBlock.name}
						</div>
					)}
				</div>

				{/* Description */}
				<div>
					<div className="mb-2 flex items-center justify-between">
						<label className="text-sm font-medium text-fg">Description</label>
						<button
							onClick={() => setEditingDescription(true)}
							className="text-xs text-accent-soft hover:text-accent-hover"
						>
							Edit
						</button>
					</div>

					{editingDescription ? (
						<div className="mt-1 flex flex-col gap-2">
							<textarea
								ref={descriptionRef}
								defaultValue={selectedBlock.description || ''}
								rows={3}
								onKeyDown={(e) => {
									if (e.key === 'Escape') setEditingDescription(false);
								}}
								autoFocus
							/>
							<div className="flex gap-2">
								<button
									onClick={() => handleDescriptionChange(descriptionRef.current?.value ?? '')}
									className="flex-1 rounded-md border border-accent bg-transparent px-3 py-2 text-accent-soft hover:bg-accent/15"
								>
									Save
								</button>
								<button
									onClick={() => setEditingDescription(false)}
									className="flex-1 rounded-md border border-border bg-transparent px-3 py-2 text-fg hover:bg-fg/7"
								>
									Cancel
								</button>
							</div>
						</div>
					) : (
						<div className="min-h-[60px] rounded-md bg-inset px-3 py-2">
							{selectedBlock.description || (
								<span className="text-faint italic">No description</span>
							)}
						</div>
					)}
				</div>

				{/* Properties */}
				<div>
					<h3 className="mb-2 text-sm font-medium text-fg">Properties</h3>

					<div className="space-y-3">
						{propertyEntries.length === 0 ? (
							<p className="text-xs text-faint italic">No properties yet.</p>
						) : (
							propertyEntries.map(([key, value]) => (
								<PropertyRow
									key={key}
									name={key}
									value={value}
									onChange={(next) => handlePropertyChange(key, next)}
									onRemove={() => handleRemoveProperty(key)}
								/>
							))
						)}

						{/* Add property — key and value together, like the classic key-table.
						    Values are coerced: 4.5 becomes a number, true a boolean. */}
						<div className="flex gap-2 rounded-md border border-border p-2">
							<input
								ref={newKeyRef}
								type="text"
								value={newKey}
								onChange={(e) => setNewKey(e.target.value)}
								onKeyDown={addOnEnter}
								placeholder="key"
								className="min-w-0 flex-1 text-sm"
							/>
							<input
								type="text"
								value={newValue}
								onChange={(e) => setNewValue(e.target.value)}
								onKeyDown={addOnEnter}
								placeholder="value"
								className="min-w-0 flex-1 text-sm"
							/>
							<button
								onClick={handleAddProperty}
								disabled={!newKey.trim()}
								className="shrink-0 rounded-md border border-border bg-transparent px-2 text-fg hover:bg-fg/7"
								title="Add property"
							>
								<Plus size={14} />
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PropertiesPanel;
