# fluid-framework

## 2.51.0

### Minor Changes

- Fix adaptEnum's handling of numeric enums ([#24957](https://github.com/microsoft/FluidFramework/pull/24957)) [7535d31fa61](https://github.com/microsoft/FluidFramework/commit/7535d31fa61a535bf58bb88fc597e6e4f64c5b23)

  Enum entries whose values are numeric get additional properties on TypeScript's generated Enum object.
  These values were getting treated like enum entries at runtime by `adaptEnum` (`@beta`).
  This has been fixed and the runtime behavior now matches the types in this case.

  If any documents were created with this API which were impacted by this bug and keeping them openable is required, they will need a workaround.
  Impacted schema using the union from `adaptEnum` can need to be updated to explicitly include the previously erroneously generated schema.

  Before:

  ```typescript
  enum Mode {
    a = 1,
  }
  const ModeNodes = adaptEnum(schemaFactory, Mode);
  const union = ModeNodes.schema;
  ```

  After:

  ```typescript
  enum Mode {
    a = 1,
  }
  const ModeNodes = adaptEnum(schemaFactory, Mode);
  // Bugged version of adaptEnum used to include this: it should not be used but must be included in the schema for legacy document compatibility.
  class Workaround extends schemaFactory.object("a", {}) {}
  const union = [...ModeNodes.schema, Workaround] as const;
  ```

  To help detect when schema contain unexpected content, and to ensure workarounds like this are implemented properly, applications should include tests which check the schema for compatibility.
  See [tree-cli-app's schema tests](https://github.com/microsoft/FluidFramework/blob/main/examples/apps/tree-cli-app/src/test/schema.spec.ts) for an example of how to do this.

  The schema returned by `adaptEnum` have also been updated to `toString` to include the value of the particular enum entry: this has no effect on the nodes, just the schema.

- Make POJO mode TreeArrayNodes report the array constructor as their constructor ([#24988](https://github.com/microsoft/FluidFramework/pull/24988)) [7b4d0abe90f](https://github.com/microsoft/FluidFramework/commit/7b4d0abe90f50075bb06ef73ceceff2529ef78f5)

  Make POJO mode TreeArrayNode's inherited `constructor` property report `Array` instead of the `TreeNodeSchema` class.
  This is necessary to make `TreeArrayNode`s appear equal to arrays according to NodeJS's `assert.strict.deepEqual` in NodeJS 22.

- "rootChanged" event is no longer skipped if first change is setting the root to undefined ([#24994](https://github.com/microsoft/FluidFramework/pull/24994)) [e6f25875794](https://github.com/microsoft/FluidFramework/commit/e6f258757947b72b6a9d19c79f5717eccd44452b)

  A bug has been fixed where [rootChanged](https://fluidframework.com/docs/api/fluid-framework/treeviewevents-interface#rootchanged-methodsignature) would not be fired if the change is the first change since the [TreeView](https://fluidframework.com/docs/api/fluid-framework/treeview-interface) became in-schema, and the change was setting the document root to `undefined`.

## 2.50.0

### Minor Changes

- Record node kind was added (alpha) ([#24908](https://github.com/microsoft/FluidFramework/pull/24908)) [b25667bcdc](https://github.com/microsoft/FluidFramework/commit/b25667bcdcad5584f35783f6a32270803b6dfb1c)

  Adds a new kind of node to SharedTree that models a TypeScript record.
  As is the case with map nodes, record nodes only support string keys.

  ```typescript
  class MyRecord extends schemaFactory.record("my-record", [
    schemaFactory.number,
    schemaFactory.string,
  ]) {}
  const myRecord = new MyRecord({
    foo: 42,
    bar: "Hello world!",
  });

  const foo = myRecord.foo; // 42

  delete myRecord.foo;

  myRecord.baz = 37;

  const keys = Object.keys(myRecord); // ["bar", "baz"]
  const values = Object.values(myRecord); // ["Hello world!", 37]
  const entries = Object.entries(myRecord); // [["bar", "Hello world!"], ["baz", 37]]
  ```

  #### `NodeKind` enum update

  This change includes the addition of a new flag to the [NodeKind](https://fluidframework.com/docs/api/fluid-framework/nodekind-enum) enum.
  This API notes in its documentation that users should not treat its flags as an exhaustive set.

  This change may break code that treats it that way.
  We recommend updating your code to be more tolerant of unknown node kinds going forward.

  Also see alternative options for schema-agnostic tree traversal if needed:

  - [Tree.parent](https://fluidframework.com/docs/api/fluid-framework/treenodeapi-interface#parent-methodsignature)
  - [TreeAlpha.child](https://fluidframework.com/docs/api/fluid-framework/treealpha-interface#child-methodsignature)
  - [TreeAlpha.children](https://fluidframework.com/docs/api/fluid-framework/treealpha-interface#children-methodsignature)

  #### Additional features

  In addition to the operations afforded by TypeScript records, SharedTree record nodes can be iterated (equivalent to Object.entries).

  ```typescript
  class MyRecord extends schemaFactory.record("my-record", [schemaFactory.number, schemaFactory.string]) {}
  const myRecord = new MyRecord({
  	foo: 42,
  	bar: "Hello world!"
  });

  for (const [key, value] of myRecord) {
  	...
  }

  const a = { ...myRecord }; // { foo: 42, bar: "Hello world!" }
  const b = [...myRecord]; // [["foo", 42], ["bar, "Hello world!"]]
  ```

  #### Recursive records

  Recursive record schema can be defined using `recordRecursive` on [SchemaFactoryAlpha](https://fluidframework.com/docs/api/fluid-framework/schemafactoryalpha-class).

  ```typescript
  class MyRecord extends schemaFactory.recordRecursive("my-record", [
    schemaFactory.string,
    () => MyRecord,
  ]) {}
  const myRecord = new MyRecord({
    foo: "Hello world!",
    bar: new MyRecord({
      x: "foo",
      y: new MyRecord({}),
    }),
  });
  ```

  #### TableSchema update (alpha)

  The [TableSchema](https://fluidframework.com/docs/api/fluid-framework/tableschema-namespace/) APIs have been updated to use record nodes in the schema they generate.
  Specifically, the `Row` representation now uses a record to store its column-cell pairs, rather than a map.

  The node types derived from these APIs model their data in a row-major format.
  That is, each row in the table contains the set of cells that belong to that row, where each cell is indexed by its corresponding column.

  Previously, this was modeled using a [MapNode](https://fluidframework.com/docs/api/fluid-framework/treemapnode-interface).
  This format proved cumbersome to interop with popular table rendering libraries like [tanstack](https://tanstack.com/table), which expect a record-like format.

  The persisted format of documents containing trees derived from these APIs is the same, so this change is forward and backward compatible.

  #### JsonDomainSchema update (alpha)

  [JsonObject](https://fluidframework.com/docs/api/fluid-framework/jsonastree-namespace/jsonobject-class) has been updated to a record rather than a map.

  The persisted format of documents containing trees derived from these APIs is the same, so this change is forward and backward compatible.

## 2.43.0

### Minor Changes

- Tree's enum schema utility are now beta ([#24749](https://github.com/microsoft/FluidFramework/pull/24749)) [a23bc9e4d02](https://github.com/microsoft/FluidFramework/commit/a23bc9e4d025f0925d09daadc2952bf0bfacc06b)

  The functions [singletonSchema](https://fluidframework.com/docs/api/tree/#singletonschema-function), [adaptEnum](https://fluidframework.com/docs/api/tree/#adaptenum-function) and [enumFromStrings](https://fluidframework.com/docs/api/tree/#enumfromstrings-function) are now `@beta` instead of `@alpha`.

- Add TreeAlpha.child and TreeAlpha.children APIs for generic tree traversal ([#24723](https://github.com/microsoft/FluidFramework/pull/24723)) [87941b7fa05](https://github.com/microsoft/FluidFramework/commit/87941b7fa0575e030344079a25f65d25d8457367)

  #### TreeAlpha.child

  Access a child node or value of a `TreeNode` by its property key.

  ```typescript
  class MyObject extends schemaFactory.object("MyObject", {
  	foo: schemaFactory.string;
  	bar: schemaFactory.optional(schemaFactory.string);
  }) {}

  const myObject = new MyObject({
  	foo: "Hello world!"
  });

  const foo = TreeAlpha.child(myObject, "foo"); // "Hello world!"
  const bar = TreeAlpha.child(myObject, "bar"); // undefined
  const baz = TreeAlpha.child(myObject, "baz"); // undefined
  ```

  ```typescript
  class MyArray extends schemaFactory.array("MyArray", schemaFactory.string) {}

  const myArray = new MyArray("Hello", "World");

  const child0 = TreeAlpha.child(myArray, 0); // "Hello"
  const child1 = TreeAlpha.child(myArray, 1); // "World
  const child2 = TreeAlpha.child(myArray, 2); // undefined
  ```

  #### TreeAlpha.children

  Get all child nodes / values of a `TreeNode`, keyed by their property keys.

  ```typescript
  class MyObject extends schemaFactory.object("MyObject", {
  	foo: schemaFactory.string;
  	bar: schemaFactory.optional(schemaFactory.string);
  	baz: schemaFactory.optional(schemaFactory.number);
  }) {}

  const myObject = new MyObject({
  	foo: "Hello world!",
  	baz: 42,
  });

  const children = TreeAlpha.children(myObject); // [["foo", "Hello world!"], ["baz", 42]]
  ```

  ```typescript
  class MyArray extends schemaFactory.array("MyArray", schemaFactory.string) {}

  const myArray = new MyArray("Hello", "World");

  const children = TreeAlpha.children(myObject); // [[0, "Hello"], [1, "World"]]
  ```

- Rename and change type of annotatedAllowedTypeSet on FieldSchemaAlpha to more closely align with allowedTypesSet ([#24820](https://github.com/microsoft/FluidFramework/pull/24820)) [f4e8dc8cd09](https://github.com/microsoft/FluidFramework/commit/f4e8dc8cd09f052f21e436e2c0584a1a34d2be77)

  This changes the `annotatedAllowedTypeSet` property on [`FieldSchemaAlpha`](https://fluidframework.com/docs/api/fluid-framework/fieldschemaalpha-class).
  It is now called `annotatedAllowedTypesNormalized` and stores evaluated schemas along with their annotations in a list of objects rather than as a mapping from the schemas to their annotations. This makes the API easier to use and better aligns with the current public APIs.

- Persisted metadata for Shared Tree schemas (Alpha) ([#24812](https://github.com/microsoft/FluidFramework/pull/24812)) [3f81ab52ff7](https://github.com/microsoft/FluidFramework/commit/3f81ab52ff7265a8533c0e192c8b77d298b70eea)

  The persisted metadata feature for Shared Tree allows an application author to write document-persisted metadata along with the schema. This feature is supported for both node and field schemas.

  #### Using the persisted metadata feature

  As of now, persisted metadata support is available via the SchemaFactoryAlpha API:

  ```ts
  // Construct a schema factory with alpha APIs
  const schemaFactory = new SchemaFactoryAlpha("com.example");
  ```

  Persisted metadata can take the shape of any JSON-serializable object, e.g.:

  ```ts
  const persistedMetadata = { a: 2 };
  ```

  #### Feature flag

  To enable persisted metadata, use `configuredSharedTree` to specify the format version. The tree that is returned can be substituted in place of the default `SharedTree` object exported by the Fluid Framework. For example:

  ```ts
  const tree = configuredSharedTree({
    formatVersion: SharedTreeFormatVersion.v5,
  }).create(runtime);

  export const MyContainerSchema = {
    initialObjects: {
      appData: tree,
    },
  } satisfies ContainerSchema;
  ```

  #### Examples

  ##### Field schemas with persisted metadata

  ```ts
  // Construct a schema factory with alpha APIs
  const schemaFactory = new SchemaFactoryAlpha("com.example");

  // Define metadata. This can take the shape of any JSON-serializable object.
  const persistedMetadata = { a: 2 };

  // Foo is an object type with metadata
  class Foo extends schemaFactory.objectAlpha(
    "Foo",
    {
      // Metadata for a required number field
      bar: schemaFactory.required(schemaFactory.number, { persistedMetadata }),

      // Metadata for an optional string field
      baz: schemaFactory.optional(schemaFactory.string, { persistedMetadata }),
      // Metadata for the object type Foo
    },
    { persistedMetadata },
  ) {}
  ```

  ##### Recursive field schemas

  ```ts
  // Construct a schema factory with alpha APIs
  const schemaFactory = new SchemaFactoryAlpha("com.example");

  // Define metadata. This can take the shape of any JSON-serializable object.
  const persistedMetadata = { a: 2 };

  // Recursive object schema with persisted metadata
  class RecursiveObject extends schemaFactory.objectRecursive(
    "RecursiveObject",
    {
      x: [() => RecursiveObject, schemaFactory.number],
    },
    { persistedMetadata },
  ) {}

  // Recursive field schema with metadata
  const recursiveField = schemaFactory.optionalRecursive(
    [() => RecursiveObject, schemaFactory.number],
    { persistedMetadata },
  );
  ```

  ##### Recursive object schemas

  ```ts
  // Construct a schema factory with alpha APIs
  const schemaFactory = new SchemaFactoryAlpha("com.example");

  // Define metadata. This can take the shape of any JSON-serializable object.
  const persistedMetadata = { a: 2 };

  // Recursive array schema
  class Foos extends schemaFactory.arrayRecursive("FooList", [() => Foo], {
    persistedMetadata,
  }) {}

  // Recursive object schema
  class Foo extends schemaFactory.objectRecursive(
    "Foo",
    { fooList: Foos },
    { persistedMetadata },
  ) {}

  // Recursive map schema
  class FooMap extends schemaFactory.mapRecursive("FooMap", [() => Foo], {
    persistedMetadata,
  }) {}
  ```

- Improved Schema Validation ([#24866](https://github.com/microsoft/FluidFramework/pull/24866)) [caae4ae15ed](https://github.com/microsoft/FluidFramework/commit/caae4ae15edeb8aeae33b0520b18dbb1993965f6)

  When constructing a [`TreeViewConfiguration`](https://fluidframework.com/docs/api/fluid-framework/treeviewconfiguration-class), the same schema listed more than once in a given [`AllowedTypes`](https://fluidframework.com/docs/api/fluid-framework/allowedtypes-typealias) is now an error even when [`preventAmbiguity`](https://fluidframework.com/docs/api/fluid-framework/treeviewconfiguration-class#preventambiguity-property) is false.
  Previously a bug resulted in this only being rejected when `preventAmbiguity` was true.

## 2.42.0

### Minor Changes

- Fix Tree.key and Tree.parent for Unhydrated nodes after edits ([#24708](https://github.com/microsoft/FluidFramework/pull/24708)) [8aa5c233e2](https://github.com/microsoft/FluidFramework/commit/8aa5c233e2d59f440fd9c923bca14687bb958d66)

  In some cases, editing [Unhydrated](https://fluidframework.com/docs/api/fluid-framework/unhydrated-typealias) nodes could result in incorrect results being returned from [Tree.key](https://fluidframework.com/docs/data-structures/tree/nodes#treekey) and [Tree.parent](https://fluidframework.com/docs/data-structures/tree/nodes#treeparent).
  This has been fixed.

- Defaulted identifier fields on unhydrated nodes are now enumerable ([#24739](https://github.com/microsoft/FluidFramework/pull/24739)) [3a5d0acfb6](https://github.com/microsoft/FluidFramework/commit/3a5d0acfb65f93a927405241e6047c8a04c8da58)

  Previously, there was a special case for defaulted [identifier](https://fluidframework.com/docs/api/fluid-framework/schemafactory-class#identifier-property) fields on unhydrated nodes where they were not enumerable.
  This special case has been removed: they are now enumerable independent of hydration status and defaulting.

- Name collisions from structurally named schema now error ([#24707](https://github.com/microsoft/FluidFramework/pull/24707)) [a343f0498f](https://github.com/microsoft/FluidFramework/commit/a343f0498f2039e68aa11e8ede98f32391ce727d)

  It is legal to have multiple [TreeNodeSchema](https://fluidframework.com/docs/api/fluid-framework/treenodeschema-typealias) with the same name so long as they are not used together in the same tree.
  Using different schema with the same name when building otherwise identical [structurally named](https://fluidframework.com/docs/api/fluid-framework/schemafactory-class#schemafactory-remarks) in the same [SchemaFactory](https://fluidframework.com/docs/api/fluid-framework/schemafactory-class) is not valid, however.
  Previously doing this would not error, and instead return the first structurally named schema with that name.
  Now this case throws an informative error:

  ```typescript
  const factory = new SchemaFactory(undefined);
  class Child1 extends factory.object("Child", {}) {}
  class Child2 extends factory.object("Child", {}) {}

  const a = factory.map(Child1);

  // Throws a UsageError with the message:
  // "Structurally named schema collision: two schema named "Array<["Child"]>" were defined with different input schema."
  const b = factory.array(Child2);
  ```

## 2.41.0

### Minor Changes

- TreeAlpha.create now accepts unhydrated nodes ([#24629](https://github.com/microsoft/FluidFramework/pull/24629)) [e63af87aeb](https://github.com/microsoft/FluidFramework/commit/e63af87aeb7ece1ff0969027904c3b18f122d2d1)

  [TreeAlpha.create](https://fluidframework.com/docs/api/fluid-framework/treealpha-interface#create-methodsignature) now accepts [unhydrated](https://fluidframework.com/docs/api/fluid-framework/unhydrated-typealias) nodes.
  `TreeAlpha.create`'s documentation has been updated to clarify that this is supported.

  Additionally `TreeAlpha.create` no longer throws a "Tree does not conform to schema" error when given a tree omitting an identifier.
  Instead, the identifier behaves like it would for other ways to build unhydrated nodes: remaining unreadable until hydrated.

- SharedTrees's FluidClientVersion enum (alpha) has been redesigned ([#24638](https://github.com/microsoft/FluidFramework/pull/24638)) [5f3b9d7b7d](https://github.com/microsoft/FluidFramework/commit/5f3b9d7b7d12307d89cbd4b88f5e2d6e1833680d)

  Users of [FluidClientVersion](https://fluidframework.com/docs/api/fluid-framework/fluidclientversion-enum)'s `v2_1`, `v2_2`, and `v2_3` entries should specify `v2_0` instead.
  This will result in no functional differences since no code currently opts into any additional functionality based on specifying those versions.
  The new approach avoids listing versions which there is currently no reason to select, and thus these options have been removed.
  If future work adds support to opt into features which only work starting with some of those versions, they will be re-added at that time.

- ForestTypeExpensiveDebug now validates content against schema ([#24658](https://github.com/microsoft/FluidFramework/pull/24658)) [9d600aae88](https://github.com/microsoft/FluidFramework/commit/9d600aae88b9045392067719638258ea7407c2eb)

  When opting into using [ForestTypeExpensiveDebug](https://fluidframework.com/docs/api/fluid-framework/#foresttypeexpensivedebug-variable) using [configuredSharedTree](https://fluidframework.com/docs/api/fluid-framework/#configuredsharedtree-function), the tree is now checked against the schema on load and after every edit.
  This should help detect and diagnose document corruption bugs.

  ```typescript
  const DebugSharedTree = configuredSharedTree({
    jsonValidator: typeboxValidator,
    // Now detects corrupted documents which are out of schema.
    forest: ForestTypeExpensiveDebug,
  });
  ```

- The comparePersistedSchema function (alpha) has had its canInitialize parameter removed ([#24606](https://github.com/microsoft/FluidFramework/pull/24606)) [d083a1780a](https://github.com/microsoft/FluidFramework/commit/d083a1780a1db74a922cbfb451d23ab932c0eb32)

  [comparePersistedSchema](https://fluidframework.com/docs/api/tree/#comparepersistedschema-function) has had its `canInitialize` parameter removed.
  This parameter was only used to add to the output [SchemaCompatibilityStatus](https://fluidframework.com/docs/api/fluid-framework/schemacompatibilitystatus-interface).
  If a full `SchemaCompatibilityStatus` is still desired, the `canInitialize` value can be added to the result:

  ```typescript
  // old
  const result = comparePersistedSchema(a, b, canInitialize);
  // new
  const result = { ...comparePersistedSchema(a, b), canInitialize };
  ```

- TreeNodes now implicitly generate identifiers on access instead of throwing ([#24665](https://github.com/microsoft/FluidFramework/pull/24665)) [cd5976b959](https://github.com/microsoft/FluidFramework/commit/cd5976b959d6b7a5259e3bb9ef816f842724bc6e)

  Accessing a defaulted [identifier](https://fluidframework.com/docs/api/fluid-framework/schemafactory-class#identifier-property) on an [Unhydrated](https://fluidframework.com/docs/api/fluid-framework/unhydrated-typealias) `TreeNode` no longer throws a usage error.
  Instead, a new UUID is allocated for the identifier and returned.
  These UUIDs will be more compressible than random ones, since they all come from a single sequence (starting with a random UUID).
  They will not be fully compressed like the identifiers generated after hydration that leverage the document's [IIdCompressor](https://fluidframework.com/docs/api/id-compressor/iidcompressor-interface).

  ```typescript
  const factory = new SchemaFactory("test");
  class HasIdentifier extends schema.object("A", { id: factory.identifier }) {}
  // This used to throw an error:
  const id = new HasIdentifier({}).id;
  ```

- New TableSchema (alpha) APIs ([#24579](https://github.com/microsoft/FluidFramework/pull/24579)) [e565f6838b](https://github.com/microsoft/FluidFramework/commit/e565f6838b31d3e777da942c806606575123f6d6)

  A `TableSchema` utility has been added to Shared Tree for managing dynamic, tabular data.
  This new `TableSchema` namespace contains APIs for creating column, row, and table [node schema](https://fluidframework.com/docs/api/fluid-framework/treenodeschema-typealias).

  Note: these APIs require the use of [SchemaFactoryAlpha](https://fluidframework.com/docs/api/fluid-framework/schemafactoryalpha-class).

  > [!WARNING]
  > These APIs are in preview and are subject to change.
  > Until these APIs have stabilized, it is not recommended to use them in production code.
  > There may be breaking changes to these APIs and their underlying data format.
  > Using these APIs in production code may result in data loss or corruption.

  #### Creating a table

  You can craft a table schema with `TableSchema.table`.
  This includes providing a schema for the cells that will appear in the table:

  ```typescript
  class MyTable extends TableSchema.table({
    schemaFactory,
    cell: schemaFactory.string,
  }) {}

  const table = new MyTable({
    columns: [{ id: "column-0" }],
    rows: [{ id: "row-0", cells: { "column-0": "Hello world!" } }],
  });
  ```

  #### Creating a table with custom column and row schema

  To associate additional data with your rows or columns, generate custom row and column schema using `TableSchema.column` and `TableSchema.row`.
  These schema can then be provided to `TableSchema.table`:

  ```typescript
  class MyColumn extends TableSchema.column({
    schemaFactory,
    cell: Cell,
    props: schemaFactory.object("TableColumnProps", {
      label: schemaFactory.string,
    }),
  }) {}

  class MyRow extends TableSchema.row({
    schemaFactory,
    cell: Cell,
  }) {}

  class MyTable extends TableSchema.table({
    schemaFactory,
    cell: Cell,
    column: MyColumn,
    row: MyRow,
  }) {}

  const table = new MyTable({
    columns: [
      new MyColumn({ props: { label: "Entry" } }),
      new MyColumn({ props: { label: "Date" } }),
      new MyColumn({ props: { label: "Amount" } }),
    ],
    rows: [],
  });
  ```

  #### Interacting with the table

  Table trees created using `TableSchema` offer various APIs to make working with tabular data easy.
  These include:

  - Insertion and removal of columns, rows, and cells.
  - Cell access by column/row.

  ```typescript
  // Create an empty table
  const table = MyTable.empty();

  const column0 = new MyColumn({
    props: { label: "Column 0" },
  });

  // Append a column to the end of the table.
  table.insertColumn({
    column: column0,
  });

  const rows = [new MyRow({ cells: {} }), new MyRow({ cells: {} })];

  // Insert rows at the beginning of the table.
  table.insertRows({
    index: 0,
    rows,
  });

  // Set cell at row 0, column 0.
  table.setCell({
    key: {
      column: column0,
      row: rows[0],
    },
    cell: "Hello",
  });

  // Set cell at row 1, column 0.
  table.setCell({
    key: {
      column: column0,
      row: rows[1],
    },
    cell: "World",
  });

  // Remove the first row.
  // Note: this will also remove the row's cell.
  table.removeRow(rows[0]);

  // Remove the column.
  // Note: this will *not* remove the remaining cell under this column.
  table.removeColumn(column0);
  ```

  #### Listening for changes

  Listening for changes to table trees behaves just like it would for any other nodes in a Shared Tree (see [here](https://fluidframework.com/docs/data-structures/tree/events) for more details).

  The most straightforward option is to listen for any changes to the table node and its descendants.
  For example:

  ```typescript
  class Cell extends schemaFactory.object("TableCell", {
    value: schemaFactory.string,
  }) {}

  class Table extends TableSchema.table({
    schemaFactory,
    cell: Cell,
  }) {}

  const table = new Table({
    columns: [{ id: "column-0" }],
    rows: [{ id: "row-0", cells: {} }],
  });

  // Listen for any changes to the table and its children.
  // The "treeChanged" event will fire when the `table` node or any of its descendants change.
  Tree.on(table, "treeChanged", () => {
    // Respond to the change.
  });
  ```

  If you need more granular eventing to meet your performance needs, that is possible as well.
  For example, if you wish to know when the table's list of rows changes, you could do the following:

  ```typescript
  class Cell extends schemaFactory.object("TableCell", {
    value: schemaFactory.string,
  }) {}

  class Table extends TableSchema.table({
    schemaFactory,
    cell: Cell,
  }) {}

  const table = new Table({
    columns: [{ id: "column-0" }],
    rows: [{ id: "row-0", cells: {} }],
  });

  // Listen for any changes to the list of rows.
  // The "nodeChanged" event will fire only when the `rows` node itself changes (i.e., its own properties change).
  // In this case, the event will fire when a row is added or removed, or the order of the list is changed.
  // But it won't fire when a row's properties change, or when the row's cells change, etc.
  Tree.on(table.rows, "nodeChanged", () => {
    // Respond to the change.
  });
  ```

  #### Limitations

  ##### Orphaned cells

  Cells in the table may become "orphaned."
  That is, it is possible to enter a state where one or more rows contain cells with no corresponding column.
  To reduce the likelihood of this, you can manually remove corresponding cells when removing columns.

  For example:

  ```typescript
  // Remove column1 and all of its cells.
  // The "transaction" method will ensure that all changes are applied atomically.
  Tree.runTransaction(table, () => {
    // Remove column1
    table.removeColumn(column1);

    // Remove the cell at column1 for each row.
    for (const row of table.rows) {
      table.removeCell({
        column: column1,
        row,
      });
    }
  });
  ```

  > [!WARNING]
  > Note that even with the above precaution, it is possible to enter such an orphaned cell state via the merging of edits.
  > For example: one client might add a row while another concurrently removes a column, orphaning the cell where the column and row intersected.

- New TreeAlpha identifier APIs for converting, retrieving, and generating identifiers ([#24218](https://github.com/microsoft/FluidFramework/pull/24218)) [e5b2882132](https://github.com/microsoft/FluidFramework/commit/e5b28821323566112096f05805281b8d5321077d)

  #### TreeAlpha.identifier

  You can retrieve the long identifier with `TreeAlpha.identifier(node)`, where `node` is a `TreeNode`. The long identifier is a stable, compressible UUID generated by the tree.
  In cases where the node does not yet have an identifier assigned, this will return `undefined`.
  These cases include:

  - The node does not contain an identifier field.
  - The node is a non-hydrated node with a user provided identifier. Note that if it is a non-hydrated node without an identifier provided, it will throw an error.

  #### TreeAlpha.identifier.shorten

  You can shorten a long identifier with `TreeAlpha.identifier.shorten(branch, identifier)`, where `branch` is a `TreeBranch`, and `identifier` is a `string`.
  If the method returns a valid short identifier, this identifier can be passed into `TreeAlpha.identifier.lengthen`
  to get the original valid long `identifier` back.
  In the cases where it's not possible to shorten the `identifier`, it will return `undefined`.
  These cases include:

  - A compressible long identifier, but it is unrecognized by the tree that the node belongs to. This can occur if the identifier is not generated from the tree.
  - An identifier which is not compressible by the tree. This can occur if the node's identifier was a user provided string.

  #### TreeAlpha.identifier.lengthen

  You can lengthen a short identifier with `TreeAlpha.identifier.lengthen(branch, identifier)`, where `branch` is a `TreeBranch`, and `identifier` is a `number`.
  If the method returns a valid long identifier, this identifier can be passed into `TreeAlpha.identifier.shorten` to get the original `identifier` back.
  In the cases where it's not possible to lengthen the `identifier`, this method will throw an error.
  These cases include:

  - An unrecognized short identifier. This can occur if the identifier is not generated from the tree.

  #### TreeAlpha.identifier.getShort

  You can retrieve the short identifier from a node with `TreeAlpha.identifier.getShort(node)` where `node` is a `TreeNode`.
  If it is not possible to retrieve the short identifier, it will return `undefined`

  ##### Example for a node with valid identifier

  ```typescript
  // This will retrieve the short identifier from the node.
  const shortIdentifier = TreeAlpha.identifier.getShort(
    nodeWithValidIdentifier,
  );
  ```

  ##### Examples for when you get undefined

  In cases where the node provided does not contain an identifier that is recognized or compressible by the tree that the node belongs to, this method will return undefined.
  This will occur in the following cases:

  - The node is an non-hydrated node with a user provided identifier. Note that if it is an non-hydrated node without an identifier provided, it will throw an error.
  - The node does not contain an identifier field.
  - The node contains a compressible long identifier, but it is unrecognized by the tree that the node belongs to. This can occur if the identifier is not generated from the tree.
  - The node contains an identifier which is not compressible by its id compressor. This can occur if the node's identifier was a user provided string.

  ```typescript
  // This will return undefined
  const shortIdentifier = TreeAlpha.identifier.getShort(node);
  ```

  #### TreeAlpha.identifier.create

  You can create a long identifier from a branch with `TreeAlpha.identifier.create(branch)` where `branch` is a `TreeBranch`.

  ```typescript
  const createdIdentifier = TreeAlpha.identifier.create(branch);
  ```

## 2.40.0

### Minor Changes

- SchemaFactoryAlpha.object has been renamed to SchemaFactoryAlpha.objectAlpha ([#24478](https://github.com/microsoft/FluidFramework/pull/24478)) [12e5ab3b33](https://github.com/microsoft/FluidFramework/commit/12e5ab3b335a8af263e1cc84f8951cf02db79b8b)

  This rename was done so that changes can be made to the signature of the class.
  This is a breaking change and uses of `SchemaFactoryAlpha.object` may need to be changed to `SchemaFactoryAlpha.objectAlpha`.

- AllowedTypes array handling has been updated ([#24484](https://github.com/microsoft/FluidFramework/pull/24484)) [f0a71ccce7](https://github.com/microsoft/FluidFramework/commit/f0a71ccce7a055e99ce9f4ba15e1cede529bbc9c)

  As an optimization, how [AllowedTypes](https://fluidframework.com/docs/api/fluid-framework/allowedtypes-typealias) arrays are processed has changed.
  Now much larger arrays can be provided without hitting:

  > "Type instantiation is excessively deep and possibly infinite.ts"

  Previously, arrays of around 43 schema would start having this issue, but now arrays of hundreds work correctly.

  This optimization has resulted in a small change in behavior for how [input types](https://fluidframework.com/docs/api/fluid-framework/input-typealias) are computed.
  When the `AllowedTypes` array has a type that is a union of two arrays, and the two arrays start with the same subsequence of types,
  previously this would allow the types from the common prefix of the arrays.
  For example `[typeof A] | [typeof A, typeof B]` would permit inserting content compatible with `A`.
  Now all such unions produce `never` for their insertable node types (just like this example would if the order of the second array were reversed).
  This case was not intentionally supported, and as documented in [input types](https://fluidframework.com/docs/api/fluid-framework/input-typealias), non-exact types, like these unions,
  are not guaranteed to produce anything other than `never`.

  If providing exact schema is impractical and the previous behavior is required, convert the union of arrays to an array of unions.
  The above example can be turned into `[typeof A, typeof B | typeof A]`.

  This is also fix for a case where
  [AllowedTypes](https://fluidframework.com/docs/api/fluid-framework/allowedtypes-typealias)
  was order dependent, which violates its documented order independence.

- A SharedTree document corruption bug has been fixed ([#24565](https://github.com/microsoft/FluidFramework/pull/24565)) [6b3e150395](https://github.com/microsoft/FluidFramework/commit/6b3e15039543a2bab4de5b2e969301f0e7f1f3db)

  There was a bug where local changes were not correctly sent to peers.
  This could lead to a permanent loss of consistency and ultimately document corruption.
  See [PR24561](https://github.com/microsoft/FluidFramework/pull/24561) for details.

- IContainer.getContainerPackageInfo has been removed ([#24525](https://github.com/microsoft/FluidFramework/pull/24525)) [15a541265b](https://github.com/microsoft/FluidFramework/commit/15a541265ba6293bf24e95308a5e667d5f7e9794)

  `IContainer.getContainerPackageInfo()` was set to be removed in release 2.40.0. To access the package name `getContainerPackageInfo()` provided, use `IFluidCodeDetails.package` returned by `IContainer.getLoadedCodeDetails()`.

  See [issue #23898](https://github.com/microsoft/FluidFramework/issues/23898) for more information.

- The extractPersistedSchema (alpha) API has had its arguments adjusted ([#24562](https://github.com/microsoft/FluidFramework/pull/24562)) [2e6b0cfd74](https://github.com/microsoft/FluidFramework/commit/2e6b0cfd74f3c3db5ce3b6b3f8ff8decbfc24ab6)

  The [extractPersistedSchema](https://fluidframework.com/docs/api/tree/#extractpersistedschema-function) function has been updated to take in [SimpleTreeSchema](https://fluidframework.com/docs/api/fluid-framework/simpletreeschema-interface).
  This makes it possible to use with simple schema derived from stored schema, like those returned from [ITreeAlpha.exportSimpleSchema](https://fluidframework.com/docs/api/fluid-framework/itreealpha-interface#exportsimpleschema-methodsignature).
  Like [TreeAlpha.exportCompressed](https://fluidframework.com/docs/api/tree#treealpha-variable), `extractPersistedSchema` now takes in [FluidClientVersion](https://fluidframework.com/docs/api/fluid-framework/fluidclientversion-enum) to make it possible to opt into newer formats when they become available.

  Additionally, `persistedToSimpleSchema` has been added to fill in a gap in the API.
  Without `persistedToSimpleSchema` it would be impossible to parse the persisted format without a valid compressed tree to provide to [independentInitializedView](https://fluidframework.com/docs/api/tree/#independentinitializedview-functionc).

- SchemaFactoryAlpha supports adding metadata to AllowedTypes ([#24478](https://github.com/microsoft/FluidFramework/pull/24478)) [12e5ab3b33](https://github.com/microsoft/FluidFramework/commit/12e5ab3b335a8af263e1cc84f8951cf02db79b8b)

  This change allows metadata to be added to [`AllowedTypes`](https://fluidframework.com/docs/api/fluid-framework/allowedtypes-typealias) as well as individual types in a set of `AllowedTypes`.
  Users can define custom metadata by putting their `AllowedTypes` in an object with `metadata` and `types` properties:

  ```typescript
  schemaFactoryAlpha.arrayAlpha({
    metadata: {
      custom: "these allowed types are annotated",
    },
    types: [SchemaFactory.string, SchemaFactory.number],
  });
  ```

  This annotation system will also be used to implement future schema features.

## 2.33.0

### Minor Changes

- Remote edits to nodes which have never been accessed locally correctly trigger "treeChanged" events ([#24421](https://github.com/microsoft/FluidFramework/pull/24421)) [916ad0546f7](https://github.com/microsoft/FluidFramework/commit/916ad0546f772b744e1c150c6e833199c2f713ef)

  There was a bug where "treeChanged" events would not always trigger if the node that was edited had never been accessed in the current view.
  This has been fixed.

- Typing derived from unions of AllowedTypes arrays is fixed ([#24441](https://github.com/microsoft/FluidFramework/pull/24441)) [a27ef0a0939](https://github.com/microsoft/FluidFramework/commit/a27ef0a0939a0983be85362d1aa34df7735977ed)

  Unions of array types provided as an [AllowedTypes](https://fluidframework.com/docs/api/fluid-framework/allowedtypes-typealias) used to result in incorrectly computed insertable content types.
  This happened because [InsertableTreeNodeFromAllowedTypes](https://fluidframework.com/docs/api/fluid-framework/insertabletreenodefromallowedtypes-typealias) distributed over the union, violating the policy documented in [Input](https://fluidframework.com/docs/api/fluid-framework/input-typealias) for how schema-derived input types should be computed.
  This has been fixed.
  To get usable Input types, SharedTree schema's types should always capture the exact schema provided at runtime and not unions of possible different schema.
  Any code impacted by this change should be updated to replace any such unions with more specific types.

- "Unsafe" @system types moved to System_Unsafe namespace ([#24443](https://github.com/microsoft/FluidFramework/pull/24443)) [dd4abfc4570](https://github.com/microsoft/FluidFramework/commit/dd4abfc4570aff9ce37c3e6bcee23cf4c7eb6e7e)

  Working code conforming to the [rules regarding API Support Levels](https://fluidframework.com/docs/build/releases-and-apitags#api-support-levels) should be unaffected, but this resolves an issue which required violating these rules and directly referencing `@system` types.

  Sometimes packages exporting SharedTree schema related types for recursive schema could yield errors like:

  > error TS2742: The inferred type of 'YourSchema' cannot be named without a reference to '../node_modules/@fluidframework/tree/lib/internalTypes.js'.
  > This is likely not portable.
  > A type annotation is necessary.

  Mitigating this error could require explicitly referencing these `@system` types from `internalTypes`.
  Any such references to the moved types should be able to be deleted, as TypeScript will now be able to find them in the new namespace without assistance.

  This does not migrate all types out of `internalTypes`, so some occurrences of this issue may remain.

- allowUnused utility function ([#24076](https://github.com/microsoft/FluidFramework/pull/24076)) [13c62b613e8](https://github.com/microsoft/FluidFramework/commit/13c62b613e8a3f919c0e41d0ffc582c984504f0d)

  A new `allowUnused` utility function has been added, which discards its type or runtime argument.
  When TypeScript is configured to reject code with unused locals, this function can be used to suppress that error, enabling use of [ValidateRecursiveSchema](https://fluidframework.com/docs/api/fluid-framework/validaterecursiveschema-typealias) to compile.

  ```typescript
  class Test extends sf.arrayRecursive("Test", () => Test) {} // Bad
  allowUnused<ValidateRecursiveSchema<typeof Test>>(); // Reports compile error due to invalid schema above.
  ```

- Improve handling of deleted nodes ([#24345](https://github.com/microsoft/FluidFramework/pull/24345)) [0ab3e510db5](https://github.com/microsoft/FluidFramework/commit/0ab3e510db5371e40c7f6b0fec3eef40695bcc94)

  [TreeNodes](https://fluidframework.com/docs/api/fluid-framework/treenode-class) which are [deleted](https://fluidframework.com/docs/api/fluid-framework/treestatus-enum#deleted-enummember) were not handled correctly.
  This has been improved in two ways:

  1. Accessing fields of deleted nodes now consistently throws a usage error indicating that doing so is invalid.
     Previously, this would throw an assertion error, which was a bug.
  2. When a `TreeNode` is deleted, but that node still exists within the [`ITree`](https://fluidframework.com/docs/api/driver-definitions/itree-interface), then becomes accessible again later, a new `TreeNode` is now allocated instead of trying to reuse the deleted one.
     Note that this can only happen when the entire view of the `ITree` is disposed then recreated.
     This happens when disposing and recreating a [TreeView](https://fluidframework.com/docs/api/fluid-framework/treeview-interface) or when the contents of the view are disposed due to being out of schema (another client did a schema upgrade), then brought back into schema (the schema upgrade was undone).

- Generic types for IntervalCollections have been replaced with non-generic types ([#24411](https://github.com/microsoft/FluidFramework/pull/24411)) [1c743e825ed](https://github.com/microsoft/FluidFramework/commit/1c743e825ed29a81b0e66775ce3553477361d335)

  This change deprecates the following generic types and provides non-generic alternatives where necessary:

  - `IIntervalCollection` is replaced by `ISequenceIntervalCollection`
  - `IIntervalCollectionEvent` is replaced by `ISequenceIntervalCollectionEvents`
  - `IntervalIndex` is replaced by `SequenceIntervalIndex`
  - `IOverlappingIntervalsIndex` is replaced by `ISequenceOverlappingIntervalsIndex`
  - `ISharedIntervalCollection` is deprecated without replacement

  These types are no longer required to be generic, and replacing them with non-generic alternatives keeps our typing less complex.

## 2.32.0

### Minor Changes

- Cleanup of several tree and schema alpha APIs for content import and export ([#24350](https://github.com/microsoft/FluidFramework/pull/24350)) [fe924a173b](https://github.com/microsoft/FluidFramework/commit/fe924a173b71abd96ba76da787eec3b4c077d32b)

  A new `TreeSchema` type has been introduced which extends `SimpleTreeSchema` but contains `TreeNodeSchema` instead of `SimpleNodeSchema`.

  `TreeViewConfigurationAlpha` is added which is just `TreeViewConfiguration` but implementing `TreeSchema`.

  `SimpleTreeSchema` was modified to have a `root` property instead of implementing `SimpleFieldSchema` directly:
  this makes it possible for `TreeViewConfigurationAlpha` to implement `TreeSchema` which extends `SimpleTreeSchema`.

  `generateSchemaFromSimpleSchema` now returns the new `TreeSchema` type.

  `EncodeOptions` and `ParseOptions` have been unified as `TreeEncodingOptions` which covers both the encoding and parsing cases.

  `getJsonSchema` now takes in `ImplicitAllowedTypes` instead of `ImplicitFieldSchema` since it can't handle optional roots.
  `getJsonSchema` also takes in the new `TreeSchemaEncodingOptions` to provide options for how to handle stored keys vs property keys, and fields with defaults.

  Now that `getJsonSchema` takes in configuration options, its results are no longer cached.

- Provide alpha APIs for accessing tree content and stored schema without requiring a compatible view schema ([#24350](https://github.com/microsoft/FluidFramework/pull/24350)) [fe924a173b](https://github.com/microsoft/FluidFramework/commit/fe924a173b71abd96ba76da787eec3b4c077d32b)

  Adds an `ITreeAlpha` interface (which `ITree` can be down-casted to) that provides access to both the tree content and the schema.
  This allows inspecting the content saved in a SharedTree in a generic way that can work on any SharedTree.

  This can be combined with the existing `generateSchemaFromSimpleSchema` to generate a schema that can be used with [`ITree.viewWith`](https://fluidframework.com/docs/api/fluid-framework/viewabletree-interface#viewwith-methodsignature) to allow constructing a [`TreeView`](https://fluidframework.com/docs/api/fluid-framework/treeview-interface) for any SharedTree, regardless of its schema.

  Note that the resulting TypeScript typing for such a view will not be friendly: the `TreeView` APIs are designed for statically known schema. Using them is possible with care and a lot of type casts but not recommended if it can be avoided: see disclaimer on `generateSchemaFromSimpleSchema`.
  Example using `ITreeAlpha` and `generateSchemaFromSimpleSchema`:

  ```typescript
  const viewAlpha = tree as ITreeAlpha;
  const treeSchema = generateSchemaFromSimpleSchema(
    viewAlpha.exportSimpleSchema(),
  );
  const config = new TreeViewConfiguration({ schema: treeSchema.root });
  const view = viewAlpha.viewWith(config);
  ```

  `getSimpleSchema` is also added as an `@alpha` API to provide a way to clone schema into the simple schema formats.
  Note that when using (or copying) a view schema as a simple schema, more metadata will be preserved than when deriving one from the stored schema using `ITreeAlpha`.

## 2.31.0

### Minor Changes

- Better type errors for invalid recursive schema ([#24080](https://github.com/microsoft/FluidFramework/pull/24080)) [8ae8d2cb05](https://github.com/microsoft/FluidFramework/commit/8ae8d2cb05f7ce765f1d1997135e72a1ea1e00fb)

  Constraints have been added to `*Recursive` [`SchemaFactory`](https://fluidframework.com/docs/api/fluid-framework/schemafactory-class) methods to ensure correct use without relying on [`ValidateRecursiveSchema`](https://fluidframework.com/docs/api/fluid-framework/validaterecursiveschema-typealias) as much.

- Improved type checking for recursive object schema Fields ([#24113](https://github.com/microsoft/FluidFramework/pull/24113)) [5b656f5cb0](https://github.com/microsoft/FluidFramework/commit/5b656f5cb0707c149aa4537017f71052f10467ee)

  Most ways to provide incorrectly typed data for fields of [recursive object schema](https://fluidframework.com/docs/api/fluid-framework/schemafactory-class#objectrecursive-method) now produce simpler type errors without relying on [ValidateRecursiveSchema](https://fluidframework.com/docs/api/fluid-framework/validaterecursiveschema-typealias).

  As a side effect of this work, some schema which violated the documented allowed patterns specified by [SchemaFactory](https://fluidframework.com/docs/api/fluid-framework/schemafactory-class#schemafactory-remarks) but used to work (as long as they were not package exported) no longer compile.

  The specific case known to break is when:

  1. An Object node schema is co-recursive with an Array node schema.
  2. The Array does not declare a named subclass.
  3. The schema reference from the Object to the Array is not using the [lazy syntax](https://fluidframework.com/docs/api/fluid-framework/lazyitem-typealias).

  For example:

  ```typescript
  class Foo extends sf.objectRecursive("Foo", {
    fooList: sf.arrayRecursive("FooList", [() => Foo]), // Bad
  }) {}
  {
    type _check = ValidateRecursiveSchema<typeof Foo>;
  }
  ```

  Such a schema is disallowed according to the documentation. See the
  ["recursive schema must explicitly declare a named class"](<(https://fluidframework.com/docs/api/fluid-framework/schemafactory-class#schemafactory-remarks)>) remarks.
  This restriction is necessary to avoid [generated `.d.ts` files replacing recursive references with `any`](https://github.com/microsoft/TypeScript/issues/55832).
  Fixing this code is now also necessary to avoid a compile error.

  ```typescript
  // Fixed
  class FooList extends sf.arrayRecursive("FooList", [() => Foo]) {}
  {
    type _check = ValidateRecursiveSchema<typeof FooList>;
  }
  class Foo extends sf.objectRecursive("Foo", {
    fooList: FooList,
  }) {}
  {
    type _check = ValidateRecursiveSchema<typeof Foo>;
  }
  ```

  This change will also result in much nicer IntelliSense and type errors while fixing the typing if the schema is exported.

  There are still several cases which compile but violate this policy regarding recursive schema and can cause issues when exporting schema;
  these should be migrated to the above pattern as well.
  It is still valid to use non-recursive structurally named array and map schema inline; this change does not impact them.

- Performance enhancements in SharedTree branch-related ops processing ([#24093](https://github.com/microsoft/FluidFramework/pull/24093)) [47b275bcf2](https://github.com/microsoft/FluidFramework/commit/47b275bcf2dd79696387f7c8f3e876d03b2813f8)

  SharedTree leverages the "op bunching" feature where contiguous ops in a grouped batch are bunched and processed together
  to asymptotically improve the performance of processing ops.
  This performance enhancement focuses on the scenario where there are one or more commits in the trunk and one or more peer
  commits are received in a bunch. With 1 trunk commits and 10 peer commits, the performance increases by 57%; with 100
  trunk commits and 100 peer commits, the performance increases by 97%.

  Some example scenarios where the performance will be improved:

  - A client makes some local changes and another client simultaneously makes a large number of changes in a single JavaScript turn.
    For example, a client is typing into a canvas while another client pastes a large amount of content into a table.
  - A client makes a local branch with some changes and rebases it into the trunk. For example, an AI agent makes changes
    on a local branch which are accepted by a user resulting in the AI's branch being merged into the trunk.

- `TreeAlpha.exportConcise` now supports `undefined` ([#24187](https://github.com/microsoft/FluidFramework/pull/24187)) [958b9fd8b9](https://github.com/microsoft/FluidFramework/commit/958b9fd8b9a2bd43558fe2a94dc55f8f51d47ea8)

  There is a new overload for `TreeAlpha.exportConcise` which makes exporting optional fields easier.
  This overload allows `undefined` and returns `undefined` in this case.

- Improvements to typing of object node schema ([#24143](https://github.com/microsoft/FluidFramework/pull/24143)) [02ecf8dfb2](https://github.com/microsoft/FluidFramework/commit/02ecf8dfb238dc4d1c88610cec34d7895802d28c)

  Several tweaks to the typing of object node schema have been made to allow exposing an `@alpha` `ObjectNodeSchema` type.

  [SchemaFactoryAlpha](https://fluidframework.com/docs/api/fluid-framework/schemafactoryalpha-class)'s `object` and `objectRecursive` now return schema which are compatible with the new `ObjectNodeSchema` type.
  This new `ObjectNodeSchema` type exposes a `fields: ReadonlyMap<string, FieldSchemaAlpha & SimpleObjectFieldSchema>` property which provides an easy way to get information about the object's fields.

  Additionally an alpha `ObjectNodeSchema` object is added to enable support for `schema instanceof ObjectNodeSchema` to safely narrow `TreeNodeSchema` to this new type.

  In support of this work, several typing details were fixed including:

  - `info` field of `[typeSchemaSymbol]` type brand on recursive object schema was specified to match non-recursive variants.
  - Type of field metadata was correctly plumbed through `optionalReclusive` and `requiredRecursive`.
  - When fields object provided to [SchemaFactory.object](https://fluidframework.com/docs/api/fluid-framework/schemafactory-class#object-method) is typed as `RestrictiveStringRecord<ImplicitFieldSchema>` the resulting [TreeObjectNode](https://fluidframework.com/docs/api/fluid-framework/treeobjectnode-typealias) no longer gets a `Record<string, TreeNode | TreeLeafValue>` signature which could incorrectly conflict with custom members added to the object. Instead `{}` is used to provide no information about felids on the type when the schema provides no information about them. Additionally this case is explicitly made non-constructable: the constructor takes in `never` instead of a `Record<string,never>` which could be erroneously satisfied with an empty object due to how TypeScript assignability rules consider records to have all allowed fields, but also allow objects missing those fields to be assigned to them.

  Lastly, `metadata` on the various schema types has been made required instead of optional.
  This does not impact the APIs for constructing schema: when `undefined` is provided the schema now defaults to `{}` instead of `undefined`.
  This reduces the number of cases code reading metadata from schema has to handle.

## 2.30.0

### Minor Changes

- New SchemaFactoryAlpha.scopedFactory method ([#23987](https://github.com/microsoft/FluidFramework/pull/23987)) [cddd5139c3](https://github.com/microsoft/FluidFramework/commit/cddd5139c3e070ef26db55331528435a99c0a1b1)

  The [`SchemaFactoryAlpha.scopedFactory`](https://fluidframework.com/docs/api/fluid-framework/schemafactoryalpha-class)
  method has been added, providing an easy way to create a new `SchemaFactory` with a nested scope string.

- TreeBranchEvents now exposes the rootChanged event ([#24014](https://github.com/microsoft/FluidFramework/pull/24014)) [702a08af83](https://github.com/microsoft/FluidFramework/commit/702a08af83206c21e1016ca47051052fa8554aa5)

  `TreeBranchEvents` now includes the `rootChanged` event from `TreeViewEvents`.

- Alpha APIs for replacing handles in export formats have been redesigned ([#24061](https://github.com/microsoft/FluidFramework/pull/24061)) [34b319cae7](https://github.com/microsoft/FluidFramework/commit/34b319cae7a78db5530dc898689e2eb846f1419f)

  The various import and export [`VerboseTree`](https://fluidframework.com/docs/api/fluid-framework/verbosetree-typealias) and [`ConciseTree`](https://fluidframework.com/docs/api/fluid-framework/concisetree-typealias) APIs no longer include `valueConverter` options.
  Instead the resulting tree can be further processed to do any desired replacements.
  The following `@alpha` APIs have been added to assist with this:

  1. `cloneWithReplacements`
  2. `replaceHandles`
  3. `replaceConciseTreeHandles`
  4. `replaceVerboseTreeHandles`

- Rules regarding how and when lazy schema references are resolved have been clarified ([#24030](https://github.com/microsoft/FluidFramework/pull/24030)) [23f32794db](https://github.com/microsoft/FluidFramework/commit/23f32794dbd3672dcc18e2a9ba2f16f4bf1241f0)

  A lazy schema reference is a [LazyItem](https://fluidframework.com/docs/api/fluid-framework/lazyitem-typealias) referencing a [TreeNodeSchema](https://fluidframework.com/docs/api/fluid-framework/treenodeschema-typealias).
  They typically look like `() => MySchema` and are used when a [forward reference](https://en.wikipedia.org/wiki/Forward_declaration#Forward_reference) from one schema to another is required (including but not limited to recursive and co-recursive schema).

  [TreeViewConfiguration](https://fluidframework.com/docs/api/fluid-framework/treeviewconfiguration-class#_constructor_-constructor) now documents its significance with respect to lazy schema references.
  Additionally some implicit assumptions like no modifications of [AllowedTypes](https://fluidframework.com/docs/api/fluid-framework/allowedtypes-typealias)
  after resolving of lazy schema references have been enforced (such modifications would previously cause undefined behavior in the future, and now an error is thrown when trying to modify them).

  `evaluateLazySchema` has been added as an `@alpha` API that is now consistently used by all internal code when evaluating lazy schema references.
  This ensures consistent behavior and error reporting, but also adds caching.
  Therefore it is now supported for applications to have lazy schema references which compute the schema when invoked,
  without having to implement their own caching as long as those applications use `evaluateLazySchema` anytime they need to evaluate a lazy schema reference.

## 2.23.0

### Minor Changes

- Creating large transactions and processing inbound changes is now faster ([#23929](https://github.com/microsoft/FluidFramework/pull/23929)) [35847b5ffe0](https://github.com/microsoft/FluidFramework/commit/35847b5ffe09d94cef42b74ab59e37c4bd6d8c2d)

  SharedTree sometimes composes several sequential changes into a single change.
  It does so whenever a transaction is created and when processing inbound changes.

  Version 2.23.0 makes this composition process asymptotically faster.
  For example, creating a transaction that performs 1000 edits on a single array now takes 170ms instead of 1.5s (an 89% improvement).

  See [Change #23902](https://github.com/microsoft/FluidFramework/pull/23902) for more details.

- Faster processing of events for large transactions ([#23939](https://github.com/microsoft/FluidFramework/pull/23939)) [2a1e7e0617f](https://github.com/microsoft/FluidFramework/commit/2a1e7e0617f618f82134c0bba269119ed980aadc)

  In versions prior to 2.23.0, event processing time could scale quadratically (`O(N^2)`) with the change count when
  processing a batch of changes.

  This performance characteristic has been corrected. See change
  [#23908](https://github.com/microsoft/FluidFramework/pull/23908) for more details.

- Op bunching performance enhancements ([#23732](https://github.com/microsoft/FluidFramework/pull/23732)) [a98b04fc9e0](https://github.com/microsoft/FluidFramework/commit/a98b04fc9e000971bdfa8135251a7dc3e189502c)

  `SharedTree` now takes advantage of a new feature called "op bunching" where contiguous ops in a grouped batch are
  bunched and processed together. This improves the performance of processing ops asymptotically; as
  the number of local ops and incoming ops increase, the processing time will reduce.

  For example, with 10 local ops + 10 incoming ops, the performance increases by 70%; with 100 local ops + 100 incoming ops, the performance increases by 94%.

  This will help improve performance in the following scenarios:

  - A client makes a large number of changes in a single JS turn. For example, copy pasting large data like a table.
  - A client has a large number of local changes. For example, slow clients whose changes are slow to ack or clients with
    a local branch with large number of changes.

- Invalid schema base classes in Tree.is now throw an error instead of returning false ([#23938](https://github.com/microsoft/FluidFramework/pull/23938)) [00995654070](https://github.com/microsoft/FluidFramework/commit/00995654070a4e13b57b2562ff4a5935aba70a2f)

  As documented in [`TreeNodeSchemaClass`](https://fluidframework.com/docs/api/fluid-framework/treenodeschemaclass-typealias#treenodeschemaclass-remarks), there are specific rules around sub-classing schema, mainly that only a single most derived class can be used.
  One place where it was easy to accidentally violate this rule and get hard-to-debug results was [`Tree.is`](https://fluidframework.com/docs/data-structures/tree/nodes#treeis).
  This has been mitigated by adding a check in `Tree.is` which detects this mistake (which used to result in `false` being returned) and instead throws a `UsageError` explaining the situation.
  The error will look something like:

  > Two schema classes were used (CustomObjectNode and Derived) which derived from the same SchemaFactory generated class ("com.example.Test"). This is invalid.

  For applications wanting to test if a given `TreeNode` is an instance of some schema base class, this can be done using `instanceof` which includes base classes when doing the check.

## 2.22.0

### Minor Changes

- Target ES2021 ([#23307](https://github.com/microsoft/FluidFramework/pull/23307)) [36ed18289b](https://github.com/microsoft/FluidFramework/commit/36ed18289bd9b076a996dc48965a9ef12a95bda6)

  The TypeScript build for Fluid Framework packages has been updated to target ES2021 instead of ES2020.
  This may result in newer JavaScript language features being used.
  This does not change TypeScript types, nor the JavaScript libraries being used.
  We only support users which support ES2022, so updating to target ES2021 should not break any supported use-case.
  Any users which do not have at least ES2021 language feature support may need to transpile out some additional cases after this change.

  This should result in slightly reduced bundle size and slightly improved performance for users not transpiling these features out.
  No major impact is expected.

- Add `leaves` and statics to `SchemaFactory`. ([#23787](https://github.com/microsoft/FluidFramework/pull/23787)) [efa90f6274](https://github.com/microsoft/FluidFramework/commit/efa90f6274152cadb55329b7bbf6a6cd8e299847)

  `SchemaFactory` now has a `leaves` member that is an array of all leaf schema.

  `SchemaFactory` now has static members to access leaf schema and create field schema.

## 2.21.0

Dependency updates only.

## 2.20.0

Dependency updates only.

## 2.13.0

### Minor Changes

- Metadata can be associated with Node Schema ([#23321](https://github.com/microsoft/FluidFramework/pull/23321)) [58619c3c4e](https://github.com/microsoft/FluidFramework/commit/58619c3c4ee55ca1497a117321ae0b364e6084e6)

  Users of TreeView can now specify metadata when creating Node Schema, via `SchemaFactoryAlpha`.
  This metadata may include system-understood properties like `description`.

  Example:

  ```typescript
  const schemaFactory = new SchemaFactoryAlpha(...);
  class Point extends schemaFactory.object("Point", {
  	x: schemaFactory.required(schemaFactory.number),
  	y: schemaFactory.required(schemaFactory.number),
  },
  {
  	metadata: {
  		description: "A point in 2D space",
  	},
  }) {}

  ```

  Functionality like the experimental conversion of Tree Schema to [JSON Schema](https://json-schema.org/) ([getJsonSchema](https://github.com/microsoft/FluidFramework/releases/tag/client_v2.4.0#user-content-metadata-can-now-be-associated-with-field-schema-22564)) leverages such system-understood metadata to generate useful information.
  In the case of the `description` property, it is mapped directly to the `description` property supported by JSON Schema.

  Custom, user-defined properties can also be specified.
  These properties will not be used by the system by default, but can be used to associate common application-specific properties with Node Schema.

  #### `SchemaFactoryAlpha` Updates

  - `object` and `objectRecursive`, `arrayRecursive`, and `mapRecursive` now support `metadata` in their `options` parameter.
  - (new) `arrayAlpha` - Variant of `array` that accepts an options parameter which supports `metadata`
  - (new) `mapAlpha` - Variant of `map` that accepts an options parameter which supports `metadata`

  #### Example

  An application is implementing search functionality.
  By default, the app author wishes for all app content to be potentially indexable by search, unless otherwise specified.
  They can leverage schema metadata to decorate types of nodes that should be ignored by search, and leverage that information when walking the tree during a search.

  ```typescript

  interface AppMetadata {
  	/**
  	 * Whether or not nodes of this type should be ignored by search.
  	 * @defaultValue `false`
  	 */
  	searchIgnore?: boolean;
  }

  const schemaFactory = new SchemaFactoryAlpha(...);
  class Point extends schemaFactory.object("Point", {
  	x: schemaFactory.required(schemaFactory.number),
  	y: schemaFactory.required(schemaFactory.number),
  },
  {
  	metadata: {
  		description: "A point in 2D space",
  		custom: {
  			searchIgnore: true,
  		},
  	}
  }) {}

  ```

  Search can then be implemented to look for the appropriate metadata, and leverage it to omit the unwanted position data from search.

  #### Potential for breaking existing code

  These changes add the new property "metadata" to the base type from which all node schema derive.
  If you have existing node schema subclasses that include a property of this name, there is a chance for potential conflict here that could be breaking.
  If you encounter issues here, consider renaming your property or leveraging the new metadata support.

- New alpha APIs for schema evolution ([#23362](https://github.com/microsoft/FluidFramework/pull/23362)) [2406e00efe](https://github.com/microsoft/FluidFramework/commit/2406e00efed282be58a9e09cb3478c9a9d170ef0)

  There are now `@alpha` APIs for schema evolution which support adding optional fields to object node types without a staged rollout.

  SharedTree has many safety checks in place to ensure applications understand the format of documents they must support.
  One of these checks verifies that the view schema (defined in application's code) aligns with the document schema (determined by the document data at rest).
  This helps to ensure that clients running incompatible versions of the application's code don't collaborate at the same time on some document, which could cause data loss or disrupt application invariants.
  One general solution application authors can perform is to stage the rollout of a feature which changes document schema into multiple phases:

  1. Release an application version which understands documents written with the new format but doesn't attempt to upgrade any documents
  2. Wait for this application version to saturate in the app's ecosystem
  3. Release an application version which upgrades documents to start leveraging the new format.

  However, this process can be cumbersome for application authors: for many types of changes, an app author doesn't particularly care if older application code collaborates with newer code, as the only downside is that the older application version might not present a fully faithful experience.
  As an example, consider an application which renders circles on a canvas (similar to what is presented [here](https://github.com/microsoft/FluidFramework/blob/main/packages/dds/tree/docs/user-facing/schema-evolution.md)).
  The application author might anticipate adding support to render the circle with various different other properties (border style, border width, background color, varying radius, etc.).
  Therefore, they should declare their schema using `SchemaFactoryObjectOptions.allowUnknownOptionalFields` like so:

  ```typescript
  import { SchemaFactoryAlpha } from "@fluidframework/tree/alpha";
  // "Old" application code/schema
  const factory = new SchemaFactoryAlpha("Geometry");
  class Circle extends factory.object(
    "Circle",
    {
      x: factory.number,
      y: factory.number,
    },
    { allowUnknownOptionalFields: true },
  ) {}
  ```

  Later, they add some of these features to their application:

  ```typescript
  import { SchemaFactoryAlpha } from "@fluidframework/tree/alpha";
  // "New" application code/schema
  const factory = new SchemaFactoryAlpha("Geometry");
  class Circle extends factory.object(
    "Circle",
    {
      x: factory.number,
      y: factory.number,
      // Note that radius and color must both be declared as optional fields since this application must
      // support opening up existing documents that didn't have this information.
      radius: factory.optional(factory.number),
      color: factory.optional(factory.string), // ex: #00FF00
    },
    { allowUnknownOptionalFields: true },
  ) {}
  ```

  When they go to deploy this newer version of the application, they could opt to start upgrading documents as soon as the newer code is rolled out, and the older code would still be able to open up (and collaborate on) documents using the newer schema version.
  Note that it's only important that the old _application code_ elected to allow opening documents with unknown optional fields.
  This policy is not persisted into documents in any form, so applications are free to modify it at any point.

  For specific API details, see documentation on `SchemaFactoryObjectOptions.allowUnknownOptionalFields`.
  For a more thorough discussion of this topic, see [Schema Evolvability](https://github.com/microsoft/FluidFramework/tree/main/packages/dds/tree#schema-evolvability) in the SharedTree README.

## 2.12.0

Dependency updates only.

## 2.11.0

### Minor Changes

- Revertible objects can now be cloned using `RevertibleAlpha.clone()` ([#23044](https://github.com/microsoft/FluidFramework/pull/23044)) [5abfa015af](https://github.com/microsoft/FluidFramework/commit/5abfa015aff9d639d82830f3ad828324d5680bd7)

  The `DisposableRevertible` interface has been replaced with `RevertibleAlpha`. The new `RevertibleAlpha` interface extends `Revertible` and includes a `clone(branch: TreeBranch)` method to facilitate cloning a Revertible to a specified target branch. The source branch where the `RevertibleAlpha` was created must share revision logs with the target branch where the `RevertibleAlpha` is being cloned. If this condition is not met, the operation will throw an error.

- Providing unused properties in object literals for building empty ObjectNodes no longer compiles ([#23162](https://github.com/microsoft/FluidFramework/pull/23162)) [dc3c30019e](https://github.com/microsoft/FluidFramework/commit/dc3c30019ef869b27b9468bff59f10434d3c5c68)

  ObjectNodes with no fields will now emit a compiler error if constructed from an object literal with fields.
  This matches the behavior of non-empty ObjectNodes which already gave errors when unexpected properties were provided.

  ```typescript
  class A extends schemaFactory.object("A", {}) {}
  const a = new A({ thisDoesNotExist: 5 }); // This now errors.
  ```

- ✨ New! Alpha APIs for indexing ([#22491](https://github.com/microsoft/FluidFramework/pull/22491)) [cd95357ba8](https://github.com/microsoft/FluidFramework/commit/cd95357ba8f8cea6615f4fb0e9a62743770dce83)

  SharedTree now supports indexing via two new APIs, `createSimpleTreeIndex` and `createIdentifierIndex`.

  `createSimpleTreeIndex` is used to create a `SimpleTreeIndex` which indexes nodes based on their schema.
  Depending on the schema, the user specifies which field to key the node on.

  The following example indexes `IndexableParent`s and `IndexableChild`s and returns the first node of a particular key:

  ```typescript
  function isStringKey(key: TreeIndexKey): key is string {
    return typeof key === "string";
  }

  const index = createSimpleTreeIndex(
    view,
    new Map([
      [IndexableParent, parentKey],
      [IndexableChild, childKey],
    ]),
    (nodes) => nodes[0],
    isStringKey,
    [IndexableParent, IndexableChild],
  );
  ```

  `createIdentifierIndex` is used to create an `IdentifierIndex` which provides an efficient way to retrieve nodes using the node identifier.

  Example:

  ```typescript
  const identifierIndex = createIdentifierIndex(view);
  const node = identifierIndex.get("node12345");
  ```

## 2.10.0

### Minor Changes

- Unsupported merge-tree types and related exposed internals have been removed ([#22696](https://github.com/microsoft/FluidFramework/pull/22696)) [7a032533a6](https://github.com/microsoft/FluidFramework/commit/7a032533a6ee6a6f76fe154ef65dfa33f87e5a7b)

  As part of ongoing improvements, several internal types and related APIs have been removed. These types are unnecessary for any supported scenarios and could lead to errors if used. Since directly using these types would likely result in errors, these changes are not likely to impact any Fluid Framework consumers.

  Removed types:

  - IMergeTreeTextHelper
  - MergeNode
  - ObliterateInfo
  - PropertiesManager
  - PropertiesRollback
  - SegmentGroup
  - SegmentGroupCollection

  In addition to removing the above types, they are no longer exposed through the following interfaces and their implementations: `ISegment`, `ReferencePosition`, and `ISerializableInterval`.

  Removed functions:

  - addProperties
  - ack

  Removed properties:

  - propertyManager
  - segmentGroups

  The initial deprecations of the now changed or removed types were announced in Fluid Framework v2.2.0:
  [Fluid Framework v2.2.0](https://github.com/microsoft/FluidFramework/blob/main/RELEASE_NOTES/2.2.0.md)

- Fix typing bug in `adaptEnum` and `enumFromStrings` ([#23077](https://github.com/microsoft/FluidFramework/pull/23077)) [cfb68388cb](https://github.com/microsoft/FluidFramework/commit/cfb68388cb6b88a0ef670633b3afa46a82c99972)

  When using the return value from [`adaptEnum`](https://fluidframework.com/docs/api/v2/tree#adaptenum-function) as a function, passing in a value who's type is a union no longer produced an incorrectly typed return value. This has been fixed.

  Additionally [`enumFromStrings`](https://fluidframework.com/docs/api/v2/tree#enumfromstrings-function) has improved the typing of its schema, ensuring the returned object's members have sufficiently specific types.
  Part of this improvement was fixing the `.schema` property to be a tuple over each of the schema where it was previously a tuple of a single combined schema due to a bug.

  One side-effect of these fixes is that narrowing of the `value` field of a node typed from the `.schema` behaves slightly different, such that the node type is now a union instead of it being a single type with a `.value` that is a union.
  This means that narrowing based on `.value` property narrows which node type you have, not just the value property.
  This mainly matters when matching all cases like the switch statement below:

  ```typescript
  const Mode = enumFromStrings(schema, ["Fun", "Bonus"]);
  type Mode = TreeNodeFromImplicitAllowedTypes<typeof Mode.schema>;
  const node = new Mode.Bonus() as Mode;

  switch (node.value) {
    case "Fun": {
      assert.fail();
    }
    case "Bonus": {
      // This one runs
      break;
    }
    default:
      // Before this change, "node.value" was never here, now "node" is never.
      unreachableCase(node);
  }
  ```

- SharedTree event listeners that implement `Listenable` now allow deregistration of event listeners via an `off()` function. ([#23046](https://github.com/microsoft/FluidFramework/pull/23046)) [c59225db03](https://github.com/microsoft/FluidFramework/commit/c59225db033a516ee20e459ae31567d97ce8776c)

  The ability to deregister events via a callback returned by `on()` remains the same.
  Both strategies will remain supported and consumers of SharedTree events may choose which method of deregistration they prefer in a given instance.

  ```typescript
  // The new behavior
  function deregisterViaOff(view: TreeView<MySchema>): {
  	const listener = () => { /* ... */ };
  	view.events.on("commitApplied", listener); // Register
  	view.events.off("commitApplied", listener); // Deregister
  }

  // The existing behavior (still supported)
  function deregisterViaCallback(view: TreeView<MySchema>): {
  	const off = view.events.on("commitApplied", () => { /* ... */ }); // Register
  	off(); // Deregister
  }
  ```

- Allow constructing recursive maps from objects ([#23070](https://github.com/microsoft/FluidFramework/pull/23070)) [0185a08c6f](https://github.com/microsoft/FluidFramework/commit/0185a08c6f8bf6e922a6467f11da049503c4d215)

  Previously only non-recursive maps could be constructed from objects.
  Now all maps nodes can constructed from objects:

  ```typescript
  class MapRecursive extends sf.mapRecursive("Map", [() => MapRecursive]) {}
  {
    type _check = ValidateRecursiveSchema<typeof MapRecursive>;
  }
  // New:
  const fromObject = new MapRecursive({ x: new MapRecursive() });
  // Existing:
  const fromIterator = new MapRecursive([["x", new MapRecursive()]]);
  const fromMap = new MapRecursive(new Map([["x", new MapRecursive()]]));
  const fromNothing = new MapRecursive();
  const fromUndefined = new MapRecursive(undefined);
  ```

- SharedString DDS annotateAdjustRange ([#22751](https://github.com/microsoft/FluidFramework/pull/22751)) [d54b9dde14](https://github.com/microsoft/FluidFramework/commit/d54b9dde14e9e0e5eb7999db8ebf6da98fdfb526)

  This update introduces a new feature to the `SharedString` DDS, allowing for the adjustment of properties over a specified range. The `annotateAdjustRange` method enables users to apply adjustments to properties within a given range, providing more flexibility and control over property modifications.

  An adjustment is a modification applied to a property value within a specified range. Adjustments can be used to increment or decrement property values dynamically. They are particularly useful in scenarios where property values need to be updated based on user interactions or other events. For example, in a rich text editor, adjustments can be used for modifying indentation levels or font sizes, where multiple users could apply differing numerical adjustments.

  ### Key Features and Use Cases:

  - **Adjustments with Constraints**: Adjustments can include optional minimum and maximum constraints to ensure the final value falls within specified bounds. This is particularly useful for maintaining consistent formatting in rich text editors.
  - **Consistent Property Changes**: The feature ensures that property changes are consistent, managing both local and remote changes effectively. This is essential for collaborative rich text editing where multiple users may be making adjustments simultaneously.
  - **Rich Text Formatting**: Adjustments can be used to modify text properties such as font size, indentation, or other formatting attributes dynamically based on user actions.

  ### Configuration and Compatibility Requirements:

  This feature is only available when the configuration `Fluid.Sequence.mergeTreeEnableAnnotateAdjust` is set to `true`. Additionally, all collaborating clients must have this feature enabled to use it. If any client does not have this feature enabled, it will lead to the client exiting collaboration. A future major version of Fluid will enable this feature by default.

  ### Usage Example:

  ```typescript
  sharedString.annotateAdjustRange(start, end, {
    key: { value: 5, min: 0, max: 10 },
  });
  ```

- MergeTree `Client` Legacy API Removed ([#22697](https://github.com/microsoft/FluidFramework/pull/22697)) [2aa0b5e794](https://github.com/microsoft/FluidFramework/commit/2aa0b5e7941efe52386782595f96ff847c786fc3)

  The `Client` class in the merge-tree package has been removed. Types that directly or indirectly expose the merge-tree `Client` class have also been removed.

  The removed types were not meant to be used directly, and direct usage was not supported:

  - AttributionPolicy
  - IClientEvents
  - IMergeTreeAttributionOptions
  - SharedSegmentSequence
  - SharedStringClass

  Some classes that referenced the `Client` class have been transitioned to interfaces. Direct instantiation of these classes was not supported or necessary for any supported scenario, so the change to an interface should not impact usage. This applies to the following types:

  - SequenceInterval
  - SequenceEvent
  - SequenceDeltaEvent
  - SequenceMaintenanceEvent

  The initial deprecations of the now changed or removed types were announced in Fluid Framework v2.4.0:
  [Several MergeTree Client Legacy APIs are now deprecated](https://github.com/microsoft/FluidFramework/blob/main/RELEASE_NOTES/2.4.0.md#several-mergetree-client-legacy-apis-are-now-deprecated-22629)

## 2.5.0

### Minor Changes

- ✨ New! Alpha APIs for tree data import and export ([#22566](https://github.com/microsoft/FluidFramework/pull/22566)) [18a23e8816](https://github.com/microsoft/FluidFramework/commit/18a23e8816467f2ed0c9d6d8637b70d99aa48b7a)

  A collection of new `@alpha` APIs for importing and exporting tree content and schema from SharedTrees has been added to `TreeAlpha`.
  These include import and export APIs for `VerboseTree`, `ConciseTree` and compressed tree formats.

  `TreeAlpha.create` is also added to allow constructing trees with a more general API instead of having to use the schema constructor directly (since that doesn't handle polymorphic roots, or non-schema aware code).

  The function `independentInitializedView` has been added to provide a way to combine data from the existing `extractPersistedSchema` and new `TreeAlpha.exportCompressed` back into a `TreeView` in a way which can support safely importing data which could have been exported with a different schema.
  This allows replicating the schema evolution process for Fluid documents stored in a service, but entirely locally without involving any collaboration services.
  `independentView` has also been added, which is similar but handles the case of creating a new view without an existing schema or tree.

  Together these APIs address several use-cases:

  1. Using SharedTree as an in-memory non-collaborative datastore.
  2. Importing and exporting data from a SharedTree to and from other services or storage locations (such as locally saved files).
  3. Testing various scenarios without relying on a service.
  4. Using SharedTree libraries for just the schema system and encode/decode support.

- Compilation no longer fails when building with TypeScript's libCheck option ([#22923](https://github.com/microsoft/FluidFramework/pull/22923)) [a1b4cdd45e](https://github.com/microsoft/FluidFramework/commit/a1b4cdd45ee9812e2598ab8d2854333d26a06eb4)

  When compiling code using Fluid Framework with TypeScript's `libCheck` (meaning without [skipLibCheck](https://www.typescriptlang.org/tsconfig/#skipLibCheck)), two compile errors can be encountered:

  ```
  > tsc

  node_modules/@fluidframework/merge-tree/lib/client.d.ts:124:18 - error TS2368: Type parameter name cannot be 'undefined'.

  124     walkSegments<undefined>(handler: ISegmentAction<undefined>, start?: number, end?: number, accum?: undefined, splitRange?: boolean): void;
                       ~~~~~~~~~

  node_modules/@fluidframework/tree/lib/util/utils.d.ts:5:29 - error TS7016: Could not find a declaration file for module '@ungap/structured-clone'. 'node_modules/@ungap/structured-clone/esm/index.js' implicitly has an 'any' type.
    Try `npm i --save-dev @types/ungap__structured-clone` if it exists or add a new declaration (.d.ts) file containing `declare module '@ungap/structured-clone';`

  5 import structuredClone from "@ungap/structured-clone";
                                ~~~~~~~~~~~~~~~~~~~~~~~~~
  ```

  The first error impacts projects using TypeScript 5.5 or greater and either of the `fluid-framework` or `@fluidframework/merge-tree` packages.
  The second error impacts projects using the `noImplicitAny` tsconfig setting and the `fluid-framework` or `@fluidframework/tree` packages.

  Both errors have been fixed.

  This should allow `libCheck` to be reenabled in any impacted projects.

- A `.schema` member has been added to the alpha enum schema APIs ([#22874](https://github.com/microsoft/FluidFramework/pull/22874)) [645b9ed695](https://github.com/microsoft/FluidFramework/commit/645b9ed69540338843ad14f1144ff4d1f80d6f09)

  The return value from `@alpha` APIs `enumFromStrings` and `adaptEnum` now has a property named `schema` which can be used to include it in a parent schema.
  This replaces the use of `typedObjectValues` which has been removed.

  Use of these APIs now look like:

  ```typescript
  const schemaFactory = new SchemaFactory("com.myApp");
  const Mode = enumFromStrings(schemaFactory, ["Fun", "Cool"]);
  type Mode = NodeFromSchema<(typeof Mode.schema)[number]>;
  class Parent extends schemaFactory.object("Parent", { mode: Mode.schema }) {}
  ```

  Previously, the last two lines would have been:

  ```typescript
  type Mode = NodeFromSchema<(typeof Mode)[keyof typeof Mode]>; // This no longer works
  class Parent extends schemaFactory.object("Parent", {
    mode: typedObjectValues(Mode),
  }) {} // This no longer works
  ```

- TreeNodeSchemaClass now specifies its TNode as TreeNode ([#22938](https://github.com/microsoft/FluidFramework/pull/22938)) [b669a6efdb](https://github.com/microsoft/FluidFramework/commit/b669a6efdba685c71897cade4f907304f1a73910)

  `TreeNodeSchemaClass`'s `TNode` parameter was formerly `unknown` and has been improved to be the more specific `TreeNode | TreeLeafValue`.
  This change further narrows this to `TreeNode`.

  `TreeNodeSchema`, which is more commonly used, still permits `TNode` of `TreeNode | TreeLeafValue`, so this change should have little impact on most code, but in some edge cases it can result in slightly more specific typing.

- Array and Map nodes can now be explicitly constructed with undefined or no argument ([#22946](https://github.com/microsoft/FluidFramework/pull/22946)) [176335ce88](https://github.com/microsoft/FluidFramework/commit/176335ce88d005159819c559b445a1655ec429d5)

  The input parameter to the constructor and `create` methods of Array and Map nodes is now optional. When the optional parameter is omitted, an empty map or array will be created.

  #### Examples

  ```typescript
  class Schema extends schemaFactory.array("x", schemaFactory.number) {}

  // Existing support
  const _fromIterable: Schema = new Schema([]);

  // New
  const _fromUndefined: Schema = new Schema(undefined);
  const _fromNothing: Schema = new Schema();
  ```

  ```typescript
  class Schema extends schemaFactory.map("x", schemaFactory.number) {}

  // Existing support
  const _fromIterable: Schema = new Schema([]);
  const _fromObject: Schema = new Schema({});

  // New
  const _fromUndefined: Schema = new Schema(undefined);
  const _fromNothing: Schema = new Schema();
  ```

  ```typescript
  const Schema = schemaFactory.array(schemaFactory.number);
  type Schema = NodeFromSchema<typeof Schema>;

  // Existing support
  const _fromIterable: Schema = Schema.create([]);

  // New
  const _fromUndefined: Schema = Schema.create(undefined);
  const _fromNothing: Schema = Schema.create();
  ```

  ```typescript
  const Schema = schemaFactory.map(schemaFactory.number);
  type Schema = NodeFromSchema<typeof Schema>;
  // Existing support
  const _fromIterable: Schema = Schema.create([]);
  const _fromObject: Schema = Schema.create({});

  // New
  const _fromUndefined: Schema = Schema.create(undefined);
  const _fromNothing: Schema = Schema.create();
  ```

- Typing has been improved when an exact TypeScript type for a schema is not provided ([#22763](https://github.com/microsoft/FluidFramework/pull/22763)) [05197d6d3f](https://github.com/microsoft/FluidFramework/commit/05197d6d3f0189ecd61fd74ec55f6836e6797249)

  The Tree APIs are designed to be used in a strongly typed way, with the full TypeScript type for the schema always being provided.
  Due to limitations of the TypeScript language, there was no practical way to prevent less descriptive types, like `TreeNodeSchema` or `ImplicitFieldSchema`, from being used where the type of a specific schema was intended.
  Code which does this will encounter several issues with tree APIs, and this change fixes some of those issues.
  This change mainly fixes that `NodeFromSchema<TreeNodeSchema>` used to return `unknown` and now returns `TreeNode | TreeLeafValue`.

  This change by itself seems mostly harmless, as it just improves the precision of the typing in this one edge case.
  Unfortunately, there are other typing bugs which complicate the situation, causing APIs for inserting data into the tree to also behave poorly when given non-specific types like `TreeNodeSchema`.
  These APIs include cases like `TreeView.initialize`.

  This incorrectly allowed some usage like taking a type-erased schema and initial tree pair, creating a view of type `TreeView<ImplicitFieldSchema>`, then initializing it.
  With the typing being partly fixed, some unsafe inputs are still allowed when trying to initialize such a view, but some are now prevented.

  This use-case of modifying trees in code not that is not strongly typed by the exact schema was not intended to be supported.
  Despite this, it did mostly work in some cases, and has some real use-cases (like tests looping over test data consisting of pairs of schema and initial trees).
  To help mitigate the impact of this change, some experimental `@alpha` APIs have been introduced to help address these previously unsupported but somewhat working use-cases.

  Before this change:

  ```typescript
  import { TinyliciousClient } from "@fluidframework/tinylicious-client";
  import {
    SchemaFactory,
    SharedTree,
    TreeViewConfiguration,
    type TreeNodeSchema,
  } from "fluid-framework";

  // Create a ITree instance
  const tinyliciousClient = new TinyliciousClient();
  const { container } = await tinyliciousClient.createContainer(
    { initialObjects: {} },
    "2",
  );
  const tree = await container.create(SharedTree);

  const schemaFactory = new SchemaFactory("demo");

  // Bad: This loses the schema aware type information. `: TreeNodeSchema` should be omitted to preserve strong typing.
  const schema: TreeNodeSchema = schemaFactory.array(schemaFactory.number);
  const config = new TreeViewConfiguration({ schema });

  // This view is typed as `TreeView<TreeNodeSchema>`, which does not work well since it's missing the actual schema type information.
  const view = tree.viewWith(config);
  // Root is typed as `unknown` allowing invalid assignment operations.
  view.root = "invalid";
  view.root = {};
  // Since all assignments are allowed, valid ones still work:
  view.root = [];
  ```

  After this change:

  ```typescript
  // Root is now typed as `TreeNode | TreeLeafValue`, still allowing some invalid assignment operations.
  // In the future this should be prevented as well, since the type of the setter in this case should be `never`.
  view.root = "invalid";
  // This no longer compiles:
  view.root = {};
  // This also no longer compiles despite being valid at runtime:
  view.root = [];
  ```

  For code that wants to continue using an unsafe API, which can result in runtime errors if the data does not follow the schema, a new alternative has been added to address this use-case. A special type `UnsafeUnknownSchema` can now be used to opt into allowing all valid trees to be provided.
  Note that this leaves ensuring the data is in schema up to the user.
  For now these adjusted APIs can be accessed by casting the view to `TreeViewAlpha<UnsafeUnknownSchema>`.
  If stabilized, this option will be added to `TreeView` directly.

  ```typescript
  const viewAlpha = view as TreeViewAlpha<UnsafeUnknownSchema>;
  viewAlpha.initialize([]);
  viewAlpha.root = [];
  ```

  Additionally, this seems to have negatively impacted co-recursive schema which declare a co-recursive array as the first schema in the co-recursive cycle.
  Like the TypeScript language our schema system is built on, we don't guarantee exactly which recursive type will compile, but will do our best to ensure useful recursive schema can be created easily.
  In this case a slight change may be required to some recursive schema to get them to compile again:

  For example this schema used to compile:

  ```typescript
  class A extends sf.arrayRecursive("A", [() => B]) {}
  {
    type _check = ValidateRecursiveSchema<typeof A>;
  }
  // Used to work, but breaks in this update.
  class B extends sf.object("B", { x: A }) {}
  ```

  But now you must use the recursive functions like `objectRecursive` for types which are co-recursive with an array in some cases.
  In our example, it can be fixed as follows:

  ```typescript
  class A extends sf.arrayRecursive("A", [() => B]) {}
  {
    type _check = ValidateRecursiveSchema<typeof A>;
  }
  // Fixed corecursive type, using "Recursive" method variant to declare schema.
  class B extends sf.objectRecursive("B", { x: A }) {}
  {
    type _check = ValidateRecursiveSchema<typeof B>;
  }
  ```

  Note: while the following pattern may still compile, we recommend using the previous pattern instead since the one below may break in the future.

  ```typescript
  class B extends sf.objectRecursive("B", { x: [() => A] }) {}
  {
    type _check = ValidateRecursiveSchema<typeof B>;
  }
  // Works, for now, but not recommended.
  class A extends sf.array("A", B) {}
  ```

- The strictness of input tree types when inexact schemas are provided has been improved ([#22874](https://github.com/microsoft/FluidFramework/pull/22874)) [645b9ed695](https://github.com/microsoft/FluidFramework/commit/645b9ed69540338843ad14f1144ff4d1f80d6f09)

  Consider the following code where the type of the schema is not exactly specified:

  ```typescript
  const schemaFactory = new SchemaFactory("com.myApp");
  class A extends schemaFactory.object("A", {}) {}
  class B extends schemaFactory.array("B", schemaFactory.number) {}

  // Gives imprecise type (typeof A | typeof B)[]. The desired precise type here is [typeof A, typeof B].
  const schema = [A, B];

  const config = new TreeViewConfiguration({ schema });
  const view = sharedTree.viewWith(config);

  // Does not compile since setter for root is typed `never` due to imprecise schema.
  view.root = [];
  ```

  The assignment of `view.root` is disallowed since a schema with type `(typeof A | typeof B)[]` could be any of:

  ```typescript
  const schema: (typeof A | typeof B)[] = [A];
  ```

  ```typescript
  const schema: (typeof A | typeof B)[] = [B];
  ```

  ```typescript
  const schema: (typeof A | typeof B)[] = [A, B];
  ```

  The attempted assignment is not compatible with all of these (specifically it is incompatible with the first one) so performing this assignment could make the tree out of schema and is thus disallowed.

  To avoid this ambiguity and capture the precise type of `[typeof A, typeof B]`, use one of the following patterns:

  ```typescript
  const schema = [A, B] as const;
  const config = new TreeViewConfiguration({ schema });
  ```

  ```typescript
  const config = new TreeViewConfiguration({ schema: [A, B] });
  ```

  To help update existing code which accidentally depended on this bug, an `@alpha` API `unsafeArrayToTuple` has been added.
  Many usages of this API will produce incorrectly typed outputs.
  However, when given `AllowedTypes` arrays which should not contain any unions, but that were accidentally flattened to a single union, it can fix them:

  ```typescript
  // Gives imprecise type (typeof A | typeof B)[]
  const schemaBad = [A, B];
  // Fixes the type to be [typeof A, typeof B]
  const schema = unsafeArrayToTuple(schemaBad);

  const config = new TreeViewConfiguration({ schema });
  ```

## 2.4.0

### Minor Changes

- ✨ New! Alpha API for providing SharedTree configuration options ([#22701](https://github.com/microsoft/FluidFramework/pull/22701)) [40d3648ddf](https://github.com/microsoft/FluidFramework/commit/40d3648ddfb5223ef6daef49a4f5cab1cfa52b71)

  A new alpha `configuredSharedTree` had been added.
  This allows providing configuration options, primarily for debugging, testing and evaluation of upcoming features.
  The resulting configured `SharedTree` object can then be used in-place of the regular `SharedTree` imported from `fluid-framework`.

  ```typescript
  import {
    ForestType,
    TreeCompressionStrategy,
    configuredSharedTree,
    typeboxValidator,
  } from "@fluid-framework/alpha";
  // Maximum debuggability and validation enabled:
  const SharedTree = configuredSharedTree({
    forest: ForestType.Expensive,
    jsonValidator: typeboxValidator,
    treeEncodeType: TreeCompressionStrategy.Uncompressed,
  });
  // Opts into the under development optimized tree storage planned to be the eventual default implementation:
  const SharedTree = configuredSharedTree({
    forest: ForestType.Optimized,
  });
  ```

- ✨ New! Alpha API for snapshotting Schema ([#22733](https://github.com/microsoft/FluidFramework/pull/22733)) [920a65f66e](https://github.com/microsoft/FluidFramework/commit/920a65f66e0caad7e1b5e3df1e0afd3475a87c4a)

  `extractPersistedSchema` can now be used to extra a JSON-compatible representation of the subset of a schema that gets stored in documents.
  This can be used write tests which snapshot an applications schema.
  Such tests can be used to detect schema changes which could would impact document compatibility,
  and can be combined with the new `comparePersistedSchema` to measure what kind of compatibility impact the schema change has.

- Fix reading of `null` from unhydrated trees ([#22748](https://github.com/microsoft/FluidFramework/pull/22748)) [6a75bd0616](https://github.com/microsoft/FluidFramework/commit/6a75bd0616ecd315ae0e9458d88ba1c755dfd785)

  Unhydrated trees containing object nodes with required fields set to `null` used to throw an error.
  This was a bug: `null` is a valid value in tree's whose schema allow it, and this specific case now correctly returns `null` values when appropriate without erroring.

- ✨ New! Alpha SharedTree branching APIs ([#22550](https://github.com/microsoft/FluidFramework/pull/22550)) [8f4587c912](https://github.com/microsoft/FluidFramework/commit/8f4587c912f955c405d7bbbc5b42f3ffc3b497d7)

  Several APIs have been added to allow for creating and coordinating "version-control"-style branches of the SharedTree.
  Use the `getBranch` entry point function to acquire a branch.
  For example:

  ```ts
  function makeEditOnBranch(mainView: TreeView<typeof MySchema>) {
    mainView.root.myData = 3;
    const mainBranch = getBranch(mainView); // This function accepts either a view of a SharedTree (acquired e.g. via `sharedTree.viewWith(...)`) or a `SharedTree` directly.
    const forkBranch = mainBranch.branch(); // This creates a new branch based on the existing branch.
    const forkView = forkBranch.viewWith(
      new TreeViewConfiguration({ schema: MySchema }),
    ); // Acquire a view of the forked branch in order to read or edit its tree.
    forkView.root.myData = 4; // Set the value on the fork branch to be 4. The main branch still has a value of 3.
    mainBranch.merge(forkBranch); // Merging the fork changes into the main branch causes the main branch to have a value of 4.

    // Note: The main branch (and therefore, also the `forkView`) is automatically disposed by the merge.
    // To prevent this, use `mainBranch.merge(forkBranch, false)`.
  }
  ```

  Merging any number of commits into a target branch (via the `TreeBranch.merge` method) generates a revertible for each
  commit on the target branch. See [#22644](https://github.com/microsoft/FluidFramework/pull/22644) for more information
  about revertible support in the branching APIs.

- SharedTree's `RestrictiveReadonlyRecord` is deprecated ([#22479](https://github.com/microsoft/FluidFramework/pull/22479)) [8be73d374d](https://github.com/microsoft/FluidFramework/commit/8be73d374de04ff6226c531ba8b562561572640f)

  `RestrictiveReadonlyRecord` was an attempt to implement a version of TypeScript's built-in `Record<TKey, TValue>` type that would prohibit (instead of leaving unrestricted like Record does) values under keys that do not extend `TKey`.

  The implementation of `RestrictiveReadonlyRecord` failed to accomplish this except for the edge cases where `TKey` was exactly `string` or exactly `symbol`.
  Fixing this bug appears to be impossible within the current limitation of TypeScript, however this library does not require any case other than `TKey` being exactly `string`.

  To reduce the risk of users of the tree library using the problematic `RestrictiveReadonlyRecord` type, it has been deprecated and replaced with a more specific type that avoids the bug, `RestrictiveStringRecord<TValue>`.

  To highlight that this new type is not intended for direct use by users of tree, and instead is just used as part of the typing of its public API, `RestrictiveStringRecord` has been tagged with `@system`.
  See [API Support Levels](https://fluidframework.com/docs/build/releases-and-apitags/#api-support-levels) for more details.

- Fix `.create` on structurally named MapNode and ArrayNode schema ([#22522](https://github.com/microsoft/FluidFramework/pull/22522)) [b3f91ae91c](https://github.com/microsoft/FluidFramework/commit/b3f91ae91cb750a6a7696ab5ea17c00895bb6d92)

  Constructing a structurally named MapNode or ArrayNode schema (using the overload of `SchemaFactory.map` or `SchemaFactory.array` which does not take an explicit name), returned a `TreeNodeSchema` instead of a `TreeNodeSchemaNonClass`, which resulted in the `create` static method not being exposed.
  This has been fixed, and can now be used as follows:

  ```typescript
  const MyMap = schemaFactory.map(schemaFactory.number);
  type MyMap = NodeFromSchema<typeof MyMap>;
  const _fromMap: MyMap = MyMap.create(new MyMap());
  const _fromIterable: MyMap = MyMap.create([]);
  const _fromObject: MyMap = MyMap.create({});
  ```

  This change causes some types to reference `TreeNodeSchemaNonClass` which did not reference it before.
  While `TreeNodeSchemaNonClass` is `@system` (See [Fluid Releases and API Support Levels
  ](https://fluidframework.com/docs/build/releases-and-apitags/) for details) and thus not intended to be referred to by users of Fluid,
  this change caused the TypeScript compiler to generate references to it in more cases when compiling `d.ts` files.
  Since the TypeScript compiler is unable to generate references to `TreeNodeSchemaNonClass` with how it was nested in `internalTypes.js`,
  this change could break the build of packages exporting types referencing structurally named map and array schema.
  This has been mitigated by moving `TreeNodeSchemaNonClass` out of `internalTypes.js`:
  any code importing `TreeNodeSchemaNonClass` (and thus disregarding the `@system` restriction) can be fixed by importing it from the top level instead of the `internalTypes.js`

- Non-leaf field access has been optimized ([#22717](https://github.com/microsoft/FluidFramework/pull/22717)) [6a2b68103c](https://github.com/microsoft/FluidFramework/commit/6a2b68103cc3ad56a9ac0dfcaaa8546978ec29ac)

  When reading non-leaf children which have been read previously, they are retrieved from cache faster.
  Several operations on subtrees under arrays have been optimized, including reading of non-leaf nodes for the first time.
  Overall this showed a roughly 5% speed up in a read heavy test application (the BubbleBench example) but gains are expected to vary a lot based on use-case.

- ✨ New! Alpha APIs for producing SharedTree schema from enums ([#20035](https://github.com/microsoft/FluidFramework/pull/20035)) [5f9bbe011a](https://github.com/microsoft/FluidFramework/commit/5f9bbe011a18ccac08a70340f6d20e60ce30c4a4)

  `adaptEnum` and `enumFromStrings` have been added to `@fluidframework/tree/alpha` and `fluid-framework/alpha`.
  These unstable alpha APIs are relatively simple helpers on-top of public APIs (source: [schemaCreationUtilities.ts](https://github.com/microsoft/FluidFramework/blob/main/packages/dds/tree/src/simple-tree/schemaCreationUtilities.ts)):
  thus if these change or stable alternatives are needed, an application can replicate this functionality using these implementations as an example.

## 2.3.0

### Minor Changes

- Add /alpha import path to @fluidframework/tree and fluid-framework packages ([#22483](https://github.com/microsoft/FluidFramework/pull/22483)) [12242cfdb5a](https://github.com/microsoft/FluidFramework/commit/12242cfdb5aa4c342cc62f11cbf1c072840bec44)

  `@fluidframework/tree` and `fluid-framework` now have a `/alpha` import path where their `@alpha` APIs are exported.

- Export SharedTree beta APIs from fluid-framework/beta ([#22469](https://github.com/microsoft/FluidFramework/pull/22469)) [c51f55c01a6](https://github.com/microsoft/FluidFramework/commit/c51f55c01a641eb030f872b684e2862e57ad5197)

  `fluid-framework/beta` now contains the `@beta` APIs from `@fluidframework/tree/beta`.

- Implicitly constructed object nodes now only consider own properties during validation ([#22453](https://github.com/microsoft/FluidFramework/pull/22453)) [27faa56f5ae](https://github.com/microsoft/FluidFramework/commit/27faa56f5ae334e0b65fdd84c75764645e64f063)

  When determining if some given data is compatible with a particular ObjectNode schema, both inherited and own properties were considered.
  However, when constructing the node from this data, only own properties were used.
  This allowed input which provided required values in inherited fields to pass validation.
  When the node was constructed, it would lack these fields, and end up out of schema.
  This has been fixed: both validation and node construction now only consider own properties.

  This may cause some cases which previously exhibited data corruption to now throw a usage error reporting the data is incompatible.
  Such cases may need to copy data from the objects with inherited properties into new objects with own properties before constructing nodes from them.

- A `@beta` version of `nodeChanged` which includes the list of properties has been added ([#22229](https://github.com/microsoft/FluidFramework/pull/22229)) [aae34dd9fe1](https://github.com/microsoft/FluidFramework/commit/aae34dd9fe1aa6c153c26035f1486f4d8944c810)

  ```typescript
  const factory = new SchemaFactory("example");
  class Point2d extends factory.object("Point2d", {
    x: factory.number,
    y: factory.number,
  }) {}

  const point = new Point2d({ x: 0, y: 0 });

  TreeBeta.on(point, "nodeChanged", (data) => {
    const changed: ReadonlySet<"x" | "y"> = data.changedProperties;
    if (changed.has("x")) {
      // ...
    }
  });
  ```

  The payload of the `nodeChanged` event emitted by SharedTree's `TreeBeta` includes a `changedProperties` property that indicates
  which properties of the node changed.

  For object nodes, the list of properties uses the property identifiers defined in the schema, and not the persisted
  identifiers (or "stored keys") that can be provided through `FieldProps` when defining a schema.
  See the documentation for `FieldProps` for more details about the distinction between "property keys" and "stored keys".

  For map nodes, every key that was added, removed, or updated by a change to the tree is included in the list of properties.

  For array nodes, the set of properties will always be undefined: there is currently no API to get details about changes to an array.

  Object nodes revieve strongly types sets of changed keys, allowing compile time detection of incorrect keys:

  ```typescript
  TreeBeta.on(point, "nodeChanged", (data) => {
    // @ts-expect-error Strong typing for changed properties of object nodes detects incorrect keys:
    if (data.changedProperties.has("z")) {
      // ...
    }
  });
  ```

  The existing stable "nodeChanged" event's callback now is given a parameter called `unstable` of type `unknown` which is used to indicate that additional data can be provided there.
  This could break existing code using "nodeChanged" in a particularly fragile way.

  ```typescript
  function f(optional?: number) {
    // ...
  }
  Tree.on(point, "nodeChanged", f); // Bad
  ```

  Code like this which is implicitly discarding an optional argument from the function used as the listener will be broken.
  It can be fixed by using an inline lambda expression:

  ```typescript
  function f(optional?: number) {
    // ...
  }
  Tree.on(point, "nodeChanged", () => f()); // Safe
  ```

## 2.2.0

### Minor Changes

- The PropertyManager class and related functions and properties are deprecated ([#22183](https://github.com/microsoft/FluidFramework/pull/22183)) [cbba69554f](https://github.com/microsoft/FluidFramework/commit/cbba69554fc5026f562f44683a902474fabd6e81)

  The `PropertyManager` class, along with the `propertyManager` properties and `addProperties` functions on segments and intervals, are not intended for external use.
  These elements will be removed in a future release for the following reasons:

  - There are no scenarios where they need to be used directly.
  - Using them directly will cause eventual consistency problems.
  - Upcoming features will require modifications to these mechanisms.

- Compile-time type narrowing based on a TreeNode's NodeKind ([#22222](https://github.com/microsoft/FluidFramework/pull/22222)) [4d3bc876ae](https://github.com/microsoft/FluidFramework/commit/4d3bc876ae32fa3f2568299e29246f6970e48ee0)

  `TreeNode`'s schema-aware APIs implement `WithType`, which now has a `NodeKind` parameter that can be used to narrow `TreeNode`s based on `NodeKind`.

  Example:

  ```typescript
  function getKeys(node: TreeNode & WithType<string, NodeKind.Array>): number[];
  function getKeys(
    node: TreeNode & WithType<string, NodeKind.Map | NodeKind.Object>,
  ): string[];
  function getKeys(node: TreeNode): string[] | number[];
  function getKeys(node: TreeNode): string[] | number[] {
    const schema = Tree.schema(node);
    switch (schema.kind) {
      case NodeKind.Array: {
        const arrayNode = node as TreeArrayNode;
        const keys: number[] = [];
        for (let index = 0; index < arrayNode.length; index++) {
          keys.push(index);
        }
        return keys;
      }
      case NodeKind.Map:
        return [...(node as TreeMapNode).keys()];
      case NodeKind.Object:
        return Object.keys(node);
      default:
        throw new Error("Unsupported Kind");
    }
  }
  ```

- ✨ New! `Record`-typed objects can now be used to construct MapNodes ([#22042](https://github.com/microsoft/FluidFramework/pull/22042)) [25deff344b](https://github.com/microsoft/FluidFramework/commit/25deff344b447380486c1efb64ed69177c32ddc5)

  You can now construct MapNodes from `Record` typed objects, similar to how maps are expressed in JSON.

  Before this change, an `Iterable<string, Child>` was required, but now an object like `{key1: Child1, key2: Child2}` is allowed.

  Full example using this new API:

  ```typescript
  class Schema extends schemaFactory.map("ExampleMap", schemaFactory.number) {}
  const fromRecord = new Schema({ x: 5 });
  ```

  This new feature makes it possible for schemas to construct a tree entirely from JSON-compatible objects using their constructors,
  as long as they do not require unhydrated nodes to differentiate ambiguous unions,
  or IFluidHandles (which themselves are not JSON compatible).

  Due to limitations of TypeScript and recursive types,
  recursive maps do not advertise support for this feature in their typing,
  but it works at runtime.

- New SharedTree configuration option: `ITreeConfigurationOptions.preventAmbiguity` ([#22048](https://github.com/microsoft/FluidFramework/pull/22048)) [966906a034](https://github.com/microsoft/FluidFramework/commit/966906a03490daa5a914030b37342abb8267c12d)

  The new `ITreeConfigurationOptions.preventAmbiguity` flag can be set to true to enable checking of some additional rules when constructing the `TreeViewConfiguration`.

  This example shows an ambiguous schema:

  ```typescript
  const schemaFactory = new SchemaFactory("com.example");
  class Feet extends schemaFactory.object("Feet", {
    length: schemaFactory.number,
  }) {}
  class Meters extends schemaFactory.object("Meters", {
    length: schemaFactory.number,
  }) {}
  const config = new TreeViewConfiguration({
    // This combination of schema can lead to ambiguous cases, and will error since preventAmbiguity is true.
    schema: [Feet, Meters],
    preventAmbiguity: true,
  });
  const view = tree.viewWith(config);
  // This is invalid since it is ambiguous which type of node is being constructed.
  // The error thrown above when constructing the TreeViewConfiguration is because of this ambiguous case:
  view.initialize({ length: 5 });
  ```

  See the documentation on `ITreeConfigurationOptions.preventAmbiguity` for a more complete example and more details.

- `Tree.schema` now returns `TreeNodeSchema` ([#22185](https://github.com/microsoft/FluidFramework/pull/22185)) [bfe8310a94](https://github.com/microsoft/FluidFramework/commit/bfe8310a9406a8658c2fac8827c7114844c32234)

  The typing of `Tree.schema` has changed from:

  ```typescript
  schema<T extends TreeNode | TreeLeafValue>(node: T): TreeNodeSchema<string, NodeKind, unknown, T>;
  ```

  to:

  ```typescript
  schema(node: TreeNode | TreeLeafValue): TreeNodeSchema;
  ```

  The runtime behavior is unaffected: any code which worked and still compiles is fine and does not need changes.

  `Tree.schema` was changed to mitigate two different issues:

  1. It tried to give a more specific type based on the type of the passed in value.
     When the type of the input is not known precisely (for example it is a union of node types like `Foo | Bar`, or `TreeNode` or even `TreeNode | TreeLeafValue`), this was fine since schema are covariant over their node type.
     However when the input was more specific that the schema type, for example the type is simply `0`, this would result in unsound typing, since the create function could actually return values that did not conform with that schema (for example `schema.create(1)` for the number schema typed with `0` would return `1` with type `0`).
  2. The node type was provided to the incorrect type parameter of TreeNodeSchema.
     The `TNode` parameter is the third one, not the fourth.
     The fourth is `TBuild` which sets the input accepted to its create function or constructor.
     Thus this code accidentally left `TNode` unset (which is good due to the above issue), but invalidly set `TBuild`.
     `TBuild` is contravariant, so it has the opposite issue that setting `TNode` would have: if your input is simply typed as something general like `TreeNode`, then the returned schema would claim to be able to construct an instance given any `TreeNode`.
     This is incorrect, and this typing has been removed.

  Fortunately it should be rare for code to be impacted by this issue.
  Any code which manually specified a generic type parameter to `Tree.schema()` will break, as well as code which assigned its result to an overly specifically typed variable.
  Code which used `typeof` on the returned schema could also break, though there are few use-cases for this so such code is not expected to exist.
  Currently it's very difficult to invoke the create function or constructor associated with a `TreeNodeSchema` as doing so already requires narrowing to `TreeNodeSchemaClass` or `TreeNodeSchemaNonClass`.
  It is possible some such code exists which will need to have an explicit cast added because it happened to work with the more specific (but incorrect) constructor input type.

- Recursive SharedTree schemas using MapNodes no longer produce invalid d.ts files ([#22106](https://github.com/microsoft/FluidFramework/pull/22106)) [554fc5a94e](https://github.com/microsoft/FluidFramework/commit/554fc5a94e57e2d109ea9008b7c64517c58a6b73)

  Consider a recursive SharedTree schema like the following, which follows all our recommended best practices:

  ```typescript
  export class RecursiveMap extends schema.mapRecursive("RM", [
    () => RecursiveMap,
  ]) {}
  {
    type _check = ValidateRecursiveSchema<typeof RecursiveMap>;
  }
  ```

  This schema would work when used from within its compilation unit, but would generate d.ts that fails to compile when exporting it:

  ```typescript
  declare const RecursiveMap_base: import("@fluidframework/tree").TreeNodeSchemaClass<
    "com.example.RM",
    import("@fluidframework/tree").NodeKind.Map,
    import("@fluidframework/tree").TreeMapNodeUnsafe<
      readonly [() => typeof RecursiveMap]
    > &
      import("@fluidframework/tree").WithType<"com.example.RM">,
    {
      [Symbol.iterator](): Iterator<[string, RecursiveMap], any, undefined>;
    },
    false,
    readonly [() => typeof RecursiveMap]
  >;
  export declare class RecursiveMap extends RecursiveMap_base {}
  ```

  This results in the compile error in TypeScript 5.4.5:

  > error TS2310: Type 'RecursiveMap' recursively references itself as a base type.

  With this change, that error is fixed by modifying the `TreeMapNodeUnsafe` type it references to inline the definition of `ReadonlyMap` instead of using the one from the TypeScript standard library.

- ✨ New! When unambiguous, ArrayNodes can now be constructed from Maps and MapNodes from arrays ([#22036](https://github.com/microsoft/FluidFramework/pull/22036)) [25e74f9f3b](https://github.com/microsoft/FluidFramework/commit/25e74f9f3bed6e6ff041c088813c4cc1ea276b9c)

  Since the types for ArrayNodes and MapNodes indicate they can be constructed from iterables,
  it should work, even if those iterables are themselves arrays or maps.
  To avoid this being a breaking change, a priority system was introduced.
  ArrayNodes will only be implicitly constructable from JavaScript Map objects in contexts where no MapNodes are allowed.
  Similarly MapNodes will only be implicitly constructable from JavaScript Array objects in contexts where no ArrayNodes are allowed.

  In practice, the main case in which this is likely to matter is when implicitly constructing a map node. If you provide an array of key value pairs, this now works instead of erroring, as long as no ArrayNode is valid at that location in the tree.

  ```typescript
  class MyMapNode extends schemaFactory.map("x", schemaFactory.number) {}
  class Root extends schemaFactory.object("root", { data: MyMapNode }) {}
  // This now works (before it compiled, but error at runtime):
  const fromArray = new Root({ data: [["x", 5]] });
  ```

  Prior versions used to have to do:

  ```typescript
  new Root({ data: new MyMapNode([["x", 5]]) });
  ```

  or:

  ```typescript
  new Root({ data: new Map([["x", 5]]) });
  ```

  Both of these options still work: strictly more cases are allowed with this change.

- Implicit TreeNode construction improvements ([#21995](https://github.com/microsoft/FluidFramework/pull/21995)) [977f96c1a0](https://github.com/microsoft/FluidFramework/commit/977f96c1a0dd1d5eb0dbcd087d07cb7510d533ea)

  ArrayNodes and MapNodes could always be explicitly constructed (using `new`) from iterables.
  The types also allowed using of iterables to implicitly construct array nodes and map nodes,
  but this did not work at runtime.
  This has been fixed for all cases except implicitly constructing an ArrayNode form an `Iterable` that is actually a `Map`,
  and implicitly constructing a MapNode from an `Iterable` that is actually an `Array`.
  These cases may be fixed in the future, but require additional work to ensure unions of array nodes and map nodes work correctly.

  Additionally MapNodes can now be constructed from `Iterator<readonly [string, content]>` where previously the inner arrays had to be mutable.

- Enforce use of TreeViewConfiguration's constructor ([#22055](https://github.com/microsoft/FluidFramework/pull/22055)) [e8955579f6](https://github.com/microsoft/FluidFramework/commit/e8955579f6d52a6c7e300642088c60d6ed12d7db)

  `TreeViewConfiguration` is `@sealed`, meaning creating custom implementations of it such as assigning object literals to a `TreeViewConfiguration` or sub-classing it are not supported.
  This reserved the ability for the Fluid Framework to add members to this class over time, informing users that they must use it in such a way where such changes are non-breaking.
  However, there was no compiler-based enforcement of this expectation.
  It was only indicated via documentation and an implicit assumption that when an API takes in a typed defined as a class, that an instance of that class must be used rather than an arbitrary object of a similar shape.

  With this change, the TypeScript compiler will now inform users when they invalidly provide an object literal as a `TreeViewConfiguration`.

  More specifically this causes code like this to produce a compile error:

  ```typescript
  // Don't do this!
  const view = tree.viewWith({
    schema: TestNode,
    enableSchemaValidation: false,
  });
  ```

  The above was never intended to work, and is not a supported use of the `viewWith` since it requires a `TreeViewConfiguration` which is sealed.
  Any code using the above pattern will break in Fluid Framework 2.2 and above. Such code will need to be updated to the pattern shown below.
  Any code broken by this change is technically unsupported and only worked due to a gap in the type checking. This is not considered a breaking change.
  The correct way to get a `TreeViewConfiguration` is by using its constructor:

  ```typescript
  // This pattern correctly initializes default values and validates input.
  const view = tree.viewWith(new TreeViewConfiguration({ schema: TestNode }));
  ```

  Skipping the constructor causes the following problems:

  1. `TreeViewConfiguration` does validation in its constructor, so skipping it also skips the validation which leads to much less friendly error messages for invalid schema.
  2. Skipping the constructor also discards any default values for options like `enableSchemaValidation`.
     This means that code written in that style would break if more options were added. Since such changes are planned,
     it is not practical to support this pattern.

- New `isFluidHandle` type guard to check if an object is an `IFluidHandle` ([#22029](https://github.com/microsoft/FluidFramework/pull/22029)) [7827d1040a](https://github.com/microsoft/FluidFramework/commit/7827d1040a9ebc0bd11388dc31f15370ea9f68d3)

  The `isFluidHandle` type guard function is now exported and can be used to detect which objects are `IFluidHandle`s.
  Since `IFluidHandle` often needs special handling (for example when serializing since it's not JSON compatible),
  having a dedicated detection function for it is useful.
  Doing this detection was possible previously using the `tree` package's schema system via `Tree.is(value, new SchemaFactory("").handle)`,
  but can now be done with just `isFluidHandle(value)`.

- Add a function `isRepoSuperset` to determine if changes to a document schema are backward-compatible ([#22045](https://github.com/microsoft/FluidFramework/pull/22045)) [f6fdc95bb3](https://github.com/microsoft/FluidFramework/commit/f6fdc95bb36a892710bc315aae85fd2c75aec975)

  Note: These changes are not customer-facing and make progress toward future plans in Tree's schema evolution space.

## 2.1.0

### Minor Changes

- Detect arrayNode iterator invalidation ([#21760](https://github.com/microsoft/FluidFramework/pull/21760)) [6fd320c385](https://github.com/microsoft/FluidFramework/commit/6fd320c38561e272a1acaf4248f47fc386c650e4)

  When `arrayNode`s are edited concurrently during iteration, an error will be thrown.

- Some SharedDirectory/SharedMap-related APIs have been sealed ([#21836](https://github.com/microsoft/FluidFramework/pull/21836)) [b1d0427eab](https://github.com/microsoft/FluidFramework/commit/b1d0427eab3fcd55588dd80996967133db66f1b8)

  Note that this is a _documentation only change._ There is no runtime or type-level impact.

  Some top-level APIs within `@fluidframework/map` and `fluid-framework` have been updated to reflect their
  sealed/readonly nature. That is, they are not to be implemented externally to Fluid Framework and not changed. This was
  already the case, but the documentation was not clear.

  Updated APIs:

  - [IDirectory](https://fluidframework.com/docs/api/v2/fluid-framework/idirectory-interface) sealed
  - [IDirectoryEvents](https://fluidframework.com/docs/api/v2/fluid-framework/idirectoryevents-interface) sealed
  - [IDirectoryValueChanged](https://fluidframework.com/docs/api/v2/fluid-framework/idirectoryvaluechanged-interface) sealed and path property is readonly
  - [ISharedDirectory](https://fluidframework.com/docs/api/v2/fluid-framework/ishareddirectory-interface) sealed
  - [ISharedDirectoryEvents](https://fluidframework.com/docs/api/v2/fluid-framework/ishareddirectoryevents-interface) sealed
  - [IValueChanged](https://fluidframework.com/docs/api/v2/fluid-framework/ivaluechanged-interface) sealed

- tree: Improved performance for accessing identifiers in shortId API ([#21944](https://github.com/microsoft/FluidFramework/pull/21944)) [6b4cf26d9c](https://github.com/microsoft/FluidFramework/commit/6b4cf26d9cc14c1a36cf07fd7408f1d1227e373a)

  Users should see improved performance when calling the `Tree.shortId` API. Identifier field keys are now cached in the schema for faster access.

- ✨ New! Debug visualizers for TreeNodes in NodeJS and browsers ([#21895](https://github.com/microsoft/FluidFramework/pull/21895)) [0d197fefec](https://github.com/microsoft/FluidFramework/commit/0d197fefec852df2911151217ac1b71cde528a70)

  TreeNodes now have custom debug visualizers to improve the debug experience in NodeJS and in browsers. Note that custom formatters must be enabled in the browser developer tools for that visualizer to be used.

- Using "delete" on tree fields now throws an error instead of not working correctly ([#21609](https://github.com/microsoft/FluidFramework/pull/21609)) [416849b1fd](https://github.com/microsoft/FluidFramework/commit/416849b1fda029870ee1c1742100de4f8dde45b7)

  TypeScript allows `delete` on object node optional fields if the `exactOptionalPropertyTypes` tsconfig setting is not
  enabled. This does not work correctly at runtime and now produces an informative error.

- Improved error reporting ([#21940](https://github.com/microsoft/FluidFramework/pull/21940)) [3b8a366dd1](https://github.com/microsoft/FluidFramework/commit/3b8a366dd15660f9c916832040faf772534c0755)

  Several cases of invalid usage patterns for tree APIs have gained improved error reporting, as well as improved documentation on the APIs detailing what usage is supported.
  These improvements include:

  - Unsupported usages of schema classes: using more than one schema class derived from a single SchemaFactory generated base class. This used to hit internal asserts, but now has a descriptive user-facing UsageError. Most of this work was done in [9fb3dcf](https://github.com/microsoft/FluidFramework/commit/9fb3dcf491a7f0d66f4abbdc64ab97ccabef4707).
  - Improved detection of when prior exception may have left SharedTree in an invalid state.
    These cases now report a UsageError including a reference to the prior exception. This was mainly done in [9fb3dcf](https://github.com/microsoft/FluidFramework/commit/9fb3dcf491a7f0d66f4abbdc64ab97ccabef4707) and [b77d530](https://github.com/microsoft/FluidFramework/commit/b77d530b9252201c40a90d1a2a6315f76f1a4a4b).

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

- tree: Added support for optional schema validation on newly inserted content in SharedTree ([#21011](https://github.com/microsoft/FluidFramework/pull/21011)) [b14e9fa607](https://github.com/microsoft/FluidFramework/commit/b14e9fa607a8281f86d0cfac631e33ef12033e21)

  When defining how to view a SharedTree, an application can now specify that new content inserted into the tree should
  be subject to schema validation at the time it is inserted, so if it's not valid according to the stored schema in the
  tree an error is thrown immediately.

  This can be accomplished by passing an `ITreeConfigurationOptions` argument with `enableSchemaValidation` set to `true`
  when creating a `TreeConfiguration` to use with the SharedTree.

  Since this feature requires additional compute when inserting new content into the tree, it is not enabled by default.

- Update to TypeScript 5.4 ([#21214](https://github.com/microsoft/FluidFramework/pull/21214)) [0e6256c722](https://github.com/microsoft/FluidFramework/commit/0e6256c722d8bf024f4325bf02547daeeb18bfa6)

  Update package implementations to use TypeScript 5.4.5.

- fluid-framework: Remove some types from `@public` that are not needed ([#21326](https://github.com/microsoft/FluidFramework/pull/21326)) [b629cb80b0](https://github.com/microsoft/FluidFramework/commit/b629cb80b0e5ecdc750270807f77a0e30fab4559)

  Mark the following APIs `@alpha` instead of `@public`:

  - IBranchOrigin
  - ISequencedDocumentMessage
  - ISignalMessage
  - ISignalMessageBase
  - ITrace

- tree: A new tree status has been added for SharedTree nodes. ([#21270](https://github.com/microsoft/FluidFramework/pull/21270)) [8760e321b0](https://github.com/microsoft/FluidFramework/commit/8760e321b02177babfb187ae293a17a65723f249)

  `TreeStatus.Created` indicates that a SharedTree node has been constructed but not yet inserted into the tree.
  Constraints passed to the `runTransaction` API are now marked as `readonly`.

- fluid-framework: Remove several types from `@public` scope ([#21142](https://github.com/microsoft/FluidFramework/pull/21142)) [983e9f09f7](https://github.com/microsoft/FluidFramework/commit/983e9f09f7b10fef9ffa1e9af86166f0ccda7e14)

  The following types have been moved from `@public` to `@alpha`:

  - `IFluidSerializer`
  - `ISharedObjectEvents`
  - `IChannelServices`
  - `IChannelStorageService`
  - `IDeltaConnection`
  - `IDeltaHandler`

  These should not be needed by users of the declarative API, which is what `@public` is targeting.

- sequence: Stop ISharedString extending SharedObject ([#21067](https://github.com/microsoft/FluidFramework/pull/21067)) [47465f4b12](https://github.com/microsoft/FluidFramework/commit/47465f4b12056810112df30a6dad89282afc7a2d)

  ISharedString no longer extends SharedSegmentSequence and instead extends the new ISharedSegmentSequence, which may be missing some APIs.

  Attempt to migrate off the missing APIs, but if that is not practical, request they be added to ISharedSegmentSequence and cast to SharedSegmentSequence as a workaround temporally.

- Update to ES 2022 ([#21292](https://github.com/microsoft/FluidFramework/pull/21292)) [68921502f7](https://github.com/microsoft/FluidFramework/commit/68921502f79b1833c4cd6d0fe339bfb126a712c7)

  Update tsconfig to target ES 2022.

- tree: Move several types into InternalTypes ([#21482](https://github.com/microsoft/FluidFramework/pull/21482)) [64d49dd362](https://github.com/microsoft/FluidFramework/commit/64d49dd3629cefe6260a1d6223e58b10c2ac0cb6)

  The stable public API surface for Tree has been reduced.
  Several types have been moved into InternalTypes, indicating that they are not fully stable nor intended to be referenced by users of Tree.

  - NodeBuilderData
  - FieldHasDefault
  - TreeNodeSchemaNonClass
  - TreeArrayNodeBase
  - ScopedSchemaName
  - DefaultProvider
  - typeNameSymbol
  - InsertableObjectFromSchemaRecord
  - ObjectFromSchemaRecord
  - FieldHasDefaultUnsafe
  - ObjectFromSchemaRecordUnsafe
  - TreeObjectNodeUnsafe
  - TreeFieldFromImplicitFieldUnsafe
  - TreeNodeFromImplicitAllowedTypesUnsafe
  - InsertableTreeNodeFromImplicitAllowedTypesUnsafe
  - TreeArrayNodeUnsafe
  - TreeMapNodeUnsafe
  - InsertableObjectFromSchemaRecordUnsafe
  - InsertableTreeFieldFromImplicitFieldUnsafe
  - InsertableTypedNodeUnsafe
  - NodeBuilderDataUnsafe
  - NodeFromSchemaUnsafe
  - FlexList
  - TreeApi

  Additionally a few more types which could not be moved due to technically limitations have been documented that they should be treated similarly.

  - TreeNodeApi
  - TreeNodeSchemaCore
  - All \*Unsafe type (use for construction of recursive schema).
  - WithType
  - AllowedTypes
  - FieldSchemaUnsafe

  Also to reduce confusion `type` was renamed to `typeNameSymbol`, and is now only type exported. `Tree.is` should be used to get type information from `TreeNodes` instead.

- tree: object node fields with statically known default values are now optional ([#21193](https://github.com/microsoft/FluidFramework/pull/21193)) [21eac41660](https://github.com/microsoft/FluidFramework/commit/21eac41660944208bad42b156d7df05fe6dc6b97)

  Makes object node fields with statically known default values (i.e., `optional` and `identifier` fields) optional when creating trees, where they were previously required.

  Example:

  ```typescript
  class Foo extends schemaFactory.object("Foo", {
    name: schemaFactory.string,
    id: schemaFactory.identifier,
    nickname: schemaFactory.optional(schemaFactory.string),
  }) {}

  // Before
  const foo = new Foo({
    name: "Bar",
    id: undefined, // Had to explicitly specify `undefined` to opt into default behavior
    nickname: undefined, // Had to explicitly specify `undefined` for optional field
  });

  // After
  const foo = new Foo({
    name: "Bar",
    // Can omit `id` and `nickname` fields, as both have statically known defaults!
  });
  ```

- tree: Breaking change: `TreeStatus.Created` is now `TreeStatus.New` ([#21278](https://github.com/microsoft/FluidFramework/pull/21278)) [5a26346a14](https://github.com/microsoft/FluidFramework/commit/5a26346a145ed54d08cd5a9b4f1c9b177711bd7c)

  `TreeStatus.Created` has been renamed to `TreeStatus.New`.

- core-interfaces, tree: Unify `IDisposable` interfaces ([#21184](https://github.com/microsoft/FluidFramework/pull/21184)) [cfcb827851](https://github.com/microsoft/FluidFramework/commit/cfcb827851ffc81486db6c718380150189fb95c5)

  Public APIs in `@fluidframework/tree` now use `IDisposable` from `@fluidframework/core-interfaces` replacing `disposeSymbol` with "dispose".

  `IDisposable` in `@fluidframework/core-interfaces` is now `@sealed` indicating that third parties should not implement it to reserve the ability for Fluid Framework to extend it to include `Symbol.dispose` as a future non-breaking change.

- fluid-framework: Cleanup `fluid-framework` legacy exports ([#21153](https://github.com/microsoft/FluidFramework/pull/21153)) [efee21c296](https://github.com/microsoft/FluidFramework/commit/efee21c2965a02288db6e0345fcf9b3713210953)

  Cleanup `fluid-framework` legacy exports to remove no longer required types.

## 2.0.0-rc.4.0.0

### Minor Changes

- SharedString now uses ISharedObjectKind and does not export the factory [96872186d0](https://github.com/microsoft/FluidFramework/commit/96872186d0d0f245c1fece7d19b3743e501679b6)

  Most users of `SharedString` should be unaffected as long as they stick to the factory patterns supported by ISharedObjectKind.
  If the actual class type is needed it can be found as `SharedStringClass`.

- Deprecated members of IFluidHandle are split off into new IFluidHandleInternal interface [96872186d0](https://github.com/microsoft/FluidFramework/commit/96872186d0d0f245c1fece7d19b3743e501679b6)

  Split IFluidHandle into two interfaces, `IFluidHandle` and `IFluidHandleInternal`.
  Code depending on the previously deprecated members of IFluidHandle can access them by using `toFluidHandleInternal` from `@fluidframework/runtime-utils/legacy`.

  External implementation of the `IFluidHandle` interface are not supported: this change makes the typing better convey this using the `ErasedType` pattern.
  Any existing and previously working, and now broken, external implementations of `IFluidHandle` should still work at runtime, but will need some unsafe type casts to compile.
  Such handle implementation may break in the future and thus should be replaced with use of handles produced by the Fluid Framework client packages.

- Minor API fixes for "@fluidframework/tree" package. [96872186d0](https://github.com/microsoft/FluidFramework/commit/96872186d0d0f245c1fece7d19b3743e501679b6)

  Changes constructor for `FieldSchema` from public to private. Users should call `makeFieldSchema` to create instance of `FieldSchema`.

- Make several driver types no longer public [b7ad7d0b55](https://github.com/microsoft/FluidFramework/commit/b7ad7d0b55884dd8954abf7c398e518838b9bda0)

  Move the following types from `@public` to `@alpha`:

  - ITokenClaims
  - IDocumentMessage
  - IClientConfiguration
  - IAnyDriverError
  - IDriverErrorBase
  - DriverErrorTypes

  `DriverErrorTypes` is no longer exported from the `fluid-framework` package.

- Rename `AzureMember.userName` to `AzureMember.name` and `IMember.userId` to `IMember.id` [96872186d0](https://github.com/microsoft/FluidFramework/commit/96872186d0d0f245c1fece7d19b3743e501679b6)

  1. Renamed `AzureMember.userName` to `AzureMember.name` to establish uniform naming across odsp-client and azure-client.
  2. Renamed `IMember.userId` to `IMember.id` to align with the properties received from AFR.

## 2.0.0-rc.3.0.0

### Major Changes

- fluid-framework: DDS classes are no longer publicly exported [97d68aa06b](https://github.com/microsoft/FluidFramework/commit/97d68aa06bd5c022ecb026655814aea222a062ae)

  SharedDirectory now only exports its factory and the interface type.
  The actual concrete classes which leak implementation details are no longer exported.
  Users of the `SharedDirectory` type should use `ISharedDirectory`.

  Most of other internal crufts are also hided within the API surface, such as the encoded format,
  ILocalValue, ICreateInfo, local op metadata types, etc.

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

- tree: Allow root editing and make TreeView parameterized over schema. [97d68aa06b](https://github.com/microsoft/FluidFramework/commit/97d68aa06bd5c022ecb026655814aea222a062ae)

  TreeView now is parameterized over the field schema instead of the root field type. This was needed to infer the correct input type when reassigning the root.
  Code providing an explicit type to TreeView, like `TreeView<Foo>` can usually be updated by replacing that with `TreeView<typeof Foo>`.

- fluid-framework: Replace SharedObjectClass with new ISharedObjectKind type. [97d68aa06b](https://github.com/microsoft/FluidFramework/commit/97d68aa06bd5c022ecb026655814aea222a062ae)

  The static objects used as SharedObjectClass now explicitly implement the new ISharedObjectKind type.
  SharedObjectClass has been removed as ISharedObjectKind now fills that role.
  LoadableObjectCtor has been inlined as it only had one use: an external user of it can replace it with `(new (...args: any[]) => T)`.

- fluid-framework: Moved SharedMap to 'fluid-framework/legacy' [97d68aa06b](https://github.com/microsoft/FluidFramework/commit/97d68aa06bd5c022ecb026655814aea222a062ae)

  Please use SharedTree for new containers. SharedMap is supported for loading preexisting Fluid Framework 1.x containers only.

  Fluid Framework 1.x users migrating to Fluid Framework 2.x will need to import SharedMap from the './legacy' import path.

  ```ts
  import { SharedMap } from "fluid-framework/legacy";
  ```

- fluid-framework: Make some interface members readonly [97d68aa06b](https://github.com/microsoft/FluidFramework/commit/97d68aa06bd5c022ecb026655814aea222a062ae)

  Remove unneeded mutability from some interface members.

## 2.0.0-rc.2.0.0

### Minor Changes

- fluid-framework: EventEmitterWithErrorHandling is no longer publicly exported ([#19717](https://github.com/microsoft/FluidFramework/issues/19717)) [ae1d0be26d](https://github.com/microsoft/FluidFramework/commits/ae1d0be26d61453cff316b3f622a9f3647149167)

  EventEmitterWithErrorHandling is intended for authoring DDSes, and thus is only intended for use within the Fluid Framework client packages.
  It is no longer publicly exported: any users should fine their own solution or be upstreamed.
  EventEmitterWithErrorHandling is available for now as `@alpha` to make this migration less disrupting for any existing users.

- fluid-framework: SharedObject classes are no longer exported as public ([#19717](https://github.com/microsoft/FluidFramework/issues/19717)) [ae1d0be26d](https://github.com/microsoft/FluidFramework/commits/ae1d0be26d61453cff316b3f622a9f3647149167)

  `SharedObject` and `SharedObjectCore` are intended for authoring DDSes, and thus are only intended for use within the Fluid Framework client packages.
  They is no longer publicly exported: any users should fine their own solution or be upstreamed.
  `SharedObject` and `SharedObjectCore` are available for now as `@alpha` to make this migration less disrupting for any existing users.

- API tightening ([#20012](https://github.com/microsoft/FluidFramework/issues/20012)) [049de899dd](https://github.com/microsoft/FluidFramework/commits/049de899ddfd5c0155251cb0ea00ecbe3a7f7665)

  The Fluid Framework API has been clarified with tags applied to package exports. As we are working toward a clear, safe,
  and stable API surface, some build settings and imports may need to be adjusted.

  **Now:** Most packages are specifying "exports" - import specifierss like` @fluidframework/foo/lib/internals` will
  become build errors. The fix is to use only public APIs from @fluidframework/foo.

  **Coming soon:** Build resolutions (`moduleResolution` in tsconfig compilerOptions) will need to be resolved with
  Node16, NodeNext, or a bundler that supports resolution of named import/export paths. Internally, some FF packages will
  use `@fluidframework/foo/internal` import paths that allow packages to talk to each other using non-public APIs.

  **Final stage:** APIs that are not tagged @public will be removed from @fluidframework/foo imports.

- Deprecated error-related enums have been removed ([#19067](https://github.com/microsoft/FluidFramework/issues/19067)) [59793302e5](https://github.com/microsoft/FluidFramework/commits/59793302e56784cfb6ace0e6469345f3565b3312)

  Error-related enums `ContainerErrorType`, `DriverErrorType`, `OdspErrorType` and `RouterliciousErrorType` were previously
  deprecated and are now removed. There are replacement object-based enumerations of `ContainerErrorTypes`,
  `DriverErrorTypes`, `OdspErrorTypes` and `RouterliciousErrorTypes`. Refer to the release notes of [Fluid Framework version
  2.0.0-internal.7.0.0](https://github.com/microsoft/FluidFramework/releases/tag/client_v2.0.0-internal.7.0.0) for details
  on the replacements.

- map, tree: DDS classes are no longer publicly exported ([#19717](https://github.com/microsoft/FluidFramework/issues/19717)) [ae1d0be26d](https://github.com/microsoft/FluidFramework/commits/ae1d0be26d61453cff316b3f622a9f3647149167)

  SharedMap and SharedTree now only export their factories and the interface types.
  The actual concrete classes which leak implementation details are no longer exported.
  Users of the `SharedMap` type should use `ISharedMap`.
  Users of the `SharedTree` type should use `ISharedTree`.

- tree: Minor API fixes for "@fluidframework/tree" package. ([#19057](https://github.com/microsoft/FluidFramework/issues/19057)) [3e0f218832](https://github.com/microsoft/FluidFramework/commits/3e0f21883255317f8bb1f7c420543650502a5b66)

  Rename `IterableTreeListContent` to `IterableTreeArrayContent`, inline `TreeMapNodeBase` into `TreeMapNode`, rename `TreeArrayNode.spread` to `TreeArrayNode.spread` and remove `create` which was not supposed to be public (use `TreeArrayNode.spread` instead).

- fluid-framework: ContainerSchema is now readonly ([#19717](https://github.com/microsoft/FluidFramework/issues/19717)) [ae1d0be26d](https://github.com/microsoft/FluidFramework/commits/ae1d0be26d61453cff316b3f622a9f3647149167)

  The `ContainerSchema` type is intended for defining input to these packages. This should make the APIs more tolerant and
  thus be non-breaking, however its possible for some users of `ContainerSchema` to use it in ways where this could be a
  breaking change: any such users should remove their mutations and/or use a different type.

## 2.0.0-rc.1.0.0

Dependency updates only.

## 2.0.0-internal.8.0.0

### Major Changes

- azure-client: Removed deprecated FluidStatic classes [9a451d4946](https://github.com/microsoft/FluidFramework/commits/9a451d4946b5c51a52e4d1ab5bf51e7b285b0d74)

  Several FluidStatic classes were unnecessarily exposed and were deprecated in an earlier release. They have been replaced with creation functions. This helps us
  keep implementations decoupled from usage which is easier to maintain and extend. It has very minimal impact on the
  public surface area of downstream packages. The removed classes are as follows:

  - `AzureAudience` (use `IAzureAudience` instead)
  - `TinyliciousAudience` (use `ITinyliciousAudience` instead)
  - `DOProviderContainerRuntimeFactory`
  - `FluidContainer`
  - `ServiceAudience`

## 2.0.0-internal.7.4.0

### Minor Changes

- azure-client: Deprecated FluidStatic Classes ([#18402](https://github.com/microsoft/FluidFramework/issues/18402)) [589ec39de5](https://github.com/microsoft/FluidFramework/commits/589ec39de52116c7f782319e6f6aa61bc5aa9964)

  Several FluidStatic classes were unnecessarily exposed. They have been replaced with creation functions. This helps us
  keep implementations decoupled from usage which is easier to maintain and extend. It has very minimal impact on the
  public surface area of downstream packages. The deprecated classes are as follows:

  - `AzureAudience` (use `IAzureAudience` instead)
  - `TinyliciousAudience` (use `ITinyliciousAudience` instead)
  - `DOProviderContainerRuntimeFactory`
  - `FluidContainer`
  - `ServiceAudience`

## 2.0.0-internal.7.3.0

Dependency updates only.

## 2.0.0-internal.7.2.0

Dependency updates only.

## 2.0.0-internal.7.1.0

Dependency updates only.

## 2.0.0-internal.7.0.0

### Major Changes

- Minimum TypeScript version now 5.1.6 [871b3493dd](https://github.com/microsoft/FluidFramework/commits/871b3493dd0d7ea3a89be64998ceb6cb9021a04e)

  The minimum supported TypeScript version for Fluid 2.0 clients is now 5.1.6.

## 2.0.0-internal.6.4.0

Dependency updates only.

## 2.0.0-internal.6.3.0

Dependency updates only.

## 2.0.0-internal.6.2.0

Dependency updates only.

## 2.0.0-internal.6.1.0

Dependency updates only.

## 2.0.0-internal.6.0.0

### Major Changes

- IntervalConflictResolver removed [8abce8cdb4](https://github.com/microsoft/FluidFramework/commits/8abce8cdb4e2832fb6405fb44e393bef03d5648a)

  IntervalConflictResolver has been removed. Any lingering usages in application code can be removed as well. This change also marks APIs deprecated in #14318 as internal.

- RootDataObject and RootDataObjectProps no longer exported from fluid-static or fluid-framework packages [8abce8cdb4](https://github.com/microsoft/FluidFramework/commits/8abce8cdb4e2832fb6405fb44e393bef03d5648a)

  RootDataObject and RootDataObjectProps are internal implementations and not intended for direct use. Instead use IRootDataObject to refer to the root data object.

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
