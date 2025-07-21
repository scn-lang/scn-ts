if the problem lies in repograph, you should fix repograph/src do not make any adjustment on scm-ts for repograph imperfection

===

relevant context;

    "package.json",
    "tsconfig.json",
    "docs/scn.readme.md",
    "test",

    "repograph/package.json",
    "repograph/tsconfig.json",
    "repograph/tsconfig.build.json",

1. we made progress.. continue but stay scn v.1.0 compliant as the single source of truth.
2. repograph should be not worry about scn notation concern.

bun test test/ts
bun test v1.2.17 (282dda62)

test/ts/integration/dependency-graph.test.ts:
1/3 Discovering files...
  -> Found 2 files to analyze.
2/3 Analyzing code and building graph...
  -> Built graph with 4 nodes and 2 edges.
3/3 Ranking graph nodes...
  -> Ranking complete.
24 |
25 |     const utilScn = scn.split('\n\n').find(s => s.includes('util.ts'));
26 |     expect(utilScn).toBeDefined();
27 |     // main.ts is file 1, its function 'main' is entity 1.1
28 |     // util.ts is file 2, its function 'helper' is entity 2.1
29 |     expect(utilScn).toContain('+ ~ (2.1) helper()\n    <- (1.1)');
                         ^
error: expect(received).toContain(expected)

Expected to contain: "+ ~ (2.1) helper()\n    <- (1.1)"
Received: "§ (2) util.ts <- (1.0)\n~ (2.1) helper () {}\n    <- (1.1)"

      at <anonymous> (/home/realme-book/Project/code/scn-ts/test/ts/integration/dependency-graph.test.ts:29:21)
✗ SCN Generation: 1.2 Inter-File Dependency Graphs > should resolve and add <- annotations to entities that are used by other entities [106.00ms]
1/3 Discovering files...
  -> Found 3 files to analyze.
2/3 Analyzing code and building graph...
  -> Built graph with 5 nodes and 2 edges.
3/3 Ranking graph nodes...
  -> Ranking complete.
✓ SCN Generation: 1.2 Inter-File Dependency Graphs > should add a summary of file-level dependencies and callers on the § file declaration line [46.00ms]
1/3 Discovering files...
  -> Found 3 files to analyze.
2/3 Analyzing code and building graph...
  -> Built graph with 6 nodes and 2 edges.
3/3 Ranking graph nodes...
  -> Ranking complete.
64 |     // Entity-level links
65 |     const aScn = scn.split('\n\n').find(s => s.includes('a.ts'));
66 |     const bScn = scn.split('\n\n').find(s => s.includes('b.ts'));
67 |     const cScn = scn.split('\n\n').find(s => s.includes('c.ts'));
68 |
69 |     expect(aScn).toContain('~ (1.1) run()\n    -> (2.1)'); // run() in a.ts uses B from b.ts
                      ^
error: expect(received).toContain(expected)

Expected to contain: "~ (1.1) run()\n    -> (2.1)"
Received: "§ (1) a.ts -> (2.0)\n~ (1.1) run () { console.log(B); }"

      at <anonymous> (/home/realme-book/Project/code/scn-ts/test/ts/integration/dependency-graph.test.ts:69:18)
✗ SCN Generation: 1.2 Inter-File Dependency Graphs > should correctly represent a multi-step dependency chain (A -> B -> C) [42.00ms]
1/3 Discovering files...
  -> Found 2 files to analyze.
2/3 Analyzing code and building graph...
  -> Built graph with 4 nodes and 2 edges.
3/3 Ranking graph nodes...
  -> Ranking complete.
86 |       include: [`**/*.ts`],
87 |     });
88 |
89 |     const mainScn = scn.split('\n\n').find(s => s.includes('main.ts'));
90 |     expect(mainScn).toBeDefined();
91 |     expect(mainScn).toContain('~ (1.1) run()\n    -> (2.1)');
                         ^
error: expect(received).toContain(expected)

Expected to contain: "~ (1.1) run()\n    -> (2.1)"
Received: "§ (1) main.ts -> (2.0)\n~ (1.1) run () {\n          log();\n        }\n    -> (2.1)"

      at <anonymous> (/home/realme-book/Project/code/scn-ts/test/ts/integration/dependency-graph.test.ts:91:21)
✗ SCN Generation: 1.2 Inter-File Dependency Graphs > should link a dependency from the function that uses it, not just the file [53.00ms]
1/3 Discovering files...
  -> Found 2 files to analyze.
2/3 Analyzing code and building graph...
  -> Built graph with 5 nodes and 3 edges.
3/3 Ranking graph nodes...
  -> Ranking complete.
111 |     });
112 |     const mainScn = scn.split('\n\n').find(s => s.includes('main.ts'));
113 |     expect(mainScn).toBeDefined();
114 |     // main.ts is file 1, util.ts is file 2.
115 |     // run is 1.1, helperA is 2.1, helperB is 2.2
116 |     expect(mainScn).toContain('+ ~ (1.1) run()\n    -> (2.1), (2.2)');
                          ^
error: expect(received).toContain(expected)

Expected to contain: "+ ~ (1.1) run()\n    -> (2.1), (2.2)"
Received: "§ (1) main.ts -> (2.0)\n~ (1.1) run () {\n          helperA();\n          helperB();\n        }\n    -> (2.1), (2.2)"

      at <anonymous> (/home/realme-book/Project/code/scn-ts/test/ts/integration/dependency-graph.test.ts:116:21)
✗ SCN Generation: 1.2 Inter-File Dependency Graphs > should support linking to multiple entities on one line [57.00ms]

test/ts/unit/code-entities.test.ts:
1/3 Discovering files...
  -> Found 1 files to analyze.
2/3 Analyzing code and building graph...
  -> Built graph with 2 nodes and 0 edges.
3/3 Ranking graph nodes...
  -> Ranking complete.
16 |     project = await setupTestProject({ 'test.ts': `export class MyClass {}` });
17 |     const scn = await generateScn({
18 |       root: project.projectDir,
19 |       include: [`**/*.ts`],
20 |     });
21 |     expect(scn).toContain('+ ◇ (1.1) MyClass');
                     ^
error: expect(received).toContain(expected)

Expected to contain: "+ ◇ (1.1) MyClass"
Received: "§ (1) test.ts\n◇ (1.1) MyClass {}"

      at <anonymous> (/home/realme-book/Project/code/scn-ts/test/ts/unit/code-entities.test.ts:21:17)
✗ SCN Generation: 1.3 Code Entities > should represent a class with ◇ [37.00ms]
1/3 Discovering files...
  -> Found 1 files to analyze.
2/3 Analyzing code and building graph...
  -> Built graph with 1 nodes and 0 edges.
3/3 Ranking graph nodes...
  -> Ranking complete.
25 |     project = await setupTestProject({ 'test.ts': `export namespace MyNamespace {}` });
26 |     const scn = await generateScn({
27 |       root: project.projectDir,
28 |       include: [`**/*.ts`],
29 |     });
30 |     expect(scn).toContain('+ ◇ (1.1) MyNamespace');
                     ^
error: expect(received).toContain(expected)

Expected to contain: "+ ◇ (1.1) MyNamespace"
Received: "§ (1) test.ts"

      at <anonymous> (/home/realme-book/Project/code/scn-ts/test/ts/unit/code-entities.test.ts:30:17)
✗ SCN Generation: 1.3 Code Entities > should represent a namespace with ◇ [38.00ms]
1/3 Discovering files...
  -> Found 1 files to analyze.
2/3 Analyzing code and building graph...
  -> Built graph with 2 nodes and 0 edges.
3/3 Ranking graph nodes...
  -> Ranking complete.
34 |     project = await setupTestProject({ 'test.ts': `export const MyModule = { key: 'value' };` });
35 |     const scn = await generateScn({
36 |       root: project.projectDir,
37 |       include: [`**/*.ts`],
38 |     });
39 |     expect(scn).toContain(`+ ◇ (1.1) MyModule { key: 'value' }`);
                     ^
error: expect(received).toContain(expected)

Expected to contain: "+ ◇ (1.1) MyModule { key: 'value' }"
Received: "§ (1) test.ts\n◇ (1.1) MyModule { key: 'value' }"

      at <anonymous> (/home/realme-book/Project/code/scn-ts/test/ts/unit/code-entities.test.ts:39:17)
✗ SCN Generation: 1.3 Code Entities > should represent an exported uppercase object literal (module pattern) with ◇ [52.00ms]
1/3 Discovering files...
  -> Found 1 files to analyze.
2/3 Analyzing code and building graph...
  -> Built graph with 2 nodes and 0 edges.
3/3 Ranking graph nodes...
  -> Ranking complete.
43 |     project = await setupTestProject({ 'test.ts': `export interface MyInterface {}` });
44 |     const scn = await generateScn({
45 |       root: project.projectDir,
46 |       include: [`**/*.ts`],
47 |     });
48 |     expect(scn).toContain('+ {} (1.1) MyInterface');
                     ^
error: expect(received).toContain(expected)

Expected to contain: "+ {} (1.1) MyInterface"
Received: "§ (1) test.ts\n{} (1.1) MyInterface {}"

      at <anonymous> (/home/realme-book/Project/code/scn-ts/test/ts/unit/code-entities.test.ts:48:17)
✗ SCN Generation: 1.3 Code Entities > should represent an interface with {} [39.00ms]
1/3 Discovering files...
  -> Found 1 files to analyze.
2/3 Analyzing code and building graph...
  -> Built graph with 2 nodes and 0 edges.
3/3 Ranking graph nodes...
  -> Ranking complete.
52 |     project = await setupTestProject({ 'test.ts': `export function myFunc() {}` });
53 |     const scn = await generateScn({
54 |       root: project.projectDir,
55 |       include: [`**/*.ts`],
56 |     });
57 |     expect(scn).toContain('+ ~ (1.1) myFunc()');
                     ^
error: expect(received).toContain(expected)

Expected to contain: "+ ~ (1.1) myFunc()"
Received: "§ (1) test.ts\n~ (1.1) myFunc () {}"

      at <anonymous> (/home/realme-book/Project/code/scn-ts/test/ts/unit/code-entities.test.ts:57:17)
✗ SCN Generation: 1.3 Code Entities > should represent an export function with + ~ [41.00ms]
1/3 Discovering files...
  -> Found 1 files to analyze.
2/3 Analyzing code and building graph...
  -> Built graph with 2 nodes and 0 edges.
3/3 Ranking graph nodes...
  -> Ranking complete.
✓ SCN Generation: 1.3 Code Entities > should represent a const arrow function with ~ [38.00ms]
1/3 Discovering files...
  -> Found 1 files to analyze.
2/3 Analyzing code and building graph...
  -> Built graph with 6 nodes and 0 edges.
3/3 Ranking graph nodes...
  -> Ranking complete.
76 |     });
77 |     const scn = await generateScn({
78 |       root: project.projectDir,
79 |       include: [`**/*.ts`],
80 |     });
81 |     expect(scn).toContain('+ @ (1.2) myProp');
                     ^
error: expect(received).toContain(expected)

Expected to contain: "+ @ (1.2) myProp"
Received: "§ (1) test.ts\n◇ (1.1) MyClass {\n        myProp: string = '';\n        myMethod() {}\n      }\n@ (1.2) MyClass.myProp myProp: string = ''\n@ (1.3) myProp : string = ''\n~ (1.4) MyClass.myMethod myMethod()\n~ (1.5) myMethod () {}"

      at <anonymous> (/home/realme-book/Project/code/scn-ts/test/ts/unit/code-entities.test.ts:81:17)
✗ SCN Generation: 1.3 Code Entities > should represent a class method with ~ and a property with @ [52.00ms]
1/3 Discovering files...
  -> Found 1 files to analyze.
2/3 Analyzing code and building graph...
  -> Built graph with 2 nodes and 0 edges.
3/3 Ranking graph nodes...
  -> Ranking complete.
87 |     const scn = await generateScn({
88 |       root: project.projectDir,
89 |       include: [`**/*.ts`],
90 |     });
91 |     // Note: repograph represents this as a "variable" and heuristic makes it not a container
92 |     expect(scn).toContain('@ (1.1) myVar = 123');
                     ^
error: expect(received).toContain(expected)

Expected to contain: "@ (1.1) myVar = 123"
Received: "§ (1) test.ts\n@ (1.1) myVar 123"

      at <anonymous> (/home/realme-book/Project/code/scn-ts/test/ts/unit/code-entities.test.ts:92:17)
✗ SCN Generation: 1.3 Code Entities > should represent a top-level const with @ [66.00ms]
1/3 Discovering files...
  -> Found 1 files to analyze.
2/3 Analyzing code and building graph...
  -> Built graph with 2 nodes and 0 edges.
3/3 Ranking graph nodes...
  -> Ranking complete.
 96 |     project = await setupTestProject({ 'test.ts': `export default class MyClass {}` });
 97 |     const scn = await generateScn({
 98 |       root: project.projectDir,
 99 |       include: [`**/*.ts`],
100 |     });
101 |     expect(scn).toContain('+ ◇ (1.1) MyClass');
                      ^
error: expect(received).toContain(expected)

Expected to contain: "+ ◇ (1.1) MyClass"
Received: "§ (1) test.ts\n◇ (1.1) MyClass {}"

      at <anonymous> (/home/realme-book/Project/code/scn-ts/test/ts/unit/code-entities.test.ts:101:17)
✗ SCN Generation: 1.3 Code Entities > should correctly handle export default class [38.00ms]
1/3 Discovering files...
  -> Found 1 files to analyze.
2/3 Analyzing code and building graph...
  -> Built graph with 2 nodes and 0 edges.
3/3 Ranking graph nodes...
  -> Ranking complete.
105 |     project = await setupTestProject({ 'test.ts': `export default function myFunc() {}` });
106 |     const scn = await generateScn({
107 |       root: project.projectDir,
108 |       include: [`**/*.ts`],
109 |     });
110 |     expect(scn).toContain('+ ~ (1.1) myFunc()');
                      ^
error: expect(received).toContain(expected)

Expected to contain: "+ ~ (1.1) myFunc()"
Received: "§ (1) test.ts\n~ (1.1) myFunc () {}"

      at <anonymous> (/home/realme-book/Project/code/scn-ts/test/ts/unit/code-entities.test.ts:110:17)
✗ SCN Generation: 1.3 Code Entities > should correctly handle export default function [55.00ms]

test/ts/unit/general-structural.test.ts:
1/3 Discovering files...
  -> Found 2 files to analyze.
2/3 Analyzing code and building graph...
  -> Built graph with 2 nodes and 0 edges.
3/3 Ranking graph nodes...
  -> Ranking complete.
✓ SCN Generation: 1.1 General & Structural > should generate a § file declaration with a unique ID and correct relative path [58.00ms]
1/3 Discovering files...
  -> Found 1 files to analyze.
2/3 Analyzing code and building graph...
  -> Built graph with 3 nodes and 0 edges.
3/3 Ranking graph nodes...
  -> Ranking complete.
36 |     const scn = await generateScn({
37 |       root: project.projectDir,
38 |       include: [`**/*.ts`],
39 |     });
40 |
41 |     expect(scn).toContain('+ ~ (1.1) funcA()');
                     ^
error: expect(received).toContain(expected)

Expected to contain: "+ ~ (1.1) funcA()"
Received: "§ (1) test.ts\n~ (1.1) funcA () {}\n◇ (1.2) ClassB {}"

      at <anonymous> (/home/realme-book/Project/code/scn-ts/test/ts/unit/general-structural.test.ts:41:17)
✗ SCN Generation: 1.1 General & Structural > should assign unique, incrementing entity IDs within a file, starting from 1 [56.00ms]
1/3 Discovering files...
  -> Found 2 files to analyze.
2/3 Analyzing code and building graph...
  -> Built graph with 2 nodes and 1 edges.
3/3 Ranking graph nodes...
  -> Ranking complete.
✓ SCN Generation: 1.1 General & Structural > should represent a side-effect import with a .0 entity ID [61.00ms]

 4 pass
 14 fail
 28 expect() calls
Ran 18 tests across 3 files. [1091.00ms]


===

you are on scn-ts project

1. rather than importing from npm lib `repograph` why not directly from repograph/src/index.ts
2. address below fail test by maybe fixing repograph. but repograph should be not worry about scn notation concern.

===

execute the test.plan.md for part 1.1 until 1.3 by following below 10 rules;

1. if no implementation on src by given cases, then create the implementation.
2. implement test/ts/e2e/[categories]/*.test.ts files, test/ts/integration/[categories]/*.test.ts files, test/ts/unit/[categories]/*.test.ts files,  test/test.util.ts
3. Test cases should be isolated and clean no left over even on sigterm
4. Test should use bun:test describe,it,afterAll,beforeAll,afterEach,beforeEach without mock
5. Create challenging, thorough test cases that fully verify implementation
6. Test cases should match expected requirements
7. Do not create test of tricks, simulation, stub, mock, etc. you should produce code of real algorithm
8. Do not create any new file for helper,script etc. just do what prompted.
9. test should create/use/modify test/test.util.ts for reusability
10 type of any, unknown, casting as: they are strictly forbidden!!!

===

is test.plan.md already covered all scn notation v.1.0 compliance?

===

you are on scn-ts project

based on "README.md" and "docs/scn.readme.md" please create "docs/test.plan.md" planning items with `it should` language separated in categories and unit, e2e, integration.

===

you are on scn-ts project

now develop the scn-ts based on scn-ts README.md S repograph npm lib.

make sure to follow below rules;
1. use HOF
2. no oop, no classes.
3. immutable
4. no type of any, unknown and as casting
5. types should import from repograph npm lib

additional context for you
1. repograph readme.md
2. docs/scn-ts-2.report.md

===

I want scnjs to be programmatic api for js/ts that able to generate scn notation from multi language like js,ts, go, rust, python etc.... you can also change the project name from scnjs to more suitable... update package.json
