
prepare this project for npm publish ready to https://www.npmjs.com/package/scn-ts .. also use tsup

===

if I uncomment this in tsconfig.json of scn-ts

   // "baseUrl": ".",
    // "paths": {
    //   "repograph": ["repograph/src/index.ts"]
    // },

then I run `bun test test/ts/integration/ test/ts/unit/` it result 0 fail test

but when I comment that repograph also updating `bun install repograph` then ran the same test

it result 41 fail 6 pass.

so please, you have permission to both edit scn-ts and repograph


===

make the codebase radically DRY less code les LOC without causing fail bun test

===

add more complex cases to verify compliance with SCN v1.0

===

execute the test.plan.md for part 2 until 2.2 by following below 10 rules;

1. if no implementation on src by given cases, then create the implementation.
2. implement test/ts/e2e/[categories]/*.test.ts files, test/ts/integration/[categories]/*.test.ts files, test/ts/unit/[categories]/*.test.ts files,  test/test.util.ts
3. Test cases should be isolated and clean no left over even on sigterm
4. Test should use bun:test describe,it,afterAll,beforeAll,afterEach,beforeEach without mock
5. Create challenging, thorough test cases that fully verify implementation
6. Test cases should comply with SCN v1.0 expectations
7. Do not create test of tricks, simulation, stub, mock, etc. you should produce code of real algorithm
8. Do not create any new file for helper,script etc. just do what prompted.
9. test should create/use/modify test/test.util.ts for reusability
10 type of any, unknown, casting as: they are strictly forbidden!!!


===

execute the test.plan.md for part 1.4 until 1.6 by following below 10 rules;

1. if no implementation on src by given cases, then create the implementation.
2. implement test/ts/e2e/[categories]/*.test.ts files, test/ts/integration/[categories]/*.test.ts files, test/ts/unit/[categories]/*.test.ts files,  test/test.util.ts
3. Test cases should be isolated and clean no left over even on sigterm
4. Test should use bun:test describe,it,afterAll,beforeAll,afterEach,beforeEach without mock
5. Create challenging, thorough test cases that fully verify implementation
6. Test cases should comply with SCN v1.0 expectations
7. Do not create test of tricks, simulation, stub, mock, etc. you should produce code of real algorithm
8. Do not create any new file for helper,script etc. just do what prompted.
9. test should create/use/modify test/test.util.ts for reusability
10 type of any, unknown, casting as: they are strictly forbidden!!!

===

after successfully make 17/18 `bun test test/ts/` passed by modifying repograph/src, now one fail test on repograph/test.

rules you have to follow: docs/scn.readme.md
1. No SCN-specific logic in repograph, Repograph focuses on analysis, scn-ts on notation
2. Stay scn v.1.0 compliant as the single source of truth

480 |         }
481 |       }
482 |
483 |       const graph = await analyzer(files);
484 |
485 |       expect(graph.nodes.size).toBe(fixture.expected_nodes!);
                                     ^
error: expect(received).toBe(expected)

Expected: 40
Received: 28

      at <anonymous> (/home/realme-book/Project/code/scn-ts/repograph/test/unit/analyze.test.ts:485:32)
✗ Tree-sitter Analysis > Integration with Fixtures > should analyze sample-project fixture correctly [35.00ms]

1/3 Discovering files...
  -> Found 1 files to analyze.
2/3 Analyzing code and building graph...
  -> Built graph with 2 nodes and 0 edges.
3/3 Ranking graph nodes...
  -> Ranking complete.
61 |     project = await setupTestProject({ 'test.ts': `const myFunc = () => {}` });
62 |     const scn = await generateScn({
63 |       root: project.projectDir,
64 |       include: [`**/*.ts`],
65 |     });
66 |     expect(scn).toContain('~ (1.1) myFunc () => {}');
                     ^
error: expect(received).toContain(expected)

Expected to contain: "~ (1.1) myFunc () => {}"
Received: "§ (1) test.ts\n~ (1.1) myFunc myFunc = () =>"

      at <anonymous> (/home/realme-book/Project/code/scn-ts/test/ts/unit/code-entities.test.ts:66:17)
✗ SCN Generation: 1.3 Code Entities > should represent a const arrow function with ~ [35.00ms]

repograph/src/pipeline/analyze.ts:539:23 - error TS2532: Object is possibly 'undefined'.

539         codeSnippet = assignmentMatch[1].trim();
                          ~~~~~~~~~~~~~~~~~~
                       ~~~~~~~~~~~~~~~~~~~~~

src/serializer.ts:208:19 - error TS2532: Object is possibly 'undefined'.

208       return `= ${match[1].trim()}`;
                      ~~~~~~~~


error: "tsc" exited with code 1

===

after successfully make 18 `bun test test/ts/` passed by modifying repograph/src, now there are many fail test on repograph/test.

rules you have to follow:
1. No SCN-specific logic in repograph, Repograph focuses on analysis, scn-ts on notation
2. Stay scn v.1.0 compliant as the single source of truth

===

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
