/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { IOdspAuthRequestInfo } from "./odspAuth.js";
import { getSiteUrl } from "./odspDocLibUtils.js";
import { throwOdspNetworkError } from "./odspErrorUtils.js";
import { getAsync, putAsync } from "./odspRequest.js";

interface IOdspUser {
	displayName: string;
	email?: string;
	id?: string;
}

interface IOdspGroup {
	displayName: string;
	email?: string;
}

interface IOdspDriveQuota {
	deleted: number;
	fileCount: number;
	remaining: number;
	state: string;
	total: number;
	used: number;
}

interface IOdspEntity {
	user?: IOdspUser;
	group?: IOdspGroup;
}

interface IOdspDriveInfo {
	id: string;
	createdDateTime: string;
	description: string;
	driveType: string;
	lastModifiedDateTime: string;
	name: string;
	webUrl: string;
	createdBy: IOdspEntity;
	lastModifiedBy: IOdspEntity;
	owner: IOdspEntity;
	quota: IOdspDriveQuota;
}

/**
 * @internal
 */
export interface IOdspDriveItem {
	path: string;
	name: string;
	driveId: string;
	itemId: string;
	isFolder: boolean;
}

// eslint-disable-next-line jsdoc/require-description -- TODO: Add documentation
/**
 * @internal
 */
export async function getDriveItemByRootFileName(
	server: string,
	account: string | undefined,
	path: string,
	authRequestInfo: IOdspAuthRequestInfo,
	create: boolean,
	driveId?: string,
): Promise<IOdspDriveItem> {
	const accountPath = account === undefined ? "" : `/${account}`;
	let getDriveItemUrl: string;
	if (driveId !== undefined && driveId !== "") {
		const encodedDrive = encodeURIComponent(driveId);
		getDriveItemUrl = `${getSiteUrl(
			server,
		)}${accountPath}/_api/v2.1/drives/${encodedDrive}/root:${path}:`;
	} else {
		getDriveItemUrl = `${getSiteUrl(server)}${accountPath}/_api/v2.1/drive/root:${path}:`;
	}
	return getDriveItem(getDriveItemUrl, authRequestInfo, create);
}

// eslint-disable-next-line jsdoc/require-description -- TODO: Add documentation
/**
 * @internal
 */
export async function getDriveItemByServerRelativePath(
	server: string,
	serverRelativePath: string,
	authRequestInfo: IOdspAuthRequestInfo,
	create: boolean,
): Promise<IOdspDriveItem> {
	let account = "";
	const pathParts = serverRelativePath.split("/");
	if (serverRelativePath.startsWith("/")) {
		pathParts.shift();
	}
	if (pathParts.length === 0) {
		throw new Error(`Invalid serverRelativePath ${serverRelativePath}`);
	}
	if (
		pathParts.length >= 2 &&
		(pathParts[0] === "personal" || pathParts[0] === "teams" || pathParts[0] === "sites")
	) {
		account = `${pathParts.shift()}/${pathParts.shift()}`;
	}

	const library = pathParts.shift();
	if (!library) {
		// Default drive/library
		return getDriveItemByRootFileName(server, account, "/", authRequestInfo, create);
	}
	const path = `/${pathParts.join("/")}`;
	const driveId = await getDriveId(server, account, library, authRequestInfo);
	const getDriveItemUrl = `${getSiteUrl(server)}/_api/v2.1/drives/${driveId}/root:${path}:`;
	return getDriveItem(getDriveItemUrl, authRequestInfo, create);
}

// eslint-disable-next-line jsdoc/require-description -- TODO: Add documentation
/**
 * @internal
 */
export async function getDriveItemFromDriveAndItem(
	server: string,
	drive: string,
	item: string,
	authRequestInfo: IOdspAuthRequestInfo,
): Promise<IOdspDriveItem> {
	const url = `${getSiteUrl(server)}/_api/v2.1/drives/${drive}/items/${item}`;
	return getDriveItem(url, authRequestInfo, false);
}

// eslint-disable-next-line jsdoc/require-description -- TODO: Add documentation
/**
 * @internal
 */
export async function getChildrenByDriveItem(
	driveItem: IOdspDriveItem,
	server: string,
	authRequestInfo: IOdspAuthRequestInfo,
): Promise<IOdspDriveItem[]> {
	if (!driveItem.isFolder) {
		return [];
	}
	let url = `${getSiteUrl(server)}/_api/v2.1/drives/${driveItem.driveId}/items/${
		driveItem.itemId
	}/children`;
	let children: unknown[] = [];
	do {
		const response = await getAsync(url, authRequestInfo);
		if (response.status !== 200) {
			// pre-0.58 error message: unableToGetChildren
			throwOdspNetworkError("Unable to get driveItem children", response.status, response);
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- TODO: use stronger typing here.
		const getChildrenResult = await response.json();
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		children = [...children, ...getChildrenResult.value];
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		url = getChildrenResult["@odata.nextLink"];
	} while (url);

	return children.map((child) => toIODSPDriveItem(child));
}

async function getDriveItem(
	getDriveItemUrl: string,
	authRequestInfo: IOdspAuthRequestInfo,
	create: boolean,
): Promise<IOdspDriveItem> {
	let response = await getAsync(getDriveItemUrl, authRequestInfo);
	if (response.status !== 200) {
		if (!create) {
			// pre-0.58 error message: unableToGetDriveItemIdFromPath
			throwOdspNetworkError(
				"Unable to get drive/item id from path",
				response.status,
				response,
			);
		}

		// Try creating the file
		const contentUri = `${getDriveItemUrl}/content`;
		const createResultResponse = await putAsync(contentUri, authRequestInfo);
		if (createResultResponse.status !== 201) {
			// pre-0.58 error message: failedToCreateFile
			throwOdspNetworkError(
				"Failed to create file",
				createResultResponse.status,
				createResultResponse,
			);
		}

		response = await getAsync(getDriveItemUrl, authRequestInfo);
		if (response.status !== 200) {
			// pre-0.58 error message: unableToGetDriveItemIdFromPath
			throwOdspNetworkError(
				"Unable to get drive/item id from path after creating",
				response.status,
				response,
			);
		}
	}
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- TODO: use stronger typing here.
	const getDriveItemResult = await response.json();
	return toIODSPDriveItem(getDriveItemResult);
}

// eslint-disable-next-line jsdoc/require-description -- TODO: Add documentation
/**
 * @legacy
 * @alpha
 */
export async function getDriveId(
	server: string,
	account: string,
	library: string | undefined,
	authRequestInfo: IOdspAuthRequestInfo,
): Promise<string> {
	if (library === undefined) {
		const drive = await getDefaultDrive(server, account, authRequestInfo);
		return drive.id;
	}
	const drives = await getDrives(server, account, authRequestInfo);
	const accountPath = account ? `/${account}` : "";
	const drivePath = encodeURI(`${getSiteUrl(server)}${accountPath}/${library}`);
	const index = drives.findIndex((value) => value.webUrl === drivePath);
	if (index === -1) {
		throw new Error(`Drive ${drivePath} not found.`);
	}
	return drives[index].id;
}

async function getDefaultDrive(
	server: string,
	account: string,
	authRequestInfo: IOdspAuthRequestInfo,
): Promise<IOdspDriveInfo> {
	const response = await getDriveResponse("drive", server, account, authRequestInfo);
	const getDriveResult = (await response.json()) as IOdspDriveInfo;
	return getDriveResult;
}

async function getDrives(
	server: string,
	account: string,
	authRequestInfo: IOdspAuthRequestInfo,
): Promise<IOdspDriveInfo[]> {
	const response = await getDriveResponse("drives", server, account, authRequestInfo);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- TODO: use stronger typing here.
	const getDriveResult = await response.json();
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	return getDriveResult.value as IOdspDriveInfo[];
}

async function getDriveResponse(
	routeTail: "drive" | "drives",
	server: string,
	account: string,
	authRequestInfo: IOdspAuthRequestInfo,
): Promise<Response> {
	const accountPath = account ? `/${account}` : "";
	const getDriveUrl = `${getSiteUrl(server)}${accountPath}/_api/v2.1/${routeTail}`;
	const response = await getAsync(getDriveUrl, authRequestInfo);
	if (response.status !== 200) {
		throwOdspNetworkError(
			// pre-0.58 error message: failedToGetDriveResponse
			`Failed to get response from /${routeTail} endpoint`,
			response.status,
			response,
			undefined,
			{ route: routeTail },
		);
	}
	return response;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: use a real type here
function toIODSPDriveItem(parsedDriveItemBody: any): IOdspDriveItem {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
	const path = parsedDriveItemBody.parentReference.path
		? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
			parsedDriveItemBody.parentReference.path.split("root:")[1]
		: "/";
	return {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		path,
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		name: parsedDriveItemBody.name,
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		driveId: parsedDriveItemBody.parentReference.driveId,
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		itemId: parsedDriveItemBody.id,
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		isFolder: !!parsedDriveItemBody.folder,
	};
}
