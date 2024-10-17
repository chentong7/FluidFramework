/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	IPresence,
	Latest,
	type PresenceStates,
	type PresenceStatesSchema,
} from "@fluid-experimental/presence";

export interface User {
	clientId: string;
	tenantId: string;
}

const statesSchema = {
	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	user: Latest({} as User),
} satisfies PresenceStatesSchema;

export type UserPresence = PresenceStates<typeof statesSchema>;

export function buildUserPresence(presence: IPresence): UserPresence {
	const states = presence.getStates("name:app-client-states", statesSchema);
	return states;
}
