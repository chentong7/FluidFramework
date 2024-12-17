/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

"use client";

import type { IPresence } from "@fluidframework/presence/alpha";
import { Avatar, Badge, styled } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";

import { buildUserPresence } from "@/app/presence";
import { getProfilePhoto } from "@/infra/authHelper";

interface UserPresenceProps {
	presence: IPresence;
}

const UserPresenceGroup: React.FC<UserPresenceProps> = ({
	presence,
}): JSX.Element => {
	const isFirstRender = useRef(true);
	const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map());


	useEffect((): void => {
		const userPresenceGroup = buildUserPresence(presence);

		/**
		 * fetch the user's photo if it's spe client, for the tinylicious client, it will use the default photo.
		 * */
		const updateUserPresenceGroup = async (): Promise<void> => {
			const clientId = process.env.NEXT_PUBLIC_SPE_CLIENT_ID;
			const tenantId = process.env.NEXT_PUBLIC_SPE_ENTRA_TENANT_ID;
			let photoUrl: string = "";

			// spe client
			if (tenantId !== undefined && clientId !== undefined) {
				photoUrl = await getProfilePhoto();
			}
			userPresenceGroup.props.onlineUsers.local = { photo: photoUrl };
			setPhotoUrls((current) => { current.set(presence.getMyself().sessionId, photoUrl); return current });

			isFirstRender.current = false;
		};

		if (isFirstRender.current) {
			updateUserPresenceGroup().catch((error) => console.error(error));
		}

		userPresenceGroup.props.onlineUsers.events.on("updated", (update) => {
			console.debug("Presence - 'updated' event", JSON.stringify(update));
			setPhotoUrls((current) => { const newMap = new Map(current); newMap.set(update.client.sessionId, update.value.photo); return newMap });
		});
		presence.events.on("attendeeDisconnected", (attendee) => {
			console.debug("Presence - 'attendeeDisconnected' event", JSON.stringify(attendee));
			setPhotoUrls((current) => { const newMap = new Map(current); newMap.delete(attendee.sessionId); return newMap });
		});
	}, [
		photoUrls,
		setPhotoUrls,
		presence,
	]);

	const StyledBadge = styled(Badge)(({ theme }) => ({
		"& .MuiBadge-badge": {
			backgroundColor: "#44b700",
			color: "#44b700",
			boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
			"&::after": {
				position: "absolute",
				top: 0,
				left: 0,
				width: "100%",
				height: "100%",
				borderRadius: "50%",
				animation: "ripple 1.2s infinite ease-in-out",
				border: "1px solid currentColor",
				content: '""',
			},
		},
		"@keyframes ripple": {
			"0%": {
				transform: "scale(.8)",
				opacity: 1,
			},
			"100%": {
				transform: "scale(2.4)",
				opacity: 0,
			},
		},
	}));

	return (
		<div>
			{photoUrls.size === 0 ? (
				<Avatar alt="User Photo" sx={{ width: 56, height: 56 }} />
			) : (
				<>
					{[...photoUrls.values()].slice(0, 4).map((photo, index) => (
						<StyledBadge
							key={index}
							overlap="circular"
							anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
							variant="dot"
						>
							<Avatar alt="User Photo" src={photo} sx={{ width: 56, height: 56 }} />
						</StyledBadge>
					))}
					{photoUrls.size > 4 && (
						<Badge
							overlap="circular"
							anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
							badgeContent={`+${photoUrls.size - 4}`}
							color="primary"
						>
							<Avatar alt="More Users" sx={{ width: 56, height: 56 }} />
						</Badge>
					)}
				</>
			)}
		</div>
	);
};

export { UserPresenceGroup };
