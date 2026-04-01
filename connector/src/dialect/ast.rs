use sqlparser::ast::Statement;
// use sqlparser::dialect::GenericDialect;
use sqlparser::parser::Parser;

pub fn count_sql(sql: &str) -> String {
  format!("select count(*) from ({sql}) ____")
}

pub fn limit_sql(sql: &str, limit: Option<usize>, offset: Option<usize>) -> String {
  let mut sql = format!("select * from ({sql}) ____");
  if let Some(limit) = limit {
    sql = format!("{sql} limit {limit}");
  }
  if let Some(offset) = offset {
    sql = format!("{sql} offset {offset}");
  }
  sql
}

pub fn count_stmt(dialect: &str, stmt: &Statement) -> Option<String> {
  let dialect = convert_dialect(dialect);
  let dialect = &*dialect;
  match stmt {
    Statement::Query(query) => {
      if let Some(ref with) = query.with {
        let mut tmp = query.clone();
        let tmp = tmp.as_mut();
        tmp.with = None;

        let count_sql = count_sql(&tmp.to_string());
        let stmt: &mut Statement = &mut Parser::parse_sql(dialect, &count_sql).unwrap()[0];

        if let Statement::Query(tmp) = stmt {
          tmp.with = Some(with.clone());
          Some(tmp.to_string())
        } else {
          None
        }
      } else {
        Some(count_sql(&query.to_string()))
      }
    }
    _ => None,
  }
}

pub fn first_stmt(dialect: &str, sql: &str) -> Option<Statement> {
  let dialect = convert_dialect(dialect);
  let dialect = &*dialect;
  Parser::parse_sql(dialect, sql).ok().and_then(|t| {
    if t.len() == 1 {
      Some(t[0].clone())
    } else {
      None
    }
  })
}

pub fn limit_stmt(
  dialect: &str,
  stmt: &Statement,
  limit: Option<usize>,
  offset: Option<usize>,
) -> Option<String> {
  let dialect = convert_dialect(dialect);
  let dialect = &*dialect;
  match stmt {
    Statement::Query(query) => {
      if let Some(ref with) = query.with {
        let mut tmp = query.clone();
        let tmp = tmp.as_mut();
        tmp.with = None;

        let count_sql = limit_sql(&tmp.to_string(), limit, offset);
        let stmt: &mut Statement = &mut Parser::parse_sql(dialect, &count_sql).unwrap()[0];

        if let Statement::Query(tmp) = stmt {
          tmp.with = Some(with.clone());
          Some(tmp.to_string())
        } else {
          None
        }
      } else {
        Some(limit_sql(&query.to_string(), limit, offset))
      }
    }
    _ => None,
  }
}

// fn parse_order_by_expr(order_by: &str) -> Vec<(String, Option<bool>)> {
//   let sql = format!("select * from __ order by {order_by}");

//   let dialect = GenericDialect {};
//   let stmts = Parser::parse_sql(&dialect, &sql).unwrap();

//   let mut exprs = vec![];
//   for stmt in &stmts {
//     if let Statement::Query(tmp) = stmt
//       && let Some(order_by) = &tmp.order_by
//       && let OrderByKind::Expressions(_exprs) = &order_by.kind
//     {
//       for expr in _exprs {
//         exprs.push((expr.expr.to_string(), expr.options.asc));
//       }
//     }
//   }
//   exprs
// }

fn convert_dialect(d: &str) -> Box<dyn sqlparser::dialect::Dialect> {
  match d {
    "duckdb" => Box::new(sqlparser::dialect::DuckDbDialect {}),
    _ => Box::new(sqlparser::dialect::GenericDialect {}),
  }
}
