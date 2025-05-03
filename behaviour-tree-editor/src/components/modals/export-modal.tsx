import React, { useState, useRef, useEffect } from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { useProjectStore } from '../../stores/useProjectStore';
import { serializeProject, serializeTree } from '../../lib/behavior/serializer';
import { toast } from 'sonner';
import { CheckIcon, DownloadIcon, ClipboardIcon, ChevronDownIcon } from 'lucide-react';

export type ExportType = 'project' | 'tree' | 'nodes';

interface ExportModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	exportType?: ExportType;
}

const ExportModal: React.FC<ExportModalProps> = ({
	open,
	onOpenChange,
	exportType = 'project',
}) => {
	const [type, setType] = useState<ExportType>(exportType);
	const [format, setFormat] = useState<'json' | 'compact'>('json');
	const [copied, setCopied] = useState(false);
	const textAreaRef = useRef<HTMLTextAreaElement>(null);

	const project = useProjectStore((state) => state.project);
	const selectedTreeId = useProjectStore((state) => state.project?.selectedTreeId);

	const [exportData, setExportData] = useState<string>('');

	// Generate export data based on type and format
	useEffect(() => {
		if (!project) {
			setExportData('No project loaded');
			return;
		}

		let data: unknown;

		try {
			if (type === 'project') {
				data = serializeProject(project);
			} else if (type === 'tree') {
				if (!selectedTreeId || !project.trees[selectedTreeId]) {
					setExportData('No tree selected');
					return;
				}
				data = serializeTree(project.trees[selectedTreeId]);
			} else if (type === 'nodes') {
				// Filter custom nodes (non-default)
				data = Object.entries(project.nodes)
					.filter(([, node]) => !node.isDefault)
					.map(([, node]) => ({
						version: '1.0.0',
						scope: 'node',
						name: node.name,
						category: node.category,
						title: node.title,
						description: node.description,
						properties: node.properties,
					}));
			}

			setExportData(format === 'json' ? JSON.stringify(data, null, 2) : JSON.stringify(data));
		} catch (error) {
			console.error('Error generating export data:', error);
			setExportData(`Error generating export data: ${error}`);
		}
	}, [project, selectedTreeId, type, format]);

	// Handle copy to clipboard
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(exportData);
			setCopied(true);
			toast.success('Copied to clipboard');

			// Reset copied status after a delay
			setTimeout(() => {
				setCopied(false);
			}, 2000);
		} catch (error) {
			console.error('Error copying to clipboard:', error);
			toast.error('Failed to copy to clipboard');

			// Fallback to the old method if the Clipboard API fails
			if (textAreaRef.current) {
				textAreaRef.current.select();
				document.execCommand('copy');
				setCopied(true);
				toast.success('Copied to clipboard (fallback method)');

				setTimeout(() => {
					setCopied(false);
				}, 2000);
			}
		}
	};

	// Handle download
	const handleDownload = () => {
		try {
			const blob = new Blob([exportData], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');

			let fileName = '';

			if (type === 'project' && project) {
				fileName = `${project.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.json`;
			} else if (type === 'tree' && selectedTreeId && project?.trees[selectedTreeId]) {
				fileName = `tree_${project.trees[selectedTreeId].title
					.replace(/\s+/g, '_')
					.toLowerCase()}_${Date.now()}.json`;
			} else if (type === 'nodes') {
				fileName = `custom_nodes_${Date.now()}.json`;
			} else {
				fileName = `${type}_export_${Date.now()}.json`;
			}

			a.href = url;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			toast.success('Export file downloaded');
		} catch (error) {
			console.error('Error downloading export:', error);
			toast.error('Error downloading export');
		}
	};

	// Change export type
	const changeType = (newType: ExportType) => {
		setType(newType);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[700px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-white">
						Export
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" className="ml-2">
									{type.charAt(0).toUpperCase() + type.slice(1)}
									<ChevronDownIcon className="ml-2 h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuItem onClick={() => changeType('project')}>Project</DropdownMenuItem>
								<DropdownMenuItem onClick={() => changeType('tree')}>Tree</DropdownMenuItem>
								<DropdownMenuItem onClick={() => changeType('nodes')}>Nodes</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</DialogTitle>
					<DialogDescription>
						Export your {type} as JSON or download it as a file.
					</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue="json" onValueChange={(value) => setFormat(value as 'json' | 'compact')}>
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="json">Pretty</TabsTrigger>
						<TabsTrigger value="compact">Compact</TabsTrigger>
					</TabsList>

					<div className="mt-4 relative">
						<textarea
							ref={textAreaRef}
							readOnly
							className="w-full h-[300px] p-4 font-mono text-sm rounded-md border resize-none bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
							value={exportData}
						/>
					</div>
				</Tabs>

				<DialogFooter className="sm:justify-between">
					<div className="flex gap-2">
						<Button variant="secondary" onClick={handleCopy} className="gap-2">
							{copied ? <CheckIcon className="h-4 w-4" /> : <ClipboardIcon className="h-4 w-4" />}
							{copied ? 'Copied' : 'Copy'}
						</Button>
					</div>
					<div className="flex gap-2">
						<Button onClick={handleDownload} className="gap-2">
							<DownloadIcon className="h-4 w-4" />
							Download
						</Button>
						<Button variant="outline" className="text-white" onClick={() => onOpenChange(false)}>
							Close
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ExportModal;
