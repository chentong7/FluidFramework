/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { FluidReleaseMachine } from "../../machines/index.js";
import { initializeCommandTestFunction } from "../init.js";

const test = initializeCommandTestFunction(import.meta.url);
const knownUnhandledStates: Set<string> = new Set([
	// Known unhandled states can be added here temporarily during development.
]);

const machineStates = FluidReleaseMachine.states()
	.filter((s) => !knownUnhandledStates.has(s))
	.sort();

describe("release command handles all states", () => {
	for (const state of machineStates) {
		test
			.stdout()
			.command([
				"release",
				"--releaseGroup",
				"build-tools",
				"--bumpType",
				"patch",
				"--testMode",
				"--state",
				state,
				"--verbose",
			])
			.exit(100)
			.it(`Handles state: '${state}'`, (ctx) => {
				// nothing
			});
	}
});
