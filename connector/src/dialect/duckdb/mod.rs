use std::path::Path;

use crate::dialect::Connection;
use crate::dialect::duckdb::duckdb_sync::DuckDbSyncConnection;
use crate::utils::{Metadata, RawArrowData, TreeNode, detect_separator};
use async_trait::async_trait;
use regex::Regex;

pub mod duckdb_sync;

#[derive(Debug, Default)]
pub struct DuckDbConnection {
  pub path: String,
  pub cwd: Option<String>,
}

#[async_trait]
impl Connection for DuckDbConnection {
  async fn get_db(&self) -> anyhow::Result<TreeNode> {
    Ok(self.connect()?.get_db()?)
  }

  async fn query(&self, sql: &str, _limit: usize, _offset: usize) -> anyhow::Result<RawArrowData> {
    let (titles, batch) = self.connect()?.query(sql)?;
    let total = batch.num_rows();
    Ok(RawArrowData {
      total,
      batch,
      titles: Some(titles),
      sql: Some(sql.to_string()),
    })
  }

  #[allow(clippy::unused_async)]
  async fn query_count(&self, sql: &str) -> anyhow::Result<usize> {
    let total = self
      .connect()?
      .inner
      .query_row(sql, [], |row| row.get::<_, usize>(0))?;
    Ok(total)
  }

  fn dialect(&self) -> &'static str {
    "duckdb"
  }

  async fn show_schema(&self, schema: &str) -> anyhow::Result<RawArrowData> {
    let batch = self.connect()?.show_schema(schema)?;
    Ok(RawArrowData::from_batch(batch))
  }

  async fn show_column(&self, schema: Option<&str>, table: &str) -> anyhow::Result<RawArrowData> {
    let (db, tbl) = if schema.is_none() && table.contains('.') {
      let parts: Vec<&str> = table.splitn(2, '.').collect();
      (parts[0], parts[1])
    } else {
      ("", table)
    };
    let sql = format!(
      "select * from information_schema.columns where table_schema='{db}' and table_name='{tbl}'"
    );
    log::info!("show columns: {}", &sql);
    self.query(&sql, 0, 0).await
  }

  async fn all_columns(&self) -> anyhow::Result<Vec<Metadata>> {
    Ok(self.connect()?.all_columns()?)
  }

  async fn drop_table(&self, schema: Option<&str>, table: &str) -> anyhow::Result<String> {
    let (db, tbl) = if schema.is_none() && table.contains('.') {
      let parts: Vec<&str> = table.splitn(2, '.').collect();
      (parts[0], parts[1])
    } else {
      ("", table)
    };

    let table_name = if db.is_empty() {
      tbl.to_string()
    } else {
      format!("{db}.{tbl}")
    };
    self.connect()?.drop_table(&table_name)?;
    Ok(String::new())
  }

  async fn table_row_count(&self, table: &str, r#where: &str) -> anyhow::Result<usize> {
    let conn = self.connect()?;
    let sql = self._table_count_sql(table, r#where);
    let total = conn
      .inner
      .query_row(&sql, [], |row| row.get::<_, usize>(0))?;
    Ok(total)
  }

  fn normalize(&self, name: &str) -> String {
    if name.contains(' ') {
      format!("\"{name}\"")
    } else {
      name.to_string()
    }
  }

  async fn export(&self, sql: &str, file: &str, format: &str) -> anyhow::Result<()> {
    self.connect()?.export(sql, file, format)?;
    Ok(())
  }
  fn start_quote(&self) -> &'static str {
    "\""
  }
  fn end_quote(&self) -> &'static str {
    "\""
  }
  fn validator(&self, id: &str) -> bool {
    if id.is_empty() {
      return false;
    }

    if id.starts_with("'") && id.ends_with("'") {
      return true;
    }

    if let Ok(res) = Regex::new(r"^[a-zA-Z_][a-zA-Z0-9_]*\([^)]*\)$") {
      if res.is_match(id) {
        return true;
      }
    }

    let mut chars = id.chars();
    let first = chars.next().unwrap();
    if !(first.is_ascii_alphabetic() || first == '_') {
      return false;
    }
    chars.all(|c| c.is_ascii_alphanumeric() || c == '_')
  }
}

impl DuckDbConnection {
  pub(crate) fn connect(&self) -> anyhow::Result<DuckDbSyncConnection> {
    Ok(DuckDbSyncConnection::new(
      Some(self.path.clone()),
      self.cwd.clone(),
    )?)
  }
}

#[tokio::test]
async fn test_duckdb() {
  use arrow::util::pretty::print_batches;
  let conn = DuckDbSyncConnection::new(
    Some("D:/data_obs/product_nice_l1/deepseek.db".to_string()),
    None,
  )
  .unwrap();
  // let res = conn.query("select * from read_csv('D:/data_obs/sys_env.csv', auto_detect=true, union_by_name=true) limit 500");
  let res = conn.query("SELECT extension_name, installed, description FROM duckdb_extensions()");
  println!("{:?}", res);
  let (_, batch) = res.unwrap();
  let _ = print_batches(&[batch]);
}

pub async fn csv2duckdb(
  path: String,
  quote: String,
  table_name: String,
  all_varchar: String,
) -> Result<String, String> {
  let parent_path = Path::new(&path).parent().unwrap().to_str().unwrap();
  let file_stem = Path::new(&path).file_stem().unwrap().to_str().unwrap();
  let output_path = format!("{parent_path}/{file_stem}.duckdb");

  let sep = detect_separator(&path).map_err(|e| e.to_string())?;
  let sep_str = String::from(sep as char);

  let conn = duckdb::Connection::open(&output_path)
    .map_err(|e| format!("Failed to open duckdb connection: {}", e))?;

  let idata = format!(
    "
    CREATE TABLE {table_name}
    AS SELECT *
    FROM read_csv('{path}', all_varchar={all_varchar}, sep='{sep_str}', quote='{quote}');
    "
  );

  conn
    .execute_batch(&idata)
    .map_err(|e| format!("Failed to insert csv to duckdb: {}", e))?;

  Ok("CSV imported successfully into DuckDB".to_string())
}
