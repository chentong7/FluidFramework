/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { InteractiveBrowserCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import React, { useEffect, useState } from "react";

interface UserProfilePhotoProps {
	userId: string;
	clientId: string;
	tenantId: string;
}

const UserProfilePhoto: React.FC<UserProfilePhotoProps> = ({ userId, clientId, tenantId }) => {
	const [photo, setPhoto] = useState<string | null>(null);

	useEffect(() => {
		const credential = new InteractiveBrowserCredential({
			clientId,
			tenantId,
		});

		const authProvider = new TokenCredentialAuthenticationProvider(credential, {
			scopes: ["User.Read"],
		});

		const client = Client.initWithMiddleware({ authProvider });

		const fetchPhoto = async () => {
			try {
				const photoBlob = await client.api(`/users/${userId}/photo/$value`).get();
				const photoUrl = URL.createObjectURL(photoBlob);
				setPhoto(photoUrl);
			} catch (error) {
				console.error(error);
			}
		};

		fetchPhoto();
	}, [userId, clientId, tenantId]);

	return <div>{photo ? <img src={photo} alt="User Photo" /> : <p>Loading photo...</p>}</div>;
};

export default UserProfilePhoto;
