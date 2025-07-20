## Analysis Report: `repograph` and `scn-ts` Integration

### Executive Summary

`repograph` proved to be an excellent engine for `scn-ts`. Its core architecture, particularly the composable pipeline and Tree-sitter-based analysis, provided the vast majority of the necessary foundation for this integration.

The work did not require fundamental re-architecture. Instead, it involved **targeted enhancements to enrich the `CodeGraph` data model**. By adding more semantic detail to `CodeNode` and `CodeEdge` types, `repograph` became a more powerful general-purpose analysis tool, while incidentally providing `scn-ts` with a complete, high-fidelity data source to construct its map.

### Core Design Philosophy: Separation of Concerns

The integration was guided by a clean separation of responsibilities, which has now been successfully implemented:

*   **`repograph`'s Role:** To discover, parse, and model a codebase into a language-agnostic graph (`RankedCodeGraph`). It has no knowledge of SCN-specific syntax. Its product is a rich, structured data object.
*   **`scn-ts`'s Role:** To consume the `RankedCodeGraph` from `repograph`. Its sole job is to act as a "rendering target," transforming and serializing this structured data into the SCN text format.

### I. `repograph` as the Analysis Engine

`repograph`'s existing strengths were leveraged, and its data model was enhanced to meet the full requirements of the SCN specification.

#### Leveraged Foundation

The initial `repograph` implementation provided a robust starting point:

1.  **Composable Pipeline:** The `createMapGenerator` function was the ideal entry point, allowing `scn-ts` to reuse the `discover`, `analyze`, and `rank` stages while providing a custom renderer.
2.  **Rich `CodeNode` Model:** The existing `CodeNode` already captured visibility, asynchronicity, entity types (class, function), parameters, and return types.
3.  **Relationship Modeling:** The `CodeEdge` types (`'imports'`, `'calls'`, `'inherits'`) provided the exact information needed to generate dependency arrows.

#### Implemented Semantic Upgrades

To fully support SCN, the `repograph` analyzer and data model were enhanced as follows:

**1. Deeper Code Semantics in `CodeNode`:**
The `CodeNode` model was enriched to capture finer-grained details about code behavior:
*   `canThrow: boolean`: Added to indicate if a function's body contains a `throw` statement, mapping to SCN's `!` symbol.
*   `isPure: boolean`: Added to identify pure functions via heuristics (e.g., absence of external calls or state mutation), mapping to SCN's `o` symbol.
*   `isStatic: boolean`: This field's capture was reviewed and solidified across all supported languages.

**2. First-Class UI Language Support:**
Analysis capabilities were extended beyond procedural/OO languages to include UI structure and styling:
*   **New `CodeNodeType`s:** The enum was expanded with `'html_element'` and `'css_rule'`.
*   **UI-Specific Fields:** New `CodeNode` attributes like `htmlTag`, `cssSelector`, and `cssIntents` were added to hold structural and styling information.
*   **Enhanced Analyzer:** The analyzer was updated to parse HTML/JSX element hierarchies and infer the intent of CSS rules (`layout`, `typography`, etc.).

**3. Solidified API Contract:**
The `RankedCodeGraph` data structure was formalized and documented as a stable, public API. This ensures that `scn-ts` and other downstream tools have a reliable and versioned data contract to depend on.

### II. `scn-ts` as the Rendering Layer

With a complete and semantically rich `CodeGraph` available from `repograph`, the implementation of `scn-ts` became simple and focused. Its responsibilities are:

1.  **Invoke** `repograph`'s processing pipeline.
2.  **Receive** the final `RankedCodeGraph` data object.
3.  **Perform** a direct, stateless translation of the graph's nodes and edges into SCN text format, mapping data attributes like `visibility` or `canThrow` to their corresponding SCN symbols.

### Conclusion

The integration was a success. By enhancing `repograph`'s generic analysis capabilities, it became a more powerful standalone tool while simultaneously providing the perfect data source for `scn-ts`. This project validates the "smart engine, simple renderer" architectural approach and the critical value of maintaining a clean separation of concerns.
