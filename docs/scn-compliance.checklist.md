# SCN v1.0 Compliance Checklist for `scn-ts`

This document serves as a master checklist to track the implementation status of `scn-ts` against the Symbolic Context Notation (SCN) v1.0 specification. Each item corresponds to a specific feature or symbol defined in the spec.

---

## 1. Core Structure

### General & Structural Symbols
- [ ] `§` **File Path**: Generates a file declaration with a unique integer ID and relative path.
- [ ] **Entity ID**: Assigns unique, compound, incrementing IDs to entities within a file (e.g., `(1.1)`, `(1.2)`).
- [ ] `->` **Dependency**: Creates a "points to" link from a source entity to a target entity's ID.
- [ ] `<-` **Caller**: Creates a "points from" link from a target entity back to a source entity's ID.

### Inter-File Dependency Graph
- [ ] **File-level Dependencies**: A summary of file-level `->` dependencies is added to the `§` line.
- [ ] **File-level Callers**: A summary of file-level `<-` callers is added to the `§` line.
- [ ] **Side-effect Imports**: A dependency on an entire file (e.g., `import './style.css'`) is represented with a `.0` entity ID (e.g., `-> (2.0)`).
- [ ] **Transitive Dependencies**: Correctly resolves and represents a multi-step dependency chain (e.g., `A.ts -> B.ts -> C.ts`).
- [ ] **Function Body Dependencies**: Resolves dependencies used inside a function's body and links them from the function entity.
- [ ] **Un-scanned Dependencies**: Represents dependencies on files/modules not part of the SCN scan by their path/name (e.g., `-> (react)`, `-> (./some-util.js)`).

---

## 2. Code & Type System Entities

### Code Entities (JS/TS/etc.)
- [ ] `◇` **Container**: Represents a `class`, `namespace`, or module-pattern object.
- [ ] `~` **Function**: Represents a `function`, `method`, or arrow function expression.
- [ ] `@` **Variable**: Represents a `property`, `field`, `const`, or state variable.
- [ ] **Default Exports**: Correctly handles `export default` for classes and functions.

### Type System Definitions & References
- [ ] `{}` **Interface/Struct**: Represents a TypeScript `interface` or exported object literal type.
- [ ] **React Component Props**: Represents React component props with the `{ props: { ... } }` syntax on a `◇` container.
- [ ] `☰` **Enum**: Represents an `enum` declaration.
- [ ] `=:` **Type Alias**: Represents a `type` alias declaration.
- [ ] `#` **Type Reference**: Represents a reference to a type in a signature or property (e.g., `name: #`).
- [ ] **Complex Type References**: Correctly renders complex/generic type references (e.g., `Promise<User[]>` becomes `#(Promise<User[]>)`).

### Function & Method Qualifiers
- [ ] `+` **Public Access**: Prefixes `public` or `export`ed members.
- [ ] `-` **Private Access**: Prefixes `private` or non-exported members.
- [ ] `...` **Async**: Appends to `async` functions/methods.
- [ ] `!` **Throws**: Appends to functions containing a `throw` statement.
- [ ] **Compound Qualifiers**: Correctly combines qualifiers (e.g., `+ ~ myFunc(): # ... !`).
- [ ] `o` **Pure**: Appends to functions determined to have no side-effects.

---

## 3. Markup (HTML/JSX) & Style (CSS)

### Markup
- [ ] `⛶` **HTML Element**: Represents a JSX element tag.
- [ ] **Hierarchy**: Represents JSX element hierarchy using indentation.
- [ ] **Attributes**: Represents key attributes like `id` and `class` inside brackets (e.g., `[ id:#login, class:.btn .btn-primary ]`).

### Style
- [ ] `¶` **CSS Rule**: Represents a CSS selector and its style block.
- [ ] **Linking (CSS -> HTML)**: A `¶` CSS rule has `<-` links pointing to the `⛶` JSX elements that use it.
- [ ] **Linking (HTML -> CSS)**: A `⛶` JSX element has `->` links pointing to the `¶` CSS rules that style it.

### CSS Intents
- [ ] `📐` **Layout Intent**: Included for rules with box model, flex, grid, or position properties.
- [ ] `✍` **Text Intent**: Included for rules with font or typography properties.
- [ ] `💧` **Appearance Intent**: Included for rules with color, background, border, or shadow properties.
- [ ] **Multiple Intents**: Correctly combines multiple intent symbols in one block (e.g., `{ 📐 💧 }`).