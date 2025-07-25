/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { assert, fail } from "@fluidframework/core-utils/internal";
import { UsageError } from "@fluidframework/telemetry-utils/internal";

import {
	type AnchorNode,
	CursorLocationType,
	type ExclusiveMapTree,
	type FieldAnchor,
	type FieldKey,
	type FieldKindIdentifier,
	type ITreeCursorSynchronous,
	type ITreeSubscriptionCursor,
	type NormalizedFieldUpPath,
	type TreeNavigationResult,
	inCursorNode,
	iterateCursorField,
	mapCursorField,
	rootFieldKey,
} from "../../core/index.js";
import { disposeSymbol, getOrCreate } from "../../util/index.js";
import {
	FieldKinds,
	MappedEditBuilder,
	type IDefaultEditBuilder,
	type OptionalFieldEditBuilder,
	type SequenceFieldEditBuilder,
	type ValueFieldEditBuilder,
} from "../default-schema/index.js";
import { cursorForMapTreeField } from "../mapTreeCursor.js";
import type { FlexFieldKind } from "../modular-schema/index.js";

import type { Context } from "./context.js";
import {
	FlexTreeEntityKind,
	type FlexTreeField,
	type FlexTreeOptionalField,
	type FlexTreeRequiredField,
	type FlexTreeSequenceField,
	type FlexTreeTypedField,
	type FlexTreeUnknownUnboxed,
	type FlexibleFieldContent,
	type FlexibleNodeContent,
	type HydratedFlexTreeNode,
	TreeStatus,
	flexTreeMarker,
	flexTreeSlot,
} from "./flexTreeTypes.js";
import { LazyEntity } from "./lazyEntity.js";
import { type LazyTreeNode, getOrCreateHydratedFlexTreeNode } from "./lazyNode.js";
import { indexForAt, treeStatusFromAnchorCache } from "./utilities.js";

/**
 * Reuse fields.
 * Since field currently own cursors and register themselves for disposal when the node hit end of life,
 * not reusing them results in memory leaks every time the field is accessed.
 * Since the fields stay alive until the node is end of life reusing them this way is safe.
 *
 * This ins't a perfect solution:
 *
 * - This can cause leaks, like map nodes will keep all accessed field objects around. Since other things cause this same leak already, its not too bad.
 * - This does not cache the root.
 * - Finding the parent anchor to do the caching on has significant cost.
 *
 * Despite these limitations, this cache provides a large performance win in some common cases (over 10x), especially with how simple tree requests far more field objects than necessary currently.
 */
const fieldCache: WeakMap<LazyTreeNode, Map<FieldKey, FlexTreeField>> = new WeakMap();

export function makeField(
	context: Context,
	schema: FieldKindIdentifier,
	cursor: ITreeSubscriptionCursor,
): FlexTreeField {
	const fieldAnchor = cursor.buildFieldAnchor();
	let usedAnchor = false;

	const makeFlexTreeField = (): FlexTreeField => {
		usedAnchor = true;
		const field = new (
			kindToClass.get(schema) ?? fail(0xb0f /* missing field implementation */)
		)(context, schema, cursor, fieldAnchor);
		return field;
	};

	if (fieldAnchor.parent === undefined) {
		return makeFlexTreeField();
	}

	// For the common case (all but roots), cache field associated with its node's anchor and field key.
	const anchorNode =
		context.checkout.forest.anchors.locate(fieldAnchor.parent) ??
		fail(0xb10 /* missing anchor */);

	// Since anchor-set could be reused across a flex tree context getting disposed, key off the flex tree node not the anchor.
	const cacheKey = anchorNode.slots.get(flexTreeSlot);

	// If there is no flex tree parent node, skip caching: this is not expected to be a hot path, but should probably be fixed at some point.
	if (cacheKey === undefined) {
		return makeFlexTreeField();
	}

	const innerCache = getOrCreate(
		fieldCache,
		cacheKey,
		() => new Map<FieldKey, FlexTreeField>(),
	);
	const result = getOrCreate(innerCache, fieldAnchor.fieldKey, makeFlexTreeField);
	if (!usedAnchor) {
		// The anchor must be disposed to avoid leaking. In the case of a cache hit,
		// we are not transferring ownership to a new FlexTreeField, so it must be disposed of here to avoid the leak.
		context.checkout.forest.anchors.forget(fieldAnchor.parent);
	}
	return result;
}

/**
 * Base type for fields implementing {@link FlexTreeField} using cursors.
 */
export abstract class LazyField extends LazyEntity<FieldAnchor> implements FlexTreeField {
	public get [flexTreeMarker](): FlexTreeEntityKind.Field {
		return FlexTreeEntityKind.Field;
	}
	public readonly key: FieldKey;

	/**
	 * If this field ends its lifetime before the Anchor does, this needs to be invoked to avoid a double free
	 * if/when the Anchor is destroyed.
	 */
	private readonly offAfterDestroy?: () => void;

	public constructor(
		context: Context,
		public readonly schema: FieldKindIdentifier,
		cursor: ITreeSubscriptionCursor,
		fieldAnchor: FieldAnchor,
	) {
		super(context, cursor, fieldAnchor);
		assert(cursor.mode === CursorLocationType.Fields, 0x77b /* must be in fields mode */);
		this.key = cursor.getFieldKey();
		// Fields currently live as long as their parent does.
		// For root fields, this means forever, but other cases can be cleaned up when their parent anchor is deleted.
		if (fieldAnchor.parent !== undefined) {
			const anchorNode =
				context.checkout.forest.anchors.locate(fieldAnchor.parent) ??
				fail(0xb11 /* parent anchor node should always exist since field is under a node */);
			this.offAfterDestroy = anchorNode.events.on("afterDestroy", () => {
				this[disposeSymbol]();
			});
		}
	}

	public is<TKind2 extends FlexFieldKind>(kind: TKind2): this is FlexTreeTypedField<TKind2> {
		assert(
			this.context.schemaPolicy.fieldKinds.get(kind.identifier) === kind,
			0xa26 /* Narrowing must be done to a kind that exists in this context */,
		);

		return this.schema === kind.identifier;
	}

	public get parent(): HydratedFlexTreeNode | undefined {
		if (this.anchor.parent === undefined) {
			return undefined;
		}

		const cursor = this.cursor;
		cursor.exitField();
		const output = getOrCreateHydratedFlexTreeNode(this.context, cursor);
		cursor.enterField(this.key);
		return output;
	}

	protected override tryMoveCursorToAnchor(
		cursor: ITreeSubscriptionCursor,
	): TreeNavigationResult {
		return this.context.checkout.forest.tryMoveCursorToField(this.anchor, cursor);
	}

	protected override forgetAnchor(): void {
		this.offAfterDestroy?.();
		if (this.anchor.parent === undefined) return;
		this.context.checkout.forest.anchors.forget(this.anchor.parent);
	}

	public get length(): number {
		return this.cursor.getFieldLength();
	}

	public atIndex(index: number): FlexTreeUnknownUnboxed {
		return inCursorNode(this.cursor, index, (cursor) =>
			unboxedFlexNode(this.context, cursor, this.anchor),
		);
	}

	public boxedAt(index: number): HydratedFlexTreeNode | undefined {
		const finalIndex = indexForAt(index, this.length);

		if (finalIndex === undefined) {
			return undefined;
		}

		return inCursorNode(this.cursor, finalIndex, (cursor) =>
			getOrCreateHydratedFlexTreeNode(this.context, cursor),
		);
	}

	public map<U>(callbackfn: (value: FlexTreeUnknownUnboxed, index: number) => U): U[] {
		return mapCursorField(this.cursor, (cursor) =>
			callbackfn(unboxedFlexNode(this.context, cursor, this.anchor), cursor.fieldIndex),
		);
	}

	public [Symbol.iterator](): IterableIterator<HydratedFlexTreeNode> {
		return iterateCursorField(this.cursor, (cursor) =>
			getOrCreateHydratedFlexTreeNode(this.context, cursor),
		);
	}

	public getFieldPath(): NormalizedFieldUpPath {
		return { parent: this.parent?.anchorNode, field: this.key };
	}

	/**
	 * Returns the path to this field to use for editing. Throws iff this path is not {@link TreeStatus#InDocument}.
	 * This path is not valid to hold onto across edits: this must be recalled for each edit.
	 */
	public getFieldPathForEditing(): NormalizedFieldUpPath {
		if (!this.isFreed()) {
			if (
				// Only allow editing if we are the root document field...
				(this.parent === undefined && this.anchor.fieldKey === rootFieldKey) ||
				// ...or are under a node in the document
				(this.parent !== undefined &&
					treeStatusFromAnchorCache(this.parent.anchorNode) === TreeStatus.InDocument)
			) {
				return this.getFieldPath();
			}
		}

		throw new UsageError("Editing only allowed on fields with TreeStatus.InDocument status");
	}

	protected getEditor(): IDefaultEditBuilder<ITreeCursorSynchronous> {
		return new MappedEditBuilder(
			this.context.checkout.editor,
			(cursor: ITreeCursorSynchronous) => this.context.checkout.forest.chunkField(cursor),
		);
	}
}

export class LazySequence extends LazyField implements FlexTreeSequenceField {
	public at(index: number): FlexTreeUnknownUnboxed | undefined {
		const finalIndex = indexForAt(index, this.length);

		if (finalIndex === undefined) {
			return undefined;
		}

		return this.atIndex(finalIndex);
	}
	public get asArray(): readonly FlexTreeUnknownUnboxed[] {
		return this.map((x) => x);
	}

	public editor: SequenceFieldEditBuilder<FlexibleFieldContent> = {
		insert: (index, newContent) => {
			this.sequenceEditor().insert(index, cursorForMapTreeField(newContent));
		},
		remove: (index, count) => {
			this.sequenceEditor().remove(index, count);
		},
	};

	private sequenceEditor(): SequenceFieldEditBuilder<ITreeCursorSynchronous> {
		const fieldPath = this.getFieldPathForEditing();
		return this.getEditor().sequenceField(fieldPath);
	}
}

export class LazyValueField extends LazyField implements FlexTreeRequiredField {
	public editor: ValueFieldEditBuilder<FlexibleNodeContent> = {
		set: (newContent) => {
			this.valueFieldEditor().set(cursorForMapTreeField([newContent]));
		},
	};

	private valueFieldEditor(): ValueFieldEditBuilder<ITreeCursorSynchronous> {
		const fieldPath = this.getFieldPathForEditing();
		const fieldEditor = this.getEditor().valueField(fieldPath);
		return fieldEditor;
	}

	public get content(): FlexTreeUnknownUnboxed {
		return this.atIndex(0);
	}
}

export class LazyOptionalField extends LazyField implements FlexTreeOptionalField {
	public editor: OptionalFieldEditBuilder<ExclusiveMapTree> = {
		set: (newContent, wasEmpty) => {
			this.optionalEditor().set(
				newContent !== undefined ? cursorForMapTreeField([newContent]) : newContent,
				wasEmpty,
			);
		},
	};

	private optionalEditor(): OptionalFieldEditBuilder<ITreeCursorSynchronous> {
		const fieldPath = this.getFieldPathForEditing();
		const fieldEditor = this.getEditor().optionalField(fieldPath);
		return fieldEditor;
	}

	public get content(): FlexTreeUnknownUnboxed | undefined {
		return this.length === 0 ? undefined : this.atIndex(0);
	}
}

export class LazyForbiddenField extends LazyField {}

type Builder = new (
	context: Context,
	// Correct use of these builders requires the builder of the matching type to be used.
	schema: FieldKindIdentifier,
	cursor: ITreeSubscriptionCursor,
	fieldAnchor: FieldAnchor,
) => LazyField;

const builderList: [FieldKindIdentifier, Builder][] = [
	[FieldKinds.forbidden.identifier, LazyForbiddenField],
	[FieldKinds.optional.identifier, LazyOptionalField],
	[FieldKinds.sequence.identifier, LazySequence],
	[FieldKinds.required.identifier, LazyValueField],
	[FieldKinds.identifier.identifier, LazyValueField],
];

const kindToClass: ReadonlyMap<FieldKindIdentifier, Builder> = new Map(builderList);

/**
 * Returns the flex tree node, or the value if it has one.
 */
export function unboxedFlexNode(
	context: Context,
	cursor: ITreeSubscriptionCursor,
	fieldAnchor: FieldAnchor,
): FlexTreeUnknownUnboxed {
	const value = cursor.value;
	if (value !== undefined) {
		return value;
	}

	// Try accessing cached child node via anchors.
	// This avoids O(depth) related costs from getOrCreateHydratedFlexTreeNode in the cached case.
	const anchor = fieldAnchor.parent;
	let child: AnchorNode | undefined;
	if (anchor !== undefined) {
		const anchorNode = context.checkout.forest.anchors.locate(anchor);
		assert(anchorNode !== undefined, 0xa4c /* missing anchor */);
		child = anchorNode.childIfAnchored(fieldAnchor.fieldKey, cursor.fieldIndex);
	} else {
		child = context.checkout.forest.anchors.find({
			parent: undefined,
			parentField: fieldAnchor.fieldKey,
			parentIndex: cursor.fieldIndex,
		});
	}

	if (child !== undefined) {
		const cached = child.slots.get(flexTreeSlot);
		if (cached !== undefined) {
			return cached;
		}
	}

	return getOrCreateHydratedFlexTreeNode(context, cursor);
}
