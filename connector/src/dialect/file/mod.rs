use std::path::PathBuf;

use anyhow::Result;
use async_trait::async_trait;

use crate::dialect::Connection;
use crate::dialect::duckdb::duckdb_sync;
use crate::utils::RawArrowData;
use crate::utils::{TreeNode, get_file_name};

#[derive(Debug, Default)]
pub struct FileConnection {
  pub path: String,
}

impl FileConnection {
  fn connect(&self) -> Result<duckdb::Connection> {
    Ok(duckdb::Connection::open_in_memory()?)
  }
}

#[async_trait]
impl Connection for FileConnection {
  async fn get_db(&self) -> Result<TreeNode> {
    let path = PathBuf::from(self.path.as_str());

    Ok(TreeNode {
      path: self.path.clone(),
      name: get_file_name(&self.path),
      node_type: path.extension().unwrap().to_string_lossy().to_string(),
      schema: None,
      children: None,
      size: None,
      comment: None,
    })
  }

  async fn query(&self, sql: &str, limit: usize, offset: usize) -> Result<RawArrowData> {
    let conn = self.connect()?;
    duckdb_sync::query(&conn, sql)
  }

  async fn table_row_count(&self, table: &str, r#where: &str) -> Result<usize> {
    let conn = self.connect()?;
    let sql = self._table_count_sql(table, r#where);
    let total = conn.query_row(&sql, [], |row| row.get::<_, usize>(0))?;
    Ok(total)
  }

  fn normalize(&self, name: &str) -> String {
    name.to_string()
  }
}
