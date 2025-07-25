# @fluidframework/shared-object-base

## 2.51.0

Dependency updates only.

## 2.50.0

Dependency updates only.

## 2.43.0

### Minor Changes

- Added an optional boolean parameter "fullTree" to SharedObject's summarizeCore method ([#24761](https://github.com/microsoft/FluidFramework/pull/24761)) [1e24967a8f9](https://github.com/microsoft/FluidFramework/commit/1e24967a8f943b0616d765c253fe079fc9c43619)

  This parameter tells the shared object that it should generate a full tree summary, i.e., it must not summarize incrementally.
  Currently no known `SharedObject`'s do incremental summaries; however, any that do exist or are made in the future must take this "fullTree" parameter into consideration to function correctly.

## 2.42.0

Dependency updates only.

## 2.41.0

Dependency updates only.

## 2.40.0

### Minor Changes

- IFluidHandleInternal.bind has been deprecated ([#24553](https://github.com/microsoft/FluidFramework/pull/24553)) [8a4362a7ed](https://github.com/microsoft/FluidFramework/commit/8a4362a7edef3a97fee13c9d23bea49448ba2a6a)

  Handle binding is an internal concept used to make sure objects attach to the Container graph when their handle is stored in a DDS which is itself attached.
  The source of the "bind" operation has been assumed to be any handle, but only one implementation is actually supported (`SharedObjectHandle`, not exported itself).

  So the `bind` function is now deprecated on the `IFluidHandleInterface`, moving instead to internal types supporting the one valid implementation.
  It's also deprecated on the various exported handle implementations that don't support it (each is either no-op, pass-through, or throwing).

  No replacement is offered, this API was never meant to be called from outside of the Fluid Framework.

## 2.33.0

Dependency updates only.

## 2.32.0

Dependency updates only.

## 2.31.0

Dependency updates only.

## 2.30.0

Dependency updates only.

## 2.23.0

Dependency updates only.

## 2.22.0

### Minor Changes

- Change when the `pre-op` and `op` events on `ISharedObjectEvents` are emitted ([#23836](https://github.com/microsoft/FluidFramework/pull/23836)) [5eb19a0fc6](https://github.com/microsoft/FluidFramework/commit/5eb19a0fc6f00ba47ddc338a1a5932e683a6039c)

  Previous behavior - `pre-op` was emitted immediately before an op was processed. Then the op was processed and `op` was emitted immediately after that.

  New behavior - `pre-op` will still be emitted before an op is processed and `op` will still be emitted after an op is processed. However, these won't be immediate and other ops in a batch for the shared object may be processed in between.

  Note that these events are for internal use only as mentioned in the @remarks section of their definition.

- Deprecate `processCore` on `SharedObject` and `SharedObjectCore` in favor of `processMessagesCore` ([#23836](https://github.com/microsoft/FluidFramework/pull/23836)) [5eb19a0fc6](https://github.com/microsoft/FluidFramework/commit/5eb19a0fc6f00ba47ddc338a1a5932e683a6039c)

  A new function `processMessagesCore` has been added in place of `processCore`, which will be called to process multiple messages instead of a single one on the channel. This is part of a feature called "Op bunching" where contiguous ops in a grouped batch are bunched and processed together by the shared object.

  Implementations of `SharedObject` and `SharedObjectCore` must now also implement `processMessagesCore`. A basic implementation could be to iterate over the messages' content and process them one by one as it happens now. Note that some DDS may be able to optimize processing by processing the messages together.

## 2.21.0

Dependency updates only.

## 2.20.0

### Minor Changes

- Replace 'any' in return type for several APIs ([#23238](https://github.com/microsoft/FluidFramework/pull/23238)) [0783a31731](https://github.com/microsoft/FluidFramework/commit/0783a317317647e8881ec717a6f85c531cdbc956)

  To improve type safety of the Fluid Framework legacy+alpha API surface,
  we're moving away from using the `any` type in favor of `unknown`.

  We expect that any changes required in consumers of these APIs will be limited to having to provide explicit types
  when calling any of the APIs whose return value changed to `unknown`, like `IFluidSerializer.parse()`.

  In summary, code that looked like this:

  ```typescript
  // 'myVariable' ended up typed as 'any' here and TypeScript would not do any type-safety checks on it.
  const myVariable = this.serializer.parse(stringHeader);
  ```

  Will now have to look like this:

  ```typescript
  // Do this if you know the type of the object you expect to get back.
  const myVariable = this.serializer.parse(stringHeader) as MyType;

  // Alternatively, this will maintain current behavior but also means no type-safety checks will be done by TS.
  // const myVariable = this.serializer.parse(stringHeader) as any;
  ```

  The appropriate type will depend on what the calling code is doing and the objects it expects to be dealing with.

  We further encourage consumers of any of these APIs to add runtime checks
  to validate that the returned object actually matches the expected type.

  The list of affected APIs is as follows:

  - `IFluidSerializer.encode(...)` now takes `value: unknown` instead of `value: any` and returns `unknown` instead of `any`.
  - `IFluidSerializer.decode(...)` now takes `input: unknown` instead of `input: any` and returns `unknown` instead of `any`.
  - `IFluidSerializer.stringify(...)` now takes `value: unknown` instead of `value: any`.
  - `IFluidSerializer.parse(...)` now returns `unknown` instead of `any`.
  - `SharedObjectCore.applyStashedOps(...)` now takes `content: unknown` instead of `content: any`.
  - `SharedObjectCore.rollback(...)` now takes `content: unknown` instead of `content: any`.
  - `SharedObjectCore.submitLocalMessage(...)` now takes `content: unknown` instead of `content: any`.
  - `SharedObjectCore.reSubmitCore(...)` now takes `content: unknown` instead of `content: any`.
  - In `SharedObjectCore.newAckBasedPromise<T>(...)` the `executor` parameter now takes `reject: (reason?: unknown)`
    instead of `reject: (reason?: any)`.
  - `makeHandlesSerializable(...)` now returns `unknown` instead of `any`.
  - `parseHandles(...)` now returns `unknown` instead of `any`.

  Additionally, the following APIs were never designed to return a value and have thus been updated to return `void` instead of `any`:

  - `SharedObjectCore.processCore(...)`.
  - `SharedObjectCore.onDisconnect(...)`

## 2.13.0

Dependency updates only.

## 2.12.0

Dependency updates only.

## 2.11.0

Dependency updates only.

## 2.10.0

Dependency updates only.

## 2.5.0

Dependency updates only.

## 2.4.0

Dependency updates only.

## 2.3.0

Dependency updates only.

## 2.2.0

Dependency updates only.

## 2.1.0

### Minor Changes

- Type guards for DDS types ([#21850](https://github.com/microsoft/FluidFramework/pull/21850)) [6bdec1ac07](https://github.com/microsoft/FluidFramework/commit/6bdec1ac07d6f95ef2fbcbd66c12bf0dc53de1ad)

  In the 2.0 release of Fluid, the concrete class implementations for DDSes were hidden from Fluid's API surface.
  This made `instanceof` checks fail to work correctly.
  There were ways to work around this in application code, but they involved boilerplate which required more understanding of Fluid internals than should be necessary.

  There is now a drop-in replacement to `instanceof`: the static `.is()` method to `SharedObjectKind`, which is available
  on all DDSes.
  For example:

  ```typescript
  // Works in Fluid Framework 1.0 but not in the initial release of Fluid Framework 2.0:
  if (myObject instanceof SharedString) {
    // do something
  }

  // In Fluid Framework 2.0 and beyond, that code can now be written like so:
  if (SharedString.is(myObject)) {
    // do something
  }
  ```

## 2.0.0-rc.5.0.0

### Minor Changes

- fluid-framework: Type Erase ISharedObjectKind ([#21081](https://github.com/microsoft/FluidFramework/pull/21081)) [78f228e370](https://github.com/microsoft/FluidFramework/commit/78f228e37055bd4d9a8f02b3a1eefebf4da9c59c)

  A new type, `SharedObjectKind` is added as a type erased version of `ISharedObjectKind` and `DataObjectClass`.

  This type fills the role of both `ISharedObjectKind` and `DataObjectClass` in the `@public` "declarative API" exposed in the `fluid-framework` package.

  This allows several types referenced by `ISharedObjectKind` to be made `@alpha` as they should only need to be used by legacy code and users of the unstable/alpha/legacy "encapsulated API".

  Access to these now less public types should not be required for users of the `@public` "declarative API" exposed in the `fluid-framework` package, but can still be accessed for those who need them under the `/legacy` import paths.
  The full list of such types is:

  - `SharedTree` as exported from `@fluidframwork/tree`: It is still exported as `@public` from `fluid-framework` as `SharedObjectKind`.
  - `ISharedObjectKind`: See new `SharedObjectKind` type for use in `@public` APIs.
    `ISharedObject`
  - `IChannel`
  - `IChannelAttributes`
  - `IChannelFactory`
  - `IExperimentalIncrementalSummaryContext`
  - `IGarbageCollectionData`
  - `ISummaryStats`
  - `ISummaryTreeWithStats`
  - `ITelemetryContext`
  - `IDeltaManagerErased`
  - `IFluidDataStoreRuntimeEvents`
  - `IFluidHandleContext`
  - `IProvideFluidHandleContext`

  Removed APIs:

  - `DataObjectClass`: Usages replaced with `SharedObjectKind`.
  - `LoadableObjectClass`: Replaced with `SharedObjectKind`.
  - `LoadableObjectClassRecord`: Replaced with `Record<string, SharedObjectKind>`.
  -

- Update to TypeScript 5.4 ([#21214](https://github.com/microsoft/FluidFramework/pull/21214)) [0e6256c722](https://github.com/microsoft/FluidFramework/commit/0e6256c722d8bf024f4325bf02547daeeb18bfa6)

  Update package implementations to use TypeScript 5.4.5.

- fluid-framework: Remove several types from `@public` scope ([#21142](https://github.com/microsoft/FluidFramework/pull/21142)) [983e9f09f7](https://github.com/microsoft/FluidFramework/commit/983e9f09f7b10fef9ffa1e9af86166f0ccda7e14)

  The following types have been moved from `@public` to `@alpha`:

  - `IFluidSerializer`
  - `ISharedObjectEvents`
  - `IChannelServices`
  - `IChannelStorageService`
  - `IDeltaConnection`
  - `IDeltaHandler`

  These should not be needed by users of the declarative API, which is what `@public` is targeting.

## 2.0.0-rc.4.0.0

### Minor Changes

- Deprecated members of IFluidHandle are split off into new IFluidHandleInternal interface [96872186d0](https://github.com/microsoft/FluidFramework/commit/96872186d0d0f245c1fece7d19b3743e501679b6)

  Split IFluidHandle into two interfaces, `IFluidHandle` and `IFluidHandleInternal`.
  Code depending on the previously deprecated members of IFluidHandle can access them by using `toFluidHandleInternal` from `@fluidframework/runtime-utils/legacy`.

  External implementation of the `IFluidHandle` interface are not supported: this change makes the typing better convey this using the `ErasedType` pattern.
  Any existing and previously working, and now broken, external implementations of `IFluidHandle` should still work at runtime, but will need some unsafe type casts to compile.
  Such handle implementation may break in the future and thus should be replaced with use of handles produced by the Fluid Framework client packages.

## 2.0.0-rc.3.0.0

### Major Changes

- Packages now use package.json "exports" and require modern module resolution [97d68aa06b](https://github.com/microsoft/FluidFramework/commit/97d68aa06bd5c022ecb026655814aea222a062ae)

  Fluid Framework packages have been updated to use the [package.json "exports"
  field](https://nodejs.org/docs/latest-v18.x/api/packages.html#exports) to define explicit entry points for both
  TypeScript types and implementation code.

  This means that using Fluid Framework packages require the following TypeScript settings in tsconfig.json:

  - `"moduleResolution": "Node16"` with `"module": "Node16"`
  - `"moduleResolution": "Bundler"` with `"module": "ESNext"`

  We recommend using Node16/Node16 unless absolutely necessary. That will produce transpiled JavaScript that is suitable
  for use with modern versions of Node.js _and_ Bundlers.
  [See the TypeScript documentation](https://www.typescriptlang.org/tsconfig#moduleResolution) for more information
  regarding the module and moduleResolution options.

  **Node10 moduleResolution is not supported; it does not support Fluid Framework's API structuring pattern that is used
  to distinguish stable APIs from those that are in development.**

### Minor Changes

- fluid-framework: Replace SharedObjectClass with new ISharedObjectKind type. [97d68aa06b](https://github.com/microsoft/FluidFramework/commit/97d68aa06bd5c022ecb026655814aea222a062ae)

  The static objects used as SharedObjectClass now explicitly implement the new ISharedObjectKind type.
  SharedObjectClass has been removed as ISharedObjectKind now fills that role.
  LoadableObjectCtor has been inlined as it only had one use: an external user of it can replace it with `(new (...args: any[]) => T)`.

## 2.0.0-rc.2.0.0

### Minor Changes

- fluid-framework: SharedObject classes are no longer exported as public ([#19717](https://github.com/microsoft/FluidFramework/issues/19717)) [ae1d0be26d](https://github.com/microsoft/FluidFramework/commits/ae1d0be26d61453cff316b3f622a9f3647149167)

  `SharedObject` and `SharedObjectCore` are intended for authoring DDSes, and thus are only intended for use within the Fluid Framework client packages.
  They is no longer publicly exported: any users should fine their own solution or be upstreamed.
  `SharedObject` and `SharedObjectCore` are available for now as `@alpha` to make this migration less disrupting for any existing users.

## 2.0.0-rc.1.0.0

### Minor Changes

- Updated server dependencies ([#19122](https://github.com/microsoft/FluidFramework/issues/19122)) [25366b4229](https://github.com/microsoft/FluidFramework/commits/25366b422918cb43685c5f328b50450749592902)

  The following Fluid server dependencies have been updated to the latest version, 3.0.0. [See the full changelog.](https://github.com/microsoft/FluidFramework/releases/tag/server_v3.0.0)

  - @fluidframework/gitresources
  - @fluidframework/server-kafka-orderer
  - @fluidframework/server-lambdas
  - @fluidframework/server-lambdas-driver
  - @fluidframework/server-local-server
  - @fluidframework/server-memory-orderer
  - @fluidframework/protocol-base
  - @fluidframework/server-routerlicious
  - @fluidframework/server-routerlicious-base
  - @fluidframework/server-services
  - @fluidframework/server-services-client
  - @fluidframework/server-services-core
  - @fluidframework/server-services-ordering-kafkanode
  - @fluidframework/server-services-ordering-rdkafka
  - @fluidframework/server-services-ordering-zookeeper
  - @fluidframework/server-services-shared
  - @fluidframework/server-services-telemetry
  - @fluidframework/server-services-utils
  - @fluidframework/server-test-utils
  - tinylicious

- Updated @fluidframework/protocol-definitions ([#19122](https://github.com/microsoft/FluidFramework/issues/19122)) [25366b4229](https://github.com/microsoft/FluidFramework/commits/25366b422918cb43685c5f328b50450749592902)

  The @fluidframework/protocol-definitions dependency has been upgraded to v3.1.0. [See the full
  changelog.](https://github.com/microsoft/FluidFramework/blob/main/common/lib/protocol-definitions/CHANGELOG.md#310)

- shared-object-base: SharedObject processGCDataCore now takes IFluidSerializer rather than SummarySerializer ([#18803](https://github.com/microsoft/FluidFramework/issues/18803)) [396b8e9738](https://github.com/microsoft/FluidFramework/commits/396b8e9738156ff88b62424a0076f09fb5028a32)

  This change should be a no-op for consumers, and `SummarySerializer` and `IFluidSerializer` expose the same consumer facing APIs. This change just makes our APIs more consistent by only using interfaces, rather than a mix of interfaces and concrete implementations.

## 2.0.0-internal.8.0.0

Dependency updates only.

## 2.0.0-internal.7.4.0

Dependency updates only.

## 2.0.0-internal.7.3.0

Dependency updates only.

## 2.0.0-internal.7.2.0

Dependency updates only.

## 2.0.0-internal.7.1.0

Dependency updates only.

## 2.0.0-internal.7.0.0

### Major Changes

- Dependencies on @fluidframework/protocol-definitions package updated to 3.0.0 [871b3493dd](https://github.com/microsoft/FluidFramework/commits/871b3493dd0d7ea3a89be64998ceb6cb9021a04e)

  This included the following changes from the protocol-definitions release:

  - Updating signal interfaces for some planned improvements. The intention is split the interface between signals
    submitted by clients to the server and the resulting signals sent from the server to clients.
    - A new optional type member is available on the ISignalMessage interface and a new ISentSignalMessage interface has
      been added, which will be the typing for signals sent from the client to the server. Both extend a new
      ISignalMessageBase interface that contains common members.
  - The @fluidframework/common-definitions package dependency has been updated to version 1.0.0.

- Server upgrade: dependencies on Fluid server packages updated to 2.0.1 [871b3493dd](https://github.com/microsoft/FluidFramework/commits/871b3493dd0d7ea3a89be64998ceb6cb9021a04e)

  Dependencies on the following Fluid server package have been updated to version 2.0.1:

  - @fluidframework/gitresources: 2.0.1
  - @fluidframework/server-kafka-orderer: 2.0.1
  - @fluidframework/server-lambdas: 2.0.1
  - @fluidframework/server-lambdas-driver: 2.0.1
  - @fluidframework/server-local-server: 2.0.1
  - @fluidframework/server-memory-orderer: 2.0.1
  - @fluidframework/protocol-base: 2.0.1
  - @fluidframework/server-routerlicious: 2.0.1
  - @fluidframework/server-routerlicious-base: 2.0.1
  - @fluidframework/server-services: 2.0.1
  - @fluidframework/server-services-client: 2.0.1
  - @fluidframework/server-services-core: 2.0.1
  - @fluidframework/server-services-ordering-kafkanode: 2.0.1
  - @fluidframework/server-services-ordering-rdkafka: 2.0.1
  - @fluidframework/server-services-ordering-zookeeper: 2.0.1
  - @fluidframework/server-services-shared: 2.0.1
  - @fluidframework/server-services-telemetry: 2.0.1
  - @fluidframework/server-services-utils: 2.0.1
  - @fluidframework/server-test-utils: 2.0.1
  - tinylicious: 2.0.1

- Minimum TypeScript version now 5.1.6 [871b3493dd](https://github.com/microsoft/FluidFramework/commits/871b3493dd0d7ea3a89be64998ceb6cb9021a04e)

  The minimum supported TypeScript version for Fluid 2.0 clients is now 5.1.6.

## 2.0.0-internal.6.4.0

### Minor Changes

- Some stack traces are improved ([#17380](https://github.com/microsoft/FluidFramework/issues/17380)) [34f2808ee9](https://github.com/microsoft/FluidFramework/commits/34f2808ee9764aef21b990f8b48860d9e3ce27a5)

  Some stack traces have been improved and might now include frames for async functions that weren't previously included.

## 2.0.0-internal.6.3.0

Dependency updates only.

## 2.0.0-internal.6.2.0

### Minor Changes

- Remove use of @fluidframework/common-definitions ([#16638](https://github.com/microsoft/FluidFramework/issues/16638)) [a8c81509c9](https://github.com/microsoft/FluidFramework/commits/a8c81509c9bf09cfb2092ebcf7265205f9eb6dbf)

  The **@fluidframework/common-definitions** package is being deprecated, so the following interfaces and types are now
  imported from the **@fluidframework/core-interfaces** package:

  - interface IDisposable
  - interface IErrorEvent
  - interface IErrorEvent
  - interface IEvent
  - interface IEventProvider
  - interface ILoggingError
  - interface ITaggedTelemetryPropertyType
  - interface ITelemetryBaseEvent
  - interface ITelemetryBaseLogger
  - interface ITelemetryErrorEvent
  - interface ITelemetryGenericEvent
  - interface ITelemetryLogger
  - interface ITelemetryPerformanceEvent
  - interface ITelemetryProperties
  - type ExtendEventProvider
  - type IEventThisPlaceHolder
  - type IEventTransformer
  - type ReplaceIEventThisPlaceHolder
  - type ReplaceIEventThisPlaceHolder
  - type TelemetryEventCategory
  - type TelemetryEventPropertyType

## 2.0.0-internal.6.1.0

Dependency updates only.

## 2.0.0-internal.6.0.0

### Major Changes

- Upgraded typescript transpilation target to ES2020 [8abce8cdb4](https://github.com/microsoft/FluidFramework/commits/8abce8cdb4e2832fb6405fb44e393bef03d5648a)

  Upgraded typescript transpilation target to ES2020. This is done in order to decrease the bundle sizes of Fluid Framework packages. This has provided size improvements across the board for ex. Loader, Driver, Runtime etc. Reduced bundle sizes helps to load lesser code in apps and hence also helps to improve the perf.If any app wants to target any older versions of browsers with which this target version is not compatible, then they can use packages like babel to transpile to a older target.

## 2.0.0-internal.5.4.0

Dependency updates only.

## 2.0.0-internal.5.3.0

Dependency updates only.

## 2.0.0-internal.5.2.0

Dependency updates only.

## 2.0.0-internal.5.1.0

Dependency updates only.

## 2.0.0-internal.5.0.0

Dependency updates only.

## 2.0.0-internal.4.4.0

Dependency updates only.

## 2.0.0-internal.4.1.0

Dependency updates only.
