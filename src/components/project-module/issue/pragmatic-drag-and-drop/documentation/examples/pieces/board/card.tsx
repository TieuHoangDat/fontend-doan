import React, {
	forwardRef,
	Fragment,
	memo,
	type Ref,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

import ReactDOM from 'react-dom';
import invariant from 'tiny-invariant';

import Avatar from '@atlaskit/avatar';
import Button, { IconButton } from '@atlaskit/button/new';
import { Dropdown, Menu } from 'antd';
import type { MenuProps } from 'antd';
// eslint-disable-next-line @atlaskit/design-system/no-banned-imports
import mergeRefs from '@atlaskit/ds-lib/merge-refs';
import Heading from '@atlaskit/heading';
// This is the smaller MoreIcon soon to be more easily accessible with the
// ongoing icon project
import MoreIcon from '@atlaskit/icon/core/migration/show-more-horizontal--editor-more';
import EditIcon from '@atlaskit/icon/glyph/edit';
import { fg } from '@atlaskit/platform-feature-flags';
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
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { dropTargetForExternal } from '@atlaskit/pragmatic-drag-and-drop/external/adapter';
// eslint-disable-next-line @atlaskit/design-system/no-emotion-primitives -- to be migrated to @atlaskit/primitives/compiled – go/akcss
import { Box, Grid, Stack, xcss, Inline, Text } from '@atlaskit/primitives';
import { token } from '@atlaskit/tokens';

import { useBoardContext } from './board-context';
import { useColumnContext } from './column-context';
import { IssueEditModal } from '../../../../../EditForm/IssueEditModal';
import { EpicTag } from '../../../../../../epic/EpicTag';
import { IssueTypeIcon } from './IssueTypeIcon';
import { PriorityIcon } from './PriorityIcon';
import { Issue } from './column';

type State =
	| { type: 'idle' }
	| { type: 'preview'; container: HTMLElement; rect: DOMRect }
	| { type: 'dragging' };

const idleState: State = { type: 'idle' };
const draggingState: State = { type: 'dragging' };

const noMarginStyles = xcss({ margin: 'space.0' });
const noPointerEventsStyles = xcss({ pointerEvents: 'none' });
const baseStyles = xcss({
	width: '100%',
	padding: 'space.100',
	backgroundColor: 'elevation.surface',
	borderRadius: 'radius.large',
	position: 'relative',
	':hover': {
		backgroundColor: 'elevation.surface.hovered',
	},
});

const stateStyles: {
	[Key in State['type']]: ReturnType<typeof xcss> | undefined;
} = {
	idle: xcss({
		cursor: 'grab',
		boxShadow: 'elevation.shadow.raised',
	}),
	dragging: xcss({
		opacity: 0.4,
		boxShadow: 'elevation.shadow.raised',
	}),
	// no shadow for preview - the platform will add it's own drop shadow
	preview: undefined,
};

const buttonColumnStyles = xcss({
	alignSelf: 'start',
});

type CardPrimitiveProps = {
	closestEdge: Edge | null;
	item: Issue;
	state: State;
	actionMenuTriggerRef?: Ref<HTMLButtonElement>;
	// Thêm prop cho handler hiển thị modal
	onViewDetails: () => void;
};

function LazyDropdownItems({ issueId }: { issueId: string }) {
	const { getColumns, reorderCard, moveCard } = useBoardContext();
	const { columnId, getCardIndex, getNumCards } = useColumnContext();

	const numCards = getNumCards();
	const startIndex = getCardIndex(issueId);

	const moveToTop = useCallback(() => {
		reorderCard({ columnId, startIndex, finishIndex: 0 });
	}, [columnId, reorderCard, startIndex]);

	const moveUp = useCallback(() => {
		reorderCard({ columnId, startIndex, finishIndex: startIndex - 1 });
	}, [columnId, reorderCard, startIndex]);

	const moveDown = useCallback(() => {
		reorderCard({ columnId, startIndex, finishIndex: startIndex + 1 });
	}, [columnId, reorderCard, startIndex]);

	const moveToBottom = useCallback(() => {
		reorderCard({ columnId, startIndex, finishIndex: numCards - 1 });
	}, [columnId, reorderCard, startIndex, numCards]);

	const isMoveUpDisabled = startIndex === 0;
	const isMoveDownDisabled = startIndex === numCards - 1;

	const moveColumnOptions = getColumns().filter((column) => column.columnId !== columnId);

	// Tạo menu items cho Antd
	const menuItems: MenuProps['items'] = [
		{
			key: 'reorder',
			label: 'Reorder',
			type: 'group',
			children: [
				{
					key: 'move-to-top',
					label: 'Move to top',
					disabled: isMoveUpDisabled,
					onClick: moveToTop,
				},
				{
					key: 'move-up',
					label: 'Move up',
					disabled: isMoveUpDisabled,
					onClick: moveUp,
				},
				{
					key: 'move-down',
					label: 'Move down',
					disabled: isMoveDownDisabled,
					onClick: moveDown,
				},
				{
					key: 'move-to-bottom',
					label: 'Move to bottom',
					disabled: isMoveDownDisabled,
					onClick: moveToBottom,
				},
			],
		},
		...(moveColumnOptions.length
			? [
					{
						key: 'move-to',
						label: 'Move to',
						type: 'group' as const,
						children: moveColumnOptions.map((column) => ({
							key: column.columnId,
							label: column.title,
							onClick: () => {
								moveCard({
									startColumnId: columnId,
									finishColumnId: column.columnId,
									itemIndexInStartColumn: startIndex,
								});
							},
						})),
					},
			  ]
			: []),
	];

	return <Menu items={menuItems} />;
}

const CardPrimitive = forwardRef<HTMLDivElement, CardPrimitiveProps>(function CardPrimitive(
	{ closestEdge, item, state, actionMenuTriggerRef, onViewDetails },
	ref,
) {
	const { name, issueId, epic_name, issue_type, points, priority, avatarUrl, summary } = item;

	return (
		<Grid
			ref={ref}
			testId={`item-${issueId}`}
			templateColumns="1fr auto"
			templateRows="auto auto"
			rowGap="space.100"
			columnGap="space.100"
			alignItems="center"
			xcss={[baseStyles, stateStyles[state.type]]}
		>
			{/* Hàng 1: Tên Story và Nút hành động */}
			<Box xcss={xcss({ gridColumn: '1 / 2' })}>
				<Heading size="xsmall" as="span">
					{summary}
				</Heading>
			</Box>
			<Inline space="space.050" xcss={buttonColumnStyles}>
				{/* NÚT XEM CHI TIẾT */}
				<Box xcss={[buttonColumnStyles, xcss({ pointerEvents: 'auto' })]}>
					<IconButton
						icon={(iconProps) => <EditIcon {...iconProps} size="small" />}
						label={`View details for ${issueId}`}
						appearance="subtle"
						spacing="compact"
						onClick={(event) => {
							onViewDetails();
						}}
					/>
				</Box>

				{/* NÚT 3 CHẤM (Dropdown) - Sử dụng Antd */}
				<Dropdown
					dropdownRender={() => <LazyDropdownItems issueId={issueId} />}
					trigger={['click']}
					placement="bottomRight"
				>
					<IconButton
						ref={actionMenuTriggerRef}
						icon={(iconProps) => <MoreIcon {...iconProps} size="small" />}
						label={`Move ${issueId}`}
						appearance="default"
						spacing="compact"
					/>
				</Dropdown>
			</Inline>
			{closestEdge && <DropIndicator edge={closestEdge} gap={token('space.100', '0')} />}

			{/* Hàng 2: Các tag, Issue ID, Points, Assignee */}
			<Stack space="space.100" grow="fill" xcss={xcss({ gridColumn: '1 / 3' })}>
				{/* EPIC Tag */}
				<Box>
					{epic_name && (
						<EpicTag epic_name={epic_name} />
					)}
				</Box>

				{/* SCRUM-8, Points, Assignee */}
				<Inline space="space.100" alignBlock="center" xcss={xcss({ width: '100%', justifyContent: 'space-between', })}>
					{/* VÙNG BÊN TRÁI: Issue Type & ID */}
					<Inline space="space.050" alignBlock="center">
						<IssueTypeIcon 
							type={issue_type} 
							sizeClass="w-4 h-4"
							className="text-gray-600"
						/>
						<Text as="span">{issueId}</Text>
					</Inline>

					{/* VÙNG BÊN PHẢI: Points và Assignee */}
					<Inline space="space.100" alignBlock="center">
						{/* Points */}
						{points && (
							<Inline space="space.050" alignBlock="center">
								<Box xcss={xcss({
									background: '#dddee1',
									borderRadius: '5px',
									paddingInline: 'space.100',
									color: 'color.text.subtle',
								})}>
									<Text as="span" >{points}</Text>
								</Box>
							</Inline>
						)}

						<PriorityIcon 
							name={priority} 
							sizeClass="w-4 h-4"
						/>

						{/* Assignee (Avatar) */}
						{avatarUrl && (
							<Box xcss={xcss({ display: 'flex', alignItems: 'center' })}>
								<Avatar size="small" src={avatarUrl} label={`Assignee: ${item.name}`} />
							</Box>
						)}
					</Inline>
				</Inline>
			</Stack>

			{closestEdge && <DropIndicator edge={closestEdge} gap={token('space.100', '0')} />}
		</Grid>
	);
});

export const Card = memo(function Card({ item }: { item: Issue }) {
	const ref = useRef<HTMLDivElement | null>(null);
	const { issueId } = item;
	const [closestEdge, setClosestEdge] = useState<Edge | null>(null);
	const [state, setState] = useState<State>(idleState);

	// Thêm state cho Modal
	const [isModalOpen, setIsModalOpen] = useState(false);
	const openModal = useCallback(() => setIsModalOpen(true), []);
	const closeModal = useCallback(() => setIsModalOpen(false), []);

	const actionMenuTriggerRef = useRef<HTMLButtonElement>(null);
	const { instanceId, registerCard } = useBoardContext();
	useEffect(() => {
		invariant(actionMenuTriggerRef.current);
		invariant(ref.current);
		return registerCard({
			cardId: issueId,
			entry: {
				element: ref.current,
				actionMenuTrigger: actionMenuTriggerRef.current,
			},
		});
	}, [registerCard, issueId]);

	useEffect(() => {
		const element = ref.current;
		invariant(element);
		return combine(
			draggable({
				element: element,
				getInitialData: () => ({ type: 'card', itemId: issueId, instanceId }),
				onGenerateDragPreview: ({ location, source, nativeSetDragImage }) => {
					const rect = source.element.getBoundingClientRect();

					setCustomNativeDragPreview({
						nativeSetDragImage,
						getOffset: preserveOffsetOnSource({
							element,
							input: location.current.input,
						}),
						render({ container }) {
							setState({ type: 'preview', container, rect });
							return () => setState(draggingState);
						},
					});
				},

				onDragStart: () => setState(draggingState),
				onDrop: () => setState(idleState),
			}),
			dropTargetForExternal({
				element: element,
			}),
			dropTargetForElements({
				element: element,
				canDrop: ({ source }) => {
					return source.data.instanceId === instanceId && source.data.type === 'card';
				},
				getIsSticky: () => true,
				getData: ({ input, element }) => {
					const data = { type: 'card', itemId: issueId };

					return attachClosestEdge(data, {
						input,
						element,
						allowedEdges: ['top', 'bottom'],
					});
				},
				onDragEnter: (args) => {
					if (args.source.data.itemId !== issueId) {
						setClosestEdge(extractClosestEdge(args.self.data));
					}
				},
				onDrag: (args) => {
					if (args.source.data.itemId !== issueId) {
						setClosestEdge(extractClosestEdge(args.self.data));
					}
				},
				onDragLeave: () => {
					setClosestEdge(null);
				},
				onDrop: () => {
					setClosestEdge(null);
				},
			}),
		);
	}, [instanceId, item, issueId]);

	return (
		<Fragment>
			<CardPrimitive
				ref={ref}
				item={item}
				state={state}
				closestEdge={closestEdge}
				actionMenuTriggerRef={actionMenuTriggerRef}
				onViewDetails={openModal}
			/>
			{state.type === 'preview' &&
				ReactDOM.createPortal(
					<Box
						style={{
							/**
							 * Ensuring the preview has the same dimensions as the original.
							 *
							 * Using `border-box` sizing here is not necessary in this
							 * specific example, but it is safer to include generally.
							 */
							// eslint-disable-next-line @atlaskit/ui-styling-standard/enforce-style-prop -- Ignored via go/DSP-18766
							boxSizing: 'border-box',
							width: state.rect.width,
							height: state.rect.height,
						}}
					>
						<CardPrimitive item={item} state={state} closestEdge={null} onViewDetails={() => {}} />
					</Box>,
					state.container,
				)}

			{/* Hiển thị Modal chi tiết */}
			<IssueEditModal 
				issueId={item.id} 
				visible={isModalOpen}
				onClose={closeModal} 
				onSuccess={() => {
					console.log('Issue updated successfully');
				}}
			/>
		</Fragment>
	);
});