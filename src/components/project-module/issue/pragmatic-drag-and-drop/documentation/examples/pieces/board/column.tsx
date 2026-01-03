import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import invariant from 'tiny-invariant';
import { Dropdown, message } from 'antd';
import { MoreOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';

import Heading from '@atlaskit/heading';
import { easeInOut } from '@atlaskit/motion/curves';
import { durations } from '@atlaskit/motion/durations';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import {
	attachClosestEdge,
	type Edge,
	extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { DropIndicator } from '@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
	draggable,
	dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { centerUnderPointer } from '@atlaskit/pragmatic-drag-and-drop/element/center-under-pointer';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { Box, Flex, Inline, Stack, xcss } from '@atlaskit/primitives';
import { token } from '@atlaskit/tokens';

import { useBoardContext } from './board-context';
import { Card } from './card';
import { ColumnContext, type ColumnContextProps, useColumnContext } from './column-context';
import { workflowStatusService } from '@/lib/api/services/project-module/workflow-status.service';
import { EditWorkflowStatusModal } from './EditWorkflowStatusModal';

const columnStyles = xcss({
	width: '300px',
	backgroundColor: 'elevation.surface.sunken',
	borderRadius: 'radius.xlarge',
	transition: `background ${durations.medium}ms ${easeInOut}`,
	position: 'relative',
});

const stackStyles = xcss({
	minHeight: '0',
	flexGrow: 1,
});

const scrollContainerStyles = xcss({
	height: '100%',
	overflowY: 'auto',
});

const cardListStyles = xcss({
	boxSizing: 'border-box',
	minHeight: '100%',
	padding: 'space.100',
	gap: 'space.100',
});

const columnHeaderStyles = xcss({
	paddingInlineStart: 'space.200',
	paddingInlineEnd: 'space.200',
	paddingBlockStart: 'space.100',
	color: 'color.text.subtlest',
	userSelect: 'none',
});

export type ColumnType = {
	title: string;
	columnId: string;
	items: Issue[];
};

export type Issue = {
	id: number;
	issueId: string;
	name: string;
	summary: string;
	epic_name: string;
	issue_type: string;
	priority: string;
	points: number;
	role: string;
	avatarUrl: string;
};

export type ColumnMap = { [columnId: string]: ColumnType };

type State =
	| { type: 'idle' }
	| { type: 'is-card-over' }
	| { type: 'is-column-over'; closestEdge: Edge | null }
	| { type: 'generate-safari-column-preview'; container: HTMLElement }
	| { type: 'generate-column-preview' };

const idle: State = { type: 'idle' };
const isCardOver: State = { type: 'is-card-over' };

const stateStyles: {
	[key in State['type']]: ReturnType<typeof xcss> | undefined;
} = {
	idle: xcss({
		cursor: 'grab',
	}),
	'is-card-over': xcss({
		backgroundColor: 'color.background.selected.hovered',
	}),
	'is-column-over': undefined,
	'generate-column-preview': xcss({
		isolation: 'isolate',
	}),
	'generate-safari-column-preview': undefined,
};

const isDraggingStyles = xcss({
	opacity: 0.4,
});

export const Column = memo(function Column({ 
	column,
	projectId,
	onRefresh,
}: { 
	column: ColumnType;
	projectId?: number;
	onRefresh?: () => void;
}) {
	const columnId = column.columnId;
	const columnRef = useRef<HTMLDivElement | null>(null);
	const columnInnerRef = useRef<HTMLDivElement | null>(null);
	const headerRef = useRef<HTMLDivElement | null>(null);
	const scrollableRef = useRef<HTMLDivElement | null>(null);
	const [state, setState] = useState<State>(idle);
	const [isDragging, setIsDragging] = useState<boolean>(false);

	const { instanceId, registerColumn } = useBoardContext();

	useEffect(() => {
		invariant(columnRef.current);
		invariant(columnInnerRef.current);
		invariant(headerRef.current);
		invariant(scrollableRef.current);
		return combine(
			registerColumn({
				columnId,
				entry: {
					element: columnRef.current,
				},
			}),
			draggable({
				element: columnRef.current,
				dragHandle: headerRef.current,
				getInitialData: () => ({ columnId, type: 'column', instanceId }),
				onGenerateDragPreview: ({ nativeSetDragImage }) => {
					const isSafari: boolean =
						navigator.userAgent.includes('AppleWebKit') && !navigator.userAgent.includes('Chrome');

					if (!isSafari) {
						setState({ type: 'generate-column-preview' });
						return;
					}
					setCustomNativeDragPreview({
						getOffset: centerUnderPointer,
						render: ({ container }) => {
							setState({
								type: 'generate-safari-column-preview',
								container,
							});
							return () => setState(idle);
						},
						nativeSetDragImage,
					});
				},
				onDragStart: () => {
					setIsDragging(true);
				},
				onDrop() {
					setState(idle);
					setIsDragging(false);
				},
			}),
			dropTargetForElements({
				element: columnInnerRef.current,
				getData: () => ({ columnId }),
				canDrop: ({ source }) => {
					return source.data.instanceId === instanceId && source.data.type === 'card';
				},
				getIsSticky: () => true,
				onDragEnter: () => setState(isCardOver),
				onDragLeave: () => setState(idle),
				onDragStart: () => setState(isCardOver),
				onDrop: () => setState(idle),
			}),
			dropTargetForElements({
				element: columnRef.current,
				canDrop: ({ source }) => {
					return source.data.instanceId === instanceId && source.data.type === 'column';
				},
				getIsSticky: () => true,
				getData: ({ input, element }) => {
					const data = {
						columnId,
					};
					return attachClosestEdge(data, {
						input,
						element,
						allowedEdges: ['left', 'right'],
					});
				},
				onDragEnter: (args) => {
					setState({
						type: 'is-column-over',
						closestEdge: extractClosestEdge(args.self.data),
					});
				},
				onDrag: (args) => {
					setState((current) => {
						const closestEdge: Edge | null = extractClosestEdge(args.self.data);
						if (current.type === 'is-column-over' && current.closestEdge === closestEdge) {
							return current;
						}
						return {
							type: 'is-column-over',
							closestEdge,
						};
					});
				},
				onDragLeave: () => {
					setState(idle);
				},
				onDrop: () => {
					setState(idle);
				},
			}),
			autoScrollForElements({
				element: scrollableRef.current,
				canScroll: ({ source }) =>
					source.data.instanceId === instanceId && source.data.type === 'card',
			}),
		);
	}, [columnId, registerColumn, instanceId]);

	const stableItems = useRef(column.items);
	useEffect(() => {
		stableItems.current = column.items;
	}, [column.items]);

	const getCardIndex = useCallback((issueId: string) => {
		return stableItems.current.findIndex((item) => item.issueId === issueId);
	}, []);

	const getNumCards = useCallback(() => {
		return stableItems.current.length;
	}, []);

	const contextValue: ColumnContextProps = useMemo(() => {
		return { columnId, getCardIndex, getNumCards };
	}, [columnId, getCardIndex, getNumCards]);

	return (
		<ColumnContext.Provider value={contextValue}>
			<Flex
				testId={`column-${columnId}`}
				ref={columnRef}
				direction="column"
				xcss={[columnStyles, stateStyles[state.type]]}
			>
				<Stack xcss={stackStyles} ref={columnInnerRef}>
					<Stack xcss={[stackStyles, isDragging ? isDraggingStyles : undefined]}>
						<Inline
							xcss={columnHeaderStyles}
							ref={headerRef}
							testId={`column-header-${columnId}`}
							spread="space-between"
							alignBlock="center"
						>
							<Heading size="xxsmall" as="span" testId={`column-header-title-${columnId}`}>
								{column.title}
							</Heading>
							<ActionMenu 
								projectId={projectId} 
								columnTitle={column.title}
								onRefresh={onRefresh}
							/>
						</Inline>
						<Box xcss={scrollContainerStyles} ref={scrollableRef}>
							<Stack xcss={cardListStyles} space="space.100">
								{column.items.map((item) => (
									<Card item={item} key={item.issueId} />
								))}
							</Stack>
						</Box>
					</Stack>
				</Stack>
				{state.type === 'is-column-over' && state.closestEdge && (
					<DropIndicator edge={state.closestEdge} gap={token('space.200', '0')} />
				)}
			</Flex>
			{state.type === 'generate-safari-column-preview'
				? createPortal(<SafariColumnPreview column={column} />, state.container)
				: null}
		</ColumnContext.Provider>
	);
});

const safariPreviewStyles = xcss({
	width: '250px',
	backgroundColor: 'elevation.surface.sunken',
	borderRadius: 'radius.small',
	padding: 'space.200',
});

function SafariColumnPreview({ column }: { column: ColumnType }) {
	return (
		<Box xcss={[columnHeaderStyles, safariPreviewStyles]}>
			<Heading size="xxsmall" as="span">
				{column.title}
			</Heading>
		</Box>
	);
}

function ActionMenu({ 
	projectId,
	columnTitle,
	onRefresh,
}: { 
	projectId?: number;
	columnTitle?: string;
	onRefresh?: () => void;
}) {
	const { t } = useTranslation();
	const { columnId } = useColumnContext();
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [statusData, setStatusData] = useState<any>(null);

	const handleEdit = useCallback(async () => {
		if (!projectId) {
			message.error(t('workflowStatus.messages.projectIdRequired'));
			return;
		}

		try {
			// Fetch current status data
			const data = await workflowStatusService.getById(parseInt(columnId), projectId);
			setStatusData(data);
			setIsEditModalOpen(true);
		} catch (error: any) {
			message.error(
				error.response?.data?.message || 
				t('workflowStatus.messages.loadFailed')
			);
		}
	}, [columnId, projectId, t]);

	const deleteColumn = useCallback(async () => {
		if (!projectId) {
			message.error(t('workflowStatus.messages.projectIdRequired'));
			return;
		}
		
		try {
			await workflowStatusService.delete(parseInt(columnId), projectId);
			message.success(t('workflowStatus.messages.deleteSuccess'));
			// Refresh page to reload board
			if (onRefresh) {
				onRefresh();
			} else {
				window.location.reload();
			}
		} catch (error: any) {
			message.error(
				error.response?.data?.message || 
				t('workflowStatus.messages.deleteFailed')
			);
		}
	}, [columnId, projectId, onRefresh, t]);

	const handleEditSuccess = () => {
		if (onRefresh) {
			onRefresh();
		} else {
			window.location.reload();
		}
	};

	const menuItems: MenuProps['items'] = [
		{
			key: 'edit',
			label: t('column.edit', 'Edit column'),
			icon: <EditOutlined />,
			onClick: handleEdit,
		},
		{
			type: 'divider',
		},
		{
			key: 'delete',
			label: t('column.delete', 'Delete column'),
			icon: <DeleteOutlined />,
			danger: true,
			onClick: deleteColumn,
		},
	];

	return (
		<>
			<Dropdown 
				menu={{ items: menuItems }} 
				trigger={['click']}
				placement="bottomRight"
			>
				<div
					style={{
						cursor: 'pointer',
						padding: '4px',
						borderRadius: '4px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
					onClick={(e) => e.stopPropagation()}
				>
					<MoreOutlined 
						style={{ 
							fontSize: '16px',
							color: '#626f86',
						}} 
					/>
				</div>
			</Dropdown>

			{statusData && (
				<EditWorkflowStatusModal
					visible={isEditModalOpen}
					onClose={() => setIsEditModalOpen(false)}
					onSuccess={handleEditSuccess}
					statusId={parseInt(columnId)}
					projectId={projectId!}
					initialValues={{
						status_name: statusData.status_name,
						status_category: statusData.status_category,
						is_initial_status: statusData.is_initial_status,
					}}
				/>
			)}
		</>
	);
}