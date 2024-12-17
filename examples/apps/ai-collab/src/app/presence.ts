/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	IPresence,
	Latest,
	type PresenceStates,
	type PresenceStatesSchema,
} from "@fluidframework/presence/alpha";

export interface User {
	photo: string;
}

const statesSchema = {
	onlineUsers: Latest<User>({ photo: "" }),
} satisfies PresenceStatesSchema;

export type UserPresence = PresenceStates<typeof statesSchema>;

// Takes a presence object and returns the user presence object that contains the shared object states
export function buildUserPresence(presence: IPresence): UserPresence {
	const states = presence.getStates(`name:user-avatar-states`, statesSchema);
	return states;
}
