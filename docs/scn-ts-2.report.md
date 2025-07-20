## Analysis Report: Preparing `repograph` for `scn-ts` Integration

### Executive Summary

`repograph` is remarkably well-positioned to serve as the engine for `scn-ts`. Its current architecture, particularly the composable pipeline and the detailed data models produced by the Tree-sitter analyzer, already provides approximately 85-90% of the necessary foundation.

The required preparations are not fundamental architectural changes. Instead, they are **enhancements to the richness of the generated `CodeGraph`**. By adding more semantic detail to the `CodeNode` and `CodeEdge` types, `repograph` becomes an even more powerful general-purpose code analysis tool, while incidentally providing `scn-ts` with all the information it needs to construct a high-fidelity SCN map.

### Guiding Principle: Separation of Concerns

The core strategy is to maintain a clean boundary:

*   **`repograph`'s Responsibility:** To accurately **discover, parse, and model** the structure, symbols, and relationships within a codebase into a language-agnostic graph (`RankedCodeGraph`). It should know nothing about SCN syntax (`§`, `◇`, `->`, etc.). Its "product" is a rich, structured data object.
*   **`scn-ts`'s Responsibility:** To consume the `RankedCodeGraph` object from `repograph`. Its sole job is to **transform and serialize** this structured data into the specific SCN text format. It is a "rendering target" for the graph data.

### I. What `repograph` Already Provides (Strengths)

The current implementation is a strong starting point:

1.  **Composable Pipeline (`composer.ts`):** The `createMapGenerator` function is the ideal entry point for `scn-ts`. It allows `scn-ts` to provide its own `render` function (an SCN serializer) while reusing `repograph`'s robust `discover`, `analyze`, and `rank` stages.
2.  **Rich `CodeNode` Data Model (`types.ts`):** The `CodeNode` type is the most critical asset. It already captures information that maps directly to SCN concepts:
    *   **Visibility:** The `visibility` field (`'public'`, `'private'`) maps directly to SCN's `+` and `-` symbols.
    *   **Asynchronicity:** The `isAsync` field maps directly to SCN's `...` qualifier.
    *   **Entity Types:** The `CodeNodeType` enum (`'class'`, `'function'`, `'interface'`) maps directly to SCN's primary entity symbols (`◇`, `~`, `{}`).
    *   **Parameters & Types:** The `parameters` and `returnType` fields provide the necessary data for SCN's type signatures (`login(email: #, pass: #): #(User)`).
3.  **Relationship Modeling (`CodeEdge`):** The `edges` array, with types like `'imports'`, `'calls'`, `'inherits'`, and `'implements'`, provides the exact information needed to generate SCN's dependency arrows (`->`) and can be used to infer caller arrows (`<-`).
4.  **Language-Agnostic Foundation:** By using Tree-sitter, the architecture is inherently prepared to analyze any language for which a grammar and query file are provided.

### II. Required Preparations & Refinements for `repograph`

To fully support the SCN specification, the `analyze` stage of `repograph` needs to extract a few more pieces of semantic information from the source code. These additions will enrich the `CodeGraph` for all potential uses, not just for `scn-ts`.

#### Preparation Checklist

-   [ ] **1. Enrich `CodeNode` Model**
    -   [ ] Add `canThrow?: boolean` field.
    -   [ ] Add `isPure?: boolean` field.
    -   [ ] Review and confirm `isStatic` is captured for all supported languages.
-   [ ] **2. Expand Language Support for UI**
    -   [ ] Add UI-specific types to `CodeNodeType` enum.
    -   [ ] Add UI-specific fields to `CodeNode` (e.g., `htmlTag`, `cssSelector`).
    -   [ ] Enhance analyzer to parse HTML/JSX structure and CSS intent.
-   [ ] **3. Solidify API Contract**
    -   [ ] Formally document the `RankedCodeGraph` structure.
    -   [ ] Treat the data model as a public, versioned API.

---

#### 1. Enrich the `CodeNode` Model for Deeper Semantics

The `CodeNode` type in `src/types.ts` and the logic in `src/pipeline/analyze.ts` should be updated to capture the following:

*   **"Throws" Capability:**
    *   **Requirement:** The SCN spec has a `!` symbol to indicate a function can throw an exception.
    *   **Preparation:** Add a new optional boolean field to the `CodeNode` type: `readonly canThrow?: boolean;`. The Tree-sitter analyzer will need to be updated to scan function/method bodies for `throw` statements and set this flag accordingly.

*   **Purity Heuristics:**
    *   **Requirement:** The SCN spec has an `o` symbol for pure functions.
    *   **Preparation:** Add an optional boolean field: `readonly isPure?: boolean;`. The analyzer can set this flag based on heuristics, such as the absence of call expressions, I/O operations, or modifications to external state.

*   **Static Members:**
    *   **Requirement:** Differentiate instance members from static/class members.
    *   **Preparation:** The `CodeNode` already has `isStatic`. A thorough review of all Tree-sitter queries is needed to ensure the `static` keyword is captured reliably across all supported languages and that the `isStatic` field is populated correctly.

#### 2. Expand Language Support for UI-centric Code

*   **Requirement:** The SCN spec has first-class support for modeling UI structure (HTML/JSX) and styling (CSS). `repograph` is currently focused on procedural/OO languages.
*   **Preparation:**
    1.  **New `CodeNodeType`s:** Add `'html_element'` and `'css_rule'` to the `CodeNodeType` enum in `src/types.ts`.
    2.  **UI-Specific `CodeNode` Fields:** Add new optional fields to the `CodeNode` type to hold UI-specific attributes.
        ```typescript
        // In types.ts, inside CodeNode
        readonly htmlTag?: string; // e.g., 'div', 'button'
        readonly attributes?: ReadonlyMap<string, string>; // e.g., { 'id': 'login-form', 'class': 'btn btn-primary' }
        readonly cssSelector?: string; // e.g., '.btn-primary'
        readonly cssIntents?: ReadonlyArray<'layout' | 'typography' | 'appearance'>;
        ```
    3.  **Update Analyzer:** The `analyze.ts` logic will need significant enhancement. When parsing `.vue` or `.tsx`/`.jsx` files, it must identify elements, their hierarchy, and their attributes. When parsing `.css` files, it must identify rules and use heuristics on the CSS properties to determine their "intent" (`layout`, `typography`, `appearance`).

#### 3. Solidify the Programmatic API Contract

*   **Requirement:** `scn-ts` needs a stable, documented way to get the `RankedCodeGraph` object.
*   **Preparation:**
    *   The `createMapGenerator` function's return type (`Promise<RepoGraphMap>`) is already perfect for this.
    *   The key preparation is **documentation and stability**. The structures of `CodeNode`, `CodeEdge`, and `RankedCodeGraph` must be formally documented and treated as a public API.
    *   Changes to this data model should be considered breaking changes for `repograph` and be versioned accordingly to ensure `scn-ts` and other downstream tools can rely on it.

### III. What `scn-ts` Will Be Responsible For

With the above preparations made in `repograph`, the logic inside `scn-ts` becomes simple and focused:

1.  **Invoke `repograph`:** It will call `createMapGenerator`, providing its own custom `render` function (which will act as the SCN serializer).
2.  **Receive the Graph:** The custom render function will receive the complete `RankedCodeGraph` data object from the `repograph` pipeline.
3.  **Transform and Format:** It will iterate through the graph's nodes and edges and perform a direct, stateless translation from the rich data model to SCN syntax:
    *   Generate unique integer IDs for files and entities (`(1)`, `(1.1)`).
    *   Map `node.visibility` to `+` or `-`.
    *   Map `node.isAsync` to `...`.
    *   Map the new `node.canThrow` field to `!`.
    *   Map the new `node.isPure` field to `o`.
    *   Translate `CodeEdge`s of type `'calls'` or `'imports'` into `->` dependency links.
    *   Infer `<-` (caller) links by finding all `calls` edges that *point to* the current node.

### Conclusion

`repograph` is on the right track. By enriching its generic data models to capture more semantic detail like "throws capability" and UI structure, it becomes a more valuable tool on its own. This enhancement has the direct and positive side effect of providing the `scn-ts` tool with a complete and sufficient source of information. This approach ensures `repograph` remains a powerful, general-purpose codebase analysis engine, and `scn-ts` can be a lightweight, focused "view" on top of it, honoring the critical separation of concerns.
