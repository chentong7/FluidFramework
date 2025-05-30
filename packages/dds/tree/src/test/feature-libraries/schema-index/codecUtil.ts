/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import type { SchemaVersion } from "../../../core/index.js";
// eslint-disable-next-line import/no-internal-modules
import { makeSchemaCodecs } from "../../../feature-libraries/schema-index/index.js";
import { ajvValidator } from "../../codec/index.js";

/*
 * The list of supported schema write versions. Used in tests that cover multiple schema versions.
 */
export const supportedSchemaFormats = Array.from(
	makeSchemaCodecs({ jsonValidator: ajvValidator }).getSupportedFormats(),
).filter((format) => format !== undefined) as SchemaVersion[];
