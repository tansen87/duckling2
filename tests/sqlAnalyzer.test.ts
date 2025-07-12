// tests/sqlAnalyzer.test.js
// import _Parser, { Language, Query, SyntaxNode, Tree } from 'tree-sitter';
// import SQL from '@l1xnan/tree-sitter-sql';
// export class Parser extends _Parser {
//   constructor() {
//     super();
//   }

//   query(source: string) {
//     return new Query(SQL as Language, source);
//   }
// }
// parser = new Parser();
// parser.setLanguage(SQL as Language);
import { beforeAll, beforeEach, describe, it } from 'vitest';

import { Parser } from '@/ast';
import { analyzeContext, formatNodeTree } from '@/ast/analyze';
import { Node, Tree } from 'web-tree-sitter';

// --- Test Data ---

type CurrentContext = {
  sql: string;
  tree: Tree;
  rootNode: Node;
  position: number;
};

// --- Test Suite ---
describe('analyzeSqlContext', () => {
  let parser: Parser;
  beforeAll(async () => {
    parser = await Parser.load(
      'node_modules/@l1xnan/tree-sitter-sql/tree-sitter-sql.wasm',
    );
  });

  let current: CurrentContext;

  beforeEach((ctx) => {
    const sql = ctx.task.name;
    const tree = parser.parse(sql)!;
    const rootNode = tree!.rootNode;
    const position = sql.indexOf('_');
    console.log('root:\n', rootNode.toString());
    console.log(
      'root:\n',
      formatNodeTree(rootNode as unknown as Node, { includeText: true }),
    );
    current = {
      sql,
      tree,
      rootNode,
      position,
    };
  });
  // Basic check - Vitest will ensure async tests are handled
  it('select from _', async () => {
    const { sql, position } = current;
    const sqlContext = analyzeContext(
      parser,
      sql,
      position,
    );
    console.log('sqlContext:', sqlContext);
  });
  it('select * from _', async () => {
    const { sql, position } = current;
    const sqlContext = analyzeContext(
      parser,
      sql,
      position,
    );
    console.log('sqlContext:', sqlContext);
  });
  it('select _ from tbl0, tbl1 as t1, tbl2 t2', async () => {
    const { sql, position } = current;
    const sqlContext = analyzeContext(
      parser,
      sql,
      position,
    );
    console.log('sqlContext:', sqlContext);
  });
  it('select t1._ from tbl0, tbl1 as t1, tbl2 t2', async () => {
    const { sql, position } = current;
    const sqlContext = analyzeContext(
      parser,
      sql,
      position,
    );
    console.log('sqlContext:', sqlContext);
  });
  it('select * from tbl0 join _', async () => {
    const { sql, position } = current;
    const sqlContext = analyzeContext(
      parser,
      sql,
      position,
    );
    console.log('sqlContext:', sqlContext);
  });
  it('select * from tbl0 join tbl1 as t1 on _', async () => {
    const { sql, position } = current;
    const sqlContext = analyzeContext(
      parser,
      sql,
      position,
    );
    console.log('sqlContext:', sqlContext);
  });
  it('select * from tbl0 join tbl1 as t1 on t1._', async () => {
    const { sql, position } = current;
    const sqlContext = analyzeContext(
      parser,
      sql,
      position,
    );
    console.log('sqlContext:', sqlContext);
  });

  it('select * from db1._', async () => {
    const { sql, position } = current;
    const sqlContext = analyzeContext(
      parser,
      sql,
      position,
    );
    console.log('sqlContext:', sqlContext);
  });

  it('select * from db1.schema1.tbl1 as t1, db2.tbl2, tbl3 where _', async () => {
    const { sql, position } = current;
    const sqlContext = analyzeContext(
      parser,
      sql,
      position,
    );
    console.log('sqlContext:', sqlContext);
  });

  it('select * from tbl1, db2.tbl2 where a=1 and _', async () => {
    const { sql, position } = current;
    const sqlContext = analyzeContext(
      parser,
      sql,
      position,
    );
    console.log('sqlContext:', sqlContext);
  });

  it(`select * from tbl1, '_'`, async () => {
    const { sql, position } = current;
    const sqlContext = analyzeContext(
      parser,
      sql,
      position,
    );
    console.log('sqlContext:', sqlContext);
  });

  it(`select * from tbl1 order by _`, async () => {
    const { sql, position } = current;
    const sqlContext = analyzeContext(
      parser,
      sql,
      position,
    );
    console.log('sqlContext:', sqlContext);
  });

  it(`select * from tbl1 where a=1 order by _`, async () => {
    const { sql, position } = current;
    const sqlContext = analyzeContext(
      parser,
      sql,
      position,
    );
    console.log('sqlContext:', sqlContext);
  });

  it(`select * from tbl1 where a=1 group by _`, async () => {
    const { sql, position } = current;
    const sqlContext = analyzeContext(
      parser,
      sql,
      position,
    );
    console.log('sqlContext:', sqlContext);
  });
  it(`with a as (select * from _)`, async () => {
    const { sql, position } = current;
    const sqlContext = analyzeContext(
      parser,
      sql,
      position,
    );
    console.log('sqlContext:', sqlContext);
  });
  it(`select * from  tbl _`, async () => {
    const { sql, position } = current;
    const sqlContext = analyzeContext(
      parser,
      sql,
      position,
    );
    console.log('sqlContext:', sqlContext);
  });
});
