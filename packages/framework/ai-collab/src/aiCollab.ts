/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { ImplicitFieldSchema } from "@fluidframework/tree";

import type { AiCollabOptions, GenerateTreeEditsResponse } from "./aiCollabApi.js";
import { generateTreeEditsWithDiff } from "./explicit-strategy/index.js";

/**
 * Calls an LLM to modify the provided SharedTree based on the provided users input.
 * @remarks This function is designed to be a controlled "all-in-one" function that handles the entire process of calling an LLM to collaborative edit a SharedTree.
 *
 * @alpha
 */
export async function aiCollab(
	options: AiCollabOptions<ImplicitFieldSchema>,
): Promise<GenerateTreeEditsResponse> {
	const response = await generateTreeEditsWithDiff({
		treeView: options.treeView,
		validator: options.validator,
		openAI: options.openAI,
		prompt: options.prompt,
		limiters: options.limiters,
		dumpDebugLog: options.dumpDebugLog,
		planningStep: options.planningStep,
		finalReviewStep: options.finalReviewStep,
	});

	return response;
}
