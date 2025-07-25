/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { IDocument, IServiceConfiguration } from "@fluidframework/server-services-core";

/**
 * Whether a document exists and is not functionally deleted.
 * @internal
 */
export function isDocumentValid(document: IDocument): boolean {
	return !!document && !document.scheduledDeletionTime;
}

/**
 * Whether a document's active session aligns with the service's location.
 * @internal
 */
export function isDocumentSessionValid(
	document: IDocument,
	serviceConfiguration: IServiceConfiguration,
): boolean {
	if (!serviceConfiguration.externalOrdererUrl || !document.session) {
		// No session location to validate.
		return true;
	}
	const isSessionInThisCluster =
		document.session.ordererUrl === serviceConfiguration.externalOrdererUrl;
	if (document.session.isSessionActive && isSessionInThisCluster) {
		return true;
	}
	if (!document.session.isSessionAlive) {
		// Session is not "alive", so client has bypassed discovery flow.
		// Other clients could be routed to alternate locations, resulting in "split-brain" scenario.
		// Prevent Deli from processing ops.
		return false;
	}
	return isSessionInThisCluster;
}
