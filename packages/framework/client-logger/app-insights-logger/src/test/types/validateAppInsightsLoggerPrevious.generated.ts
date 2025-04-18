/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
 * Generated by flub generate:typetests in @fluid-tools/build-cli.
 */

import type * as old from "@fluidframework/app-insights-logger-previous/internal";
import type { TypeOnly, MinimalType, FullType, requireAssignableTo } from "@fluidframework/build-tools";

import type * as current from "../../index.js";

declare type MakeUnusedImportErrorsGoAway<T> = TypeOnly<T> | MinimalType<T> | FullType<T> | typeof old | typeof current | requireAssignableTo<true, true>;

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Function_createLogger": {"backCompat": false}
 */
declare type current_as_old_for_Function_createLogger = requireAssignableTo<TypeOnly<typeof current.createLogger>, TypeOnly<typeof old.createLogger>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_CategoryFilter": {"forwardCompat": false}
 */
declare type old_as_current_for_Interface_CategoryFilter = requireAssignableTo<TypeOnly<old.CategoryFilter>, TypeOnly<current.CategoryFilter>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_CategoryFilter": {"backCompat": false}
 */
declare type current_as_old_for_Interface_CategoryFilter = requireAssignableTo<TypeOnly<current.CategoryFilter>, TypeOnly<old.CategoryFilter>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_FluidAppInsightsLoggerConfig": {"forwardCompat": false}
 */
declare type old_as_current_for_Interface_FluidAppInsightsLoggerConfig = requireAssignableTo<TypeOnly<old.FluidAppInsightsLoggerConfig>, TypeOnly<current.FluidAppInsightsLoggerConfig>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_FluidAppInsightsLoggerConfig": {"backCompat": false}
 */
declare type current_as_old_for_Interface_FluidAppInsightsLoggerConfig = requireAssignableTo<TypeOnly<current.FluidAppInsightsLoggerConfig>, TypeOnly<old.FluidAppInsightsLoggerConfig>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_NamespaceFilter": {"forwardCompat": false}
 */
declare type old_as_current_for_Interface_NamespaceFilter = requireAssignableTo<TypeOnly<old.NamespaceFilter>, TypeOnly<current.NamespaceFilter>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "Interface_NamespaceFilter": {"backCompat": false}
 */
declare type current_as_old_for_Interface_NamespaceFilter = requireAssignableTo<TypeOnly<current.NamespaceFilter>, TypeOnly<old.NamespaceFilter>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAlias_TelemetryEventCategory": {"forwardCompat": false}
 */
declare type old_as_current_for_TypeAlias_TelemetryEventCategory = requireAssignableTo<TypeOnly<old.TelemetryEventCategory>, TypeOnly<current.TelemetryEventCategory>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAlias_TelemetryEventCategory": {"backCompat": false}
 */
declare type current_as_old_for_TypeAlias_TelemetryEventCategory = requireAssignableTo<TypeOnly<current.TelemetryEventCategory>, TypeOnly<old.TelemetryEventCategory>>

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAlias_TelemetryFilter": {"forwardCompat": false}
 */
declare type old_as_current_for_TypeAlias_TelemetryFilter = requireAssignableTo<TypeOnly<old.TelemetryFilter>, TypeOnly<current.TelemetryFilter>>

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "TypeAlias_TelemetryFilter": {"backCompat": false}
 */
declare type current_as_old_for_TypeAlias_TelemetryFilter = requireAssignableTo<TypeOnly<current.TelemetryFilter>, TypeOnly<old.TelemetryFilter>>
