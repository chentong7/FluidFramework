# @fluidframework/datastore

## 2.51.0

Dependency updates only.

## 2.50.0

### Minor Changes

- IFluidHandleInternal.bind (deprecated) has been removed ([#24974](https://github.com/microsoft/FluidFramework/pull/24974)) [07e183795f](https://github.com/microsoft/FluidFramework/commit/07e183795fa8118fae717c118ab7a7945ac1ad57)

  `IFluidHandleInternal.bind` was deprecated in 2.40 and has now been removed. See [release notes entry](https://github.com/microsoft/FluidFramework/releases/tag/client_v2.40.0#user-content-ifluidhandleinternalbind-has-been-deprecated-24553) for more details.

## 2.43.0

Dependency updates only.

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

### Minor Changes

- Shorter IDs for DataStores and DDSes ([#24350](https://github.com/microsoft/FluidFramework/pull/24350)) [fe924a173b](https://github.com/microsoft/FluidFramework/commit/fe924a173b71abd96ba76da787eec3b4c077d32b)

  Fluid Framework will now use shorter IDs for Datastores and DDSes when `enableRuntimeIdCompressor:"on"` is set in `IContainerRuntimeOptions`. This change should help reduce summary and snapshot sizes as well as improve runtime performance because of a smaller memory footprint.

## 2.31.0

### Minor Changes

- New ILayerCompatDetails property on FluidDataStoreRuntime, MockFluidDataStoreContext and MockFluidDataStoreRuntime ([#24166](https://github.com/microsoft/FluidFramework/pull/24166)) [fac75c8258](https://github.com/microsoft/FluidFramework/commit/fac75c8258c979a6b15a70b9cf84df09f62b3e93)

  A new optional property, `ILayerCompatDetails`, has been added to `FluidDataStoreRuntime`. This property is used by
  `FluidDataStoreContext` in the Runtime layer to validate that the Runtime and DataStore layers are compatible.

  `ILayerCompatDetails` has also been added to `MockFluidDataStoreRuntime` and `MockFluidDataStoreContext` which are used for
  testing.

  Important: this property is intended for use by Fluid Framework code only. No code outside the Fluid Framework should use or depend on this property in any way.

## 2.30.0

### Minor Changes

- The process and processDocumentSchemaOp functions have been removed ([#24018](https://github.com/microsoft/FluidFramework/pull/24018)) [bc35d543d5](https://github.com/microsoft/FluidFramework/commit/bc35d543d58c7e4bf28944b09d645cc26bf28a29)

  `process` has been replaced by `processMessages` from the following:

  - `FluidDataStoreRuntime`
  - `IDeltaHandler`
  - `IFluidDataStoreChannel`
  - `MockFluidDataStoreRuntime`
  - `MockDeltaConnection`

  `processDocumentSchemaOp` has been replaced by `processDocumentSchemaMessages` from `DocumentsSchemaController`.

  See the [deprecation release note](https://github.com/microsoft/FluidFramework/releases/tag/client_v2.5.0#user-content-the-process-function-on-ifluiddatastorechannel-ideltahandler-mockfluiddatastoreruntime-and-mockdeltaconnection-is-now-deprecated-22840) for more details.

## 2.23.0

### Minor Changes

- The FluidDataStoreRuntime.process function is now deprecated ([#23866](https://github.com/microsoft/FluidFramework/pull/23866)) [3f44d43e985](https://github.com/microsoft/FluidFramework/commit/3f44d43e985fea02ea349d024d3ae5d85f7eddd6)

  A new function `processMessages` has been added in place of `process`. The new function will be called to process multiple messages instead of a single one on the data store runtime. This is part of a feature called "op bunching" where contiguous ops of a given type and to a given data store / DDS are bunched and sent together for processing.

  Note that `process` may still be called in scenarios where this data store runtime (Datastore layer) is running with an older version of data store context (Runtime layer) in the same client. This is to support Fluid layer compatibility.

## 2.22.0

Dependency updates only.

## 2.21.0

Dependency updates only.

## 2.20.0

### Minor Changes

- The createDataStoreWithProps APIs on ContainerRuntime and IContainerRuntimeBase have been removed ([#22996](https://github.com/microsoft/FluidFramework/pull/22996)) [bd243fb292](https://github.com/microsoft/FluidFramework/commit/bd243fb2927915d87c42486e21ee0c990962a9a7)

  `ContainerRuntime.createDataStoreWithProps` and `IContainerRuntimeBase.createDataStoreWithProps`
  were [deprecated in version 0.25.0](https://github.com/microsoft/FluidFramework/blob/main/BREAKING.md#icontainerruntimebase_createdatastorewithprops-is-removed) and have been removed.

  Replace uses of these APIs with `PureDataObjectFactory.createInstanceWithDataStore` and pass in props via the `initialState`
  parameter.

  These changes were originally announced in version 0.25.0. See the following issues for more details:

  - [#1537](https://github.com/microsoft/FluidFramework/issues/1537)
  - [#2931](https://github.com/microsoft/FluidFramework/pull/2931)

## 2.13.0

Dependency updates only.

## 2.12.0

Dependency updates only.

## 2.11.0

Dependency updates only.

## 2.10.0

### Minor Changes

- The inbound and outbound properties have been removed from IDeltaManager ([#22282](https://github.com/microsoft/FluidFramework/pull/22282)) [45a57693f2](https://github.com/microsoft/FluidFramework/commit/45a57693f291e0dc5e91af7f29a9b9c8f82dfad5)

  The inbound and outbound properties were [deprecated in version 2.0.0-rc.2.0.0](https://github.com/microsoft/FluidFramework/blob/main/RELEASE_NOTES/2.0.0-rc.2.0.0.md#container-definitions-deprecate-ideltamanagerinbound-and-ideltamanageroutbound) and have been removed from `IDeltaManager`.

  `IDeltaManager.inbound` contained functionality that could break core runtime features such as summarization and processing batches if used improperly. Data loss or corruption could occur when `IDeltaManger.inbound.pause()` or `IDeltaManager.inbound.resume()` were called.

  Similarly, `IDeltaManager.outbound` contained functionality that could break core runtime features such as generation of batches and chunking. Data loss or corruption could occur when `IDeltaManger.inbound.pause()` or `IDeltaManager.inbound.resume()` were called.

  #### Alternatives

  - Alternatives to `IDeltaManager.inbound.on("op", ...)` are `IDeltaManager.on("op", ...)`
  - Alternatives to calling `IDeltaManager.inbound.pause`, `IDeltaManager.outbound.pause` for `IContainer` disconnect use `IContainer.disconnect`.
  - Alternatives to calling `IDeltaManager.inbound.resume`, `IDeltaManager.outbound.resume` for `IContainer` reconnect use `IContainer.connect`.

## 2.5.0

Dependency updates only.

## 2.4.0

Dependency updates only.

## 2.3.0

Dependency updates only.

## 2.2.0

Dependency updates only.

## 2.1.0

Dependency updates only.

## 2.0.0-rc.5.0.0

### Minor Changes

- Update to TypeScript 5.4 ([#21214](https://github.com/microsoft/FluidFramework/pull/21214)) [0e6256c722](https://github.com/microsoft/FluidFramework/commit/0e6256c722d8bf024f4325bf02547daeeb18bfa6)

  Update package implementations to use TypeScript 5.4.5.

## 2.0.0-rc.4.0.0

### Minor Changes

- Type Erase IFluidDataStoreRuntime.deltaManager [96872186d0](https://github.com/microsoft/FluidFramework/commit/96872186d0d0f245c1fece7d19b3743e501679b6)

  Make IFluidDataStoreRuntime.deltaManager have an opaque type.
  Marks the following types which were reachable from it as alpha:

  - IConnectionDetails
  - IDeltaSender
  - IDeltaManagerEvents
  - IDeltaManager
  - IDeltaQueueEvents
  - IDeltaQueue
  - ReadOnlyInfo

  As a temporary workaround, users needing access to the full delta manager API can use the `@alpha` `toDeltaManagerInternal` API to retrieve its members, but should migrate away from requiring access to those APIs.

  Implementing a custom `IFluidDataStoreRuntime` is not supported: this is now indicated by it being marked with `@sealed`.

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

## 2.0.0-rc.2.0.0

### Minor Changes

- container-runtime: New feature: ID compression for DataStores & DDSs ([#19859](https://github.com/microsoft/FluidFramework/issues/19859)) [51f0d3db73](https://github.com/microsoft/FluidFramework/commits/51f0d3db737800e1c30ea5e3952d38ff30ffc7da)

  ### Key changes

  1. A new API IContainerRuntimeBase.generateDocumentUniqueId() is exposed. This API will opportunistically generate IDs in short format (non-negative numbers). If it can't achieve that, it will return UUID strings. UUIDs generated will have low entropy in groups and will compress well. It can be leveraged anywhere in container where container unique IDs are required. I.e. any place that uses uuid() and stores data in container is likely candidate to start leveraging this API.
  2. Data store internal IDs (IDs that are auto generated by FF system) will opportunistically be generated in shorter form. Data stores created in detached container will always have short IDs, data stores created in attached container will opportunistically be short (by using newly added IContainerRuntimeBase.generateDocumentUniqueId() capability)
  3. Similar DDS names will be opportunistically short (same considerations for detached DDS vs. attached DDS)

  ### Implementation details

  1. Container level ID Compressor can now be enabled with delay. With such setting, only new IContainerRuntimeBase.generateDocumentUniqueId() is exposed (ID Compressor is not exposed in such case, as leveraging any of its other capabilities requires future container sessions to load ID Compressor on container load, for correctness reasons). Once Container establishes connection and any changes are made in container, newly added API will start generating more compact IDs (in most cases).

  ### Breaking changes

  1. DDS names can no longer start with "\_" symbol - this is reserved for FF needs. I've validated that's not an issue for AzureClient (it only creates root object by name, everything else is referred by handle). Our main internal partners almost never use named DDSs (I can find only 4 instances in Loop).

  ### Backward compatibility considerations

  1. Data store internal IDs could collide with earlier used names data stores. Earlier versions of FF framework (before DataStore aliasing feature was added) allowed customers to supply IDs for data stores. And thus, files created with earlier versions of framework could have data store IDs that will be similar to names FF will use for newly created data stores ("A", ... "Z", "a"..."z", "AA", etc.). While such collision is possible, it's very unlikely (almost impossible) if user-provided names were at least 4-5 characters long.
  2. If application runs to these problems, or wants to reduce risks, consider disabling ID compressor via IContainerRuntimeOptions.enableRuntimeIdCompressor = "off".

  ### Minor changes

  1. IContainerRuntime.createDetachedRootDataStore() is removed. Please use IContainerRuntime.createDetachedDataStore and IDataStore.trySetAlias() instead
  2. IContainerRuntimeOptions.enableRuntimeIdCompressor has been changes from boolean to tri-state.

- Deprecated error-related enums have been removed ([#19067](https://github.com/microsoft/FluidFramework/issues/19067)) [59793302e5](https://github.com/microsoft/FluidFramework/commits/59793302e56784cfb6ace0e6469345f3565b3312)

  Error-related enums `ContainerErrorType`, `DriverErrorType`, `OdspErrorType` and `RouterliciousErrorType` were previously
  deprecated and are now removed. There are replacement object-based enumerations of `ContainerErrorTypes`,
  `DriverErrorTypes`, `OdspErrorTypes` and `RouterliciousErrorTypes`. Refer to the release notes of [Fluid Framework version
  2.0.0-internal.7.0.0](https://github.com/microsoft/FluidFramework/releases/tag/client_v2.0.0-internal.7.0.0) for details
  on the replacements.

- container-definitions: ILoaderOptions no longer accepts arbitrary key/value pairs ([#19306](https://github.com/microsoft/FluidFramework/issues/19306)) [741926e225](https://github.com/microsoft/FluidFramework/commits/741926e2253a161504ecc6a6451d8f15d7ac4ed6)

  ILoaderOptions has been narrowed to the specific set of supported loader options, and may no longer be used to pass arbitrary key/value pairs through to the runtime.

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

## 2.0.0-internal.8.0.0

### Major Changes

- datastore: Removed `FluidDataStoreRuntime.load(...)` [9a451d4946](https://github.com/microsoft/FluidFramework/commits/9a451d4946b5c51a52e4d1ab5bf51e7b285b0d74)

  The static method `FluidDataStoreRuntime.load(...)` has been removed. Please migrate all usage of this method to
  `FluidDataStoreRuntime` constructor.

- container-definitions: Fix ISnapshotTreeWithBlobContents and mark internal [9a451d4946](https://github.com/microsoft/FluidFramework/commits/9a451d4946b5c51a52e4d1ab5bf51e7b285b0d74)

  `ISnapshotTreeWithBlobContents` is an internal type that should not be used externally. Additionally, the type didn't
  match the usage, specifically in runtime-utils where an `any` cast was used to work around undefined blobContents. The
  type has been updated to reflect that blobContents can be undefined.

- runtime-definitions: Removed IFluidRouter from IFluidDataStoreChannel and FluidDataStoreRuntime [9a451d4946](https://github.com/microsoft/FluidFramework/commits/9a451d4946b5c51a52e4d1ab5bf51e7b285b0d74)

  The `IFluidRouter` property has been removed from `IFluidDataStoreChannel` and `FluidDataStoreRuntime`. Please migrate
  all usage to the `IFluidDataStoreChannel.entryPoint` API.

  See
  [Removing-IFluidRouter.md](https://github.com/microsoft/FluidFramework/blob/main/packages/common/core-interfaces/Removing-IFluidRouter.md)
  for more details.

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

- runtime-definitions: `bindToContext` API removed [871b3493dd](https://github.com/microsoft/FluidFramework/commits/871b3493dd0d7ea3a89be64998ceb6cb9021a04e)

  `bindToContext` has been removed from `FluidDataStoreRuntime`, `IFluidDataStoreContext` and
  `MockFluidDataStoreContext`. This has been deprecated for several releases and cannot be used anymore.

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

- test-utils: provideEntryPoint is required [871b3493dd](https://github.com/microsoft/FluidFramework/commits/871b3493dd0d7ea3a89be64998ceb6cb9021a04e)

  The optional `provideEntryPoint` method has become required on a number of constructors. A value will need to be provided to the following classes:

  - `BaseContainerRuntimeFactory`
  - `RuntimeFactory`
  - `ContainerRuntime` (constructor and `loadRuntime`)
  - `FluidDataStoreRuntime`

  See [testContainerRuntimeFactoryWithDefaultDataStore.ts](https://github.com/microsoft/FluidFramework/tree/main/packages/test/test-utils/src/testContainerRuntimeFactoryWithDefaultDataStore.ts) for an example implemtation of `provideEntryPoint` for ContainerRuntime.
  See [pureDataObjectFactory.ts](https://github.com/microsoft/FluidFramework/tree/main/packages/framework/aqueduct/src/data-object-factories/pureDataObjectFactory.ts#L83) for an example implementation of `provideEntryPoint` for DataStoreRuntime.

  Subsequently, various `entryPoint` and `getEntryPoint()` endpoints have become required. Please see [containerRuntime.ts](https://github.com/microsoft/FluidFramework/tree/main/packages/runtime/container-runtime/src/containerRuntime.ts) for example implementations of these APIs.

  For more details, see [Removing-IFluidRouter.md](https://github.com/microsoft/FluidFramework/blob/main/packages/common/core-interfaces/Removing-IFluidRouter.md)

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

- Request APIs deprecated from many places [8abce8cdb4](https://github.com/microsoft/FluidFramework/commits/8abce8cdb4e2832fb6405fb44e393bef03d5648a)

  The `request` API (associated with the `IFluidRouter` interface) has been deprecated on a number of classes and interfaces. The following are impacted:

  - `IRuntime` and `ContainerRuntime`
  - `IFluidDataStoreRuntime` and `FluidDataStoreRuntime`
  - `IFluidDataStoreChannel`
  - `MockFluidDataStoreRuntime`
  - `TestFluidObject`

  Please migrate usage to the corresponding `entryPoint` or `getEntryPoint()` of the object. The value for these "entryPoint" related APIs is determined from factories (for `IRuntime` and `IFluidDataStoreRuntime`) via the `initializeEntryPoint` method. If no method is passed to the factory, the corresponding `entryPoint` and `getEntryPoint()` will be undefined.

  For an example implementation of `initializeEntryPoint`, see [pureDataObjectFactory.ts](https://github.com/microsoft/FluidFramework/blob/next/packages/framework/aqueduct/src/data-object-factories/pureDataObjectFactory.ts#L84).

  More information of the migration off the request pattern, and current status of its removal, is documented in [Removing-IFluidRouter.md](https://github.com/microsoft/FluidFramework/blob/main/packages/common/core-interfaces/Removing-IFluidRouter.md).

- `initializeEntryPoint` will become required [8abce8cdb4](https://github.com/microsoft/FluidFramework/commits/8abce8cdb4e2832fb6405fb44e393bef03d5648a)

  The optional `initializeEntryPoint` method has been added to a number of constructors. **This method argument will become required in an upcoming release** and a value will need to be provided to the following classes:

  - `BaseContainerRuntimeFactory`
  - `ContainerRuntimeFactoryWithDefaultDataStore`
  - `RuntimeFactory`
  - `ContainerRuntime` (constructor and `loadRuntime`)
  - `FluidDataStoreRuntime`

  For an example implementation of `initializeEntryPoint`, see [pureDataObjectFactory.ts](https://github.com/microsoft/FluidFramework/blob/main/packages/framework/aqueduct/src/data-object-factories/pureDataObjectFactory.ts#L84).

  This work will replace the request pattern. See [Removing-IFluidRouter.md](https://github.com/microsoft/FluidFramework/blob/main/packages/common/core-interfaces/Removing-IFluidRouter.md) for more info on this effort.

- FluidDataStoreRuntime.getChannel throws for channels that do not exist [8abce8cdb4](https://github.com/microsoft/FluidFramework/commits/8abce8cdb4e2832fb6405fb44e393bef03d5648a)

  Previously, calling `FluidDataStoreRuntime.getChannel(id)` for a channel that does not exist would wait for the channel to be created (possibly waiting indefinitely if never created). However, there is no safe means to dynamically create a channel in this manner without risking data corruption. The call will instead now throw for non-existent channels.

- Upgraded typescript transpilation target to ES2020 [8abce8cdb4](https://github.com/microsoft/FluidFramework/commits/8abce8cdb4e2832fb6405fb44e393bef03d5648a)

  Upgraded typescript transpilation target to ES2020. This is done in order to decrease the bundle sizes of Fluid Framework packages. This has provided size improvements across the board for ex. Loader, Driver, Runtime etc. Reduced bundle sizes helps to load lesser code in apps and hence also helps to improve the perf.If any app wants to target any older versions of browsers with which this target version is not compatible, then they can use packages like babel to transpile to a older target.

- IDeltaManager members disposed and dispose() removed [8abce8cdb4](https://github.com/microsoft/FluidFramework/commits/8abce8cdb4e2832fb6405fb44e393bef03d5648a)

  IDeltaManager members disposed and dispose() were deprecated in 2.0.0-internal.5.3.0 and have now been removed.

## 2.0.0-internal.5.4.0

Dependency updates only.

## 2.0.0-internal.5.3.0

Dependency updates only.

## 2.0.0-internal.5.2.0

Dependency updates only.

## 2.0.0-internal.5.1.0

Dependency updates only.

## 2.0.0-internal.5.0.0

### Major Changes

- The `@fluidframework/garbage-collector` package was deprecated in version 2.0.0-internal.4.1.0. [8b242fdc79](https://github.com/microsoft/FluidFramework/commits/8b242fdc796714cf1da9ad3f90d02efb122af0c2)
  It has now been removed with the following functions, interfaces, and types in it.

  - `cloneGCData`
  - `concatGarbageCollectionData`
  - `concatGarbageCollectionStates`
  - `GCDataBuilder`
  - `getGCDataFromSnapshot`
  - `IGCResult`
  - `removeRouteFromAllNodes`
  - `runGarbageCollection`
  - `trimLeadingAndTrailingSlashes`
  - `trimLeadingSlashes`
  - `trimTrailingSlashes`
  - `unpackChildNodesGCDetails`
  - `unpackChildNodesUsedRoutes`

## 2.0.0-internal.4.4.0

Dependency updates only.

## 2.0.0-internal.4.1.0

### Minor Changes

- GC interfaces removed from runtime-definitions ([#14750](https://github.com/microsoft/FluidFramework/pull-requests/14750)) [60274eacab](https://github.com/microsoft/FluidFramework/commits/60274eacabf14d42f52f6ad1c2f64356e64ba1a2)

  The following interfaces available in `@fluidframework/runtime-definitions` are internal implementation details and have been deprecated for public use. They will be removed in an upcoming release.

  - `IGarbageCollectionNodeData`
  - `IGarbageCollectionState`
  - `IGarbageCollectionSnapshotData`
  - `IGarbageCollectionSummaryDetailsLegacy`

- @fluidframework/garbage-collector deprecated ([#14750](https://github.com/microsoft/FluidFramework/pull-requests/14750)) [60274eacab](https://github.com/microsoft/FluidFramework/commits/60274eacabf14d42f52f6ad1c2f64356e64ba1a2)

  The `@fluidframework/garbage-collector` package is deprecated with the following functions, interfaces, and types in it.
  These are internal implementation details and have been deprecated for public use. They will be removed in an upcoming
  release.

  - `cloneGCData`
  - `concatGarbageCollectionData`
  - `concatGarbageCollectionStates`
  - `GCDataBuilder`
  - `getGCDataFromSnapshot`
  - `IGCResult`
  - `removeRouteFromAllNodes`
  - `runGarbageCollection`
  - `trimLeadingAndTrailingSlashes`
  - `trimLeadingSlashes`
  - `trimTrailingSlashes`
  - `unpackChildNodesGCDetails`
  - `unpackChildNodesUsedRoutes`
