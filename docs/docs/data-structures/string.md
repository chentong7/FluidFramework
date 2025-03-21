---
title: SharedString
sidebar_position: 4
---

## Introduction

SharedString is a DDS for concurrently editing and storing text.
It is largely a light wrapper around SharedSegmentSequence.
As such, all basic functionalities on sequences can also be performed on a SharedString.
For more details on those features (insertion, deletion, annotation, references, delta events), see the [Sequences][] article.

The main augmentation that SharedString makes atop the sequence API is its notion of a "Marker."

## Markers and Text Segments

A SharedString contains two types of segments: markers and text segments.
Markers can be used to store metadata at positions within the text, like a reference to an image or Fluid object that should be rendered with the text.
They can also be used for formatting when it fits the model better than an annotation does, e.g. a paragraph marker or a marker denoting the start of a list.

Both markers and text are stored as segments in the SharedString.
Text segments will be split and merged when modifications are made to the SharedString and will therefore have variable length
matching the length of the text content they contain.
Marker segments are never split or merged, and always have a length of 1.

```typescript
//   content: hi
// positions: 01

sharedString.insertMarker(
	2,
	ReferenceType.Simple,
	// Arbitrary bag of properties to associate to the marker. If the marker is annotated by a future operation,
	// those annotated properties will be merged with the initial set.
	{ type: "pg" },
);
sharedString.insertText(3, "world");
//   content: hi<pg marker>world
// positions: 01    2      34567

// Since markers don't directly correspond to text, they aren't included in direct text queries
sharedString.getText(); // returns "hiworld"

// Instead, rich text models involving markers likely want to read from the SharedString using `walkSegments`:
sharedString.walkSegments((segment) => {
	if (Marker.is(segment)) {
		// Handle markers (e.g. dereference and insert image data, interpret marker properties, etc.)
	} else {
		// Handle text segments (e.g. append to the current text accumulator with `segment.text`, apply any formatting on `segment.props`)
	}
});
```

<!-- It might be worth adding a section about Tile markers and their use: setting ReferenceType.Tile and putting a label on [reservedTileLabelsKey] allows
efficient spatial querying of the nearest Marker to a given position. -->

<!-- IMPORTANT: Don't manually edit the auto-generated content below. Instead, edit the source file (look at the path
     argument) and then run "npm run build:md-magic" from the docs folder. That will update all autogenerated
     content, so you should commit the resulting changes. -->

<!-- AUTO-GENERATED-CONTENT:START (INCLUDE:path=../../../packages/dds/sequence/README.md&start=613&end=628) -->

<!-- prettier-ignore-start -->
<!-- NOTE: This section is automatically generated by embedding the referenced file contents. Do not update these generated contents directly. -->

### Examples

-   Rich Text Editor Implementations

    -   [webflow](https://github.com/microsoft/FluidFramework/tree/main/examples/data-objects/webflow)

-   Integrations with Open Source Rich Text Editors

    -   [prosemirror](https://github.com/microsoft/FluidFramework/tree/main/examples/data-objects/prosemirror)
    -   [smde](https://github.com/microsoft/FluidFramework/tree/main/examples/data-objects/smde)

-   Plain Text Editor Implementations
    -   [collaborativeTextArea](https://github.com/microsoft/FluidFramework/blob/main/examples/utils/example-utils/src/reactInputs/CollaborativeTextArea.tsx)
    -   [collaborativeInput](https://github.com/microsoft/FluidFramework/blob/main/examples/utils/example-utils/src/reactInputs/CollaborativeInput.tsx)

<!-- prettier-ignore-end -->

<!-- AUTO-GENERATED-CONTENT:END -->
