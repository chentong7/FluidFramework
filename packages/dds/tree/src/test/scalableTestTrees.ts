/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { strict as assert } from "node:assert";

import {
	EmptyKey,
	type FieldKey,
	type NormalizedUpPath,
	type UpPath,
	moveToDetachedField,
	rootFieldKey,
} from "../core/index.js";
import {
	FieldKinds,
	isFlexTreeNode,
	type Context,
	type FlexTreeNode,
} from "../feature-libraries/index.js";
import { brand } from "../util/index.js";
import {
	SchemaFactory,
	type InsertableContent,
	type UnsafeUnknownSchema,
	type ValidateRecursiveSchema,
} from "../simple-tree/index.js";
import type { TreeStoredContent } from "../shared-tree/index.js";
import { toStoredSchema } from "../simple-tree/index.js";

import type {
	TreeSimpleContent,
	// eslint-disable-next-line import/no-internal-modules
} from "./feature-libraries/flex-tree/utils.js";
import { fieldCursorFromInsertable } from "./utils.js";

/**
 * Test trees which can be parametrically scaled to any size.
 */

/**
 * Arbitrary key used when a field key is needed in this file.
 */
export const localFieldKey: FieldKey = brand("foo");

const sf = new SchemaFactory("scalable");

/**
 * Linked list used for performance testing deep trees.
 * @remarks
 * Simple-tree version of {@link deepSchema}.
 */
export class LinkedList extends sf.objectRecursive("linkedList", {
	foo: [() => LinkedList, sf.number],
}) {}
{
	type _check = ValidateRecursiveSchema<typeof LinkedList>;
}

/**
 * Array node used for testing the performance scalability of large arrays.
 * @remarks
 * Simple-tree version of {@link wideSchema}.
 */
export class WideRoot extends sf.array("WideRoot", sf.number) {}

export interface JSDeepTree {
	foo: JSDeepTree | number;
}

export type JSWideTree = number[];

export function makeJsDeepTree(depth: number, leafValue: number): JSDeepTree | number {
	return depth === 0 ? leafValue : { foo: makeJsDeepTree(depth - 1, leafValue) };
}

export function makeDeepContentSimple(
	depth: number,
	leafValue: number = 1,
): TreeSimpleContent {
	// Type conversion is needed here to make this compile.
	const initialTree = makeJsDeepTree(depth, leafValue) as InsertableContent;
	return {
		initialTree,
		schema: LinkedList,
	};
}

export function makeDeepStoredContent(
	depth: number,
	leafValue: number = 1,
): TreeStoredContent {
	const content = makeDeepContentSimple(depth, leafValue);
	return {
		initialTree: fieldCursorFromInsertable<UnsafeUnknownSchema>(
			content.schema,
			content.initialTree,
		),
		schema: toStoredSchema(content.schema),
	};
}

/**
 * Returns a tree with specified number of nodes, with the end leaf node set to the endLeafValue
 * @param numberOfNodes - number of nodes of the tree
 * @param endLeafValue - the value of the end leaf of the tree. If not provided its index is used.
 */
export function makeWideContentWithEndValueSimple(
	numberOfNodes: number,
	endLeafValue?: number,
): TreeSimpleContent {
	const initialTree = makeJsWideTreeWithEndValue(numberOfNodes, endLeafValue);
	return {
		initialTree,
		schema: WideRoot,
	};
}

/**
 * Returns a tree with specified number of nodes, with the end leaf node set to the endLeafValue.
 * @param numberOfNodes - number of nodes of the tree
 * @param endLeafValue - the value of the end leaf of the tree. If not provided its index is used.
 */
export function makeWideStoredContentWithEndValue(
	numberOfNodes: number,
	endLeafValue?: number,
): TreeStoredContent {
	const content = makeWideContentWithEndValueSimple(numberOfNodes, endLeafValue);
	return {
		initialTree: fieldCursorFromInsertable<UnsafeUnknownSchema>(
			content.schema,
			content.initialTree,
		),
		schema: toStoredSchema(content.schema),
	};
}

/**
 * Returns a tree with specified number of nodes, with the end leaf node set to the endLeafValue.
 * @param numberOfNodes - number of nodes of the tree
 * @param endLeafValue - the value of the end leaf of the tree. If not provided its index is used.
 */
export function makeJsWideTreeWithEndValue(
	numberOfNodes: number,
	endLeafValue?: number,
): JSWideTree {
	const numbers = [];
	for (let index = 0; index < numberOfNodes - 1; index++) {
		numbers.push(index);
	}
	numbers.push(endLeafValue ?? numberOfNodes - 1);
	return numbers;
}

export function readDeepTreeAsJSObject(tree: JSDeepTree): { depth: number; value: number } {
	let currentNode = tree.foo;
	let depth = 1;
	let value = 0;

	while (typeof currentNode !== "number") {
		currentNode = currentNode.foo;
		depth += 1;
	}
	if (typeof currentNode === "number") {
		value = currentNode;
	}
	return { depth, value };
}

export function readWideTreeAsJSObject(nodes: JSWideTree): {
	nodesCount: number;
	sum: number;
} {
	let sum = 0;

	for (const node of nodes) {
		sum += node;
	}
	return { nodesCount: nodes.length, sum };
}

export function readWideCursorTree(tree: Context): {
	nodesCount: number;
	sum: number;
} {
	let nodesCount = 0;
	let sum = 0;
	const readCursor = tree.checkout.forest.allocateCursor();
	moveToDetachedField(tree.checkout.forest, readCursor);
	assert(readCursor.firstNode());
	readCursor.firstField();
	for (let inNode = readCursor.firstNode(); inNode; inNode = readCursor.nextNode()) {
		sum += readCursor.value as number;
		nodesCount += 1;
	}
	readCursor.free();
	return { nodesCount, sum };
}

export function readDeepCursorTree(tree: Context): {
	depth: number;
	value: number;
} {
	let depth = 0;
	let value = 0;
	const readCursor = tree.checkout.forest.allocateCursor();
	moveToDetachedField(tree.checkout.forest, readCursor);
	assert(readCursor.firstNode());
	while (readCursor.firstField()) {
		readCursor.firstNode();
		depth += 1;
		value = readCursor.value as number;
	}
	value = readCursor.value as number;
	readCursor.free();
	return { depth, value };
}

/**
 * Path to linked list node at provided depth.
 * Depth 1 points to the root node.
 */
export function deepPath(depth: number): NormalizedUpPath {
	assert(depth > 0);
	let path: NormalizedUpPath = {
		detachedNodeId: undefined,
		parent: undefined,
		parentField: rootFieldKey,
		parentIndex: 0,
	};
	for (let i = 0; i < depth - 1; i++) {
		path = {
			parent: path,
			parentField: localFieldKey,
			parentIndex: 0,
		};
	}
	return path;
}

/**
 * Path to linked list node at provided depth.
 * Depth 1 points to the root node.
 */
export function wideLeafPath(index: number): UpPath {
	const path = {
		parent: {
			parent: undefined,
			parentField: rootFieldKey,
			parentIndex: 0,
		},
		parentField: EmptyKey,
		parentIndex: index,
	};
	return path;
}

export function readWideFlexTree(tree: Context): {
	nodesCount: number;
	sum: number;
} {
	let sum = 0;
	let nodesCount = 0;
	const root = tree.root;
	assert(root.is(FieldKinds.required));
	const field = (root.content as FlexTreeNode).getBoxed(EmptyKey);
	assert(field.length !== 0);
	assert(field.is(FieldKinds.sequence));
	for (const currentNode of field) {
		sum += currentNode.value as number;
		nodesCount += 1;
	}
	return { nodesCount, sum };
}

export function readDeepFlexTree(tree: Context): {
	depth: number;
	value: number;
} {
	let depth = 0;
	assert(tree.root.is(FieldKinds.required));
	let currentNode = tree.root.content as FlexTreeNode | number;
	while (isFlexTreeNode(currentNode)) {
		const read = currentNode.getBoxed(brand("foo"));
		assert(read.is(FieldKinds.required));
		currentNode = read.content as FlexTreeNode;
		depth++;
	}
	return { depth, value: currentNode };
}
