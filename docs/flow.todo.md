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
