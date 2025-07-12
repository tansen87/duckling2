use std::sync::Mutex;
use std::time::Instant;

use serde::{Deserialize, Serialize};
use sqlformat::{FormatOptions, QueryParams};
use tauri::State;

use crate::api::ArrowResponse;
use connector::dialect::Connection;
use connector::dialect::duckdb::{DuckDbConnection, csv2duckdb};
use connector::dialect::file::FileConnection;
use connector::dialect::folder::FolderConnection;
use connector::utils::{Metadata, TreeNode};

pub struct OpenedFiles(pub Mutex<Option<Vec<String>>>);

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct DialectPayload {
  pub dialect: String,
  pub path: Option<String>,
  pub cwd: Option<String>,
}

#[allow(clippy::unused_async)]
pub fn get_ast_dialect(dialect: &str) -> Box<dyn sqlparser::dialect::Dialect> {
  match dialect {
    "folder" | "file" | "duckdb" => Box::new(sqlparser::dialect::DuckDbDialect {}),
    _ => Box::new(sqlparser::dialect::GenericDialect {}),
  }
}

#[allow(clippy::unused_async)]
pub async fn get_dialect(
  DialectPayload { dialect, path, cwd }: DialectPayload,
) -> Option<Box<dyn Connection>> {
  match dialect.as_str() {
    "folder" => Some(Box::new(FolderConnection {
      path: path.unwrap(),
      cwd,
    })),
    "file" => Some(Box::new(FileConnection {
      path: path.unwrap(),
    })),
    "duckdb" => Some(Box::new(DuckDbConnection {
      path: path.unwrap(),
      cwd,
    })),
    _ => None,
  }
}

#[tauri::command]
pub async fn query(
  sql: String,
  limit: usize,
  offset: usize,
  dialect: DialectPayload,
) -> Result<ArrowResponse, String> {
  if let Some(d) = get_dialect(dialect).await {
    let start = Instant::now();
    let res = d.query(&sql, limit, offset).await;
    let duration = start.elapsed().as_millis();
    Ok(ArrowResponse::from_raw_data(res, Some(duration)))
  } else {
    Err("not support dialect".to_string())
  }
}

#[tauri::command]
pub async fn paging_query(
  sql: String,
  limit: usize,
  offset: usize,
  dialect: DialectPayload,
) -> Result<ArrowResponse, String> {
  if let Some(d) = get_dialect(dialect).await {
    let start = Instant::now();
    let res = d.paging_query(&sql, Some(limit), Some(offset)).await;
    let duration = start.elapsed().as_millis();
    Ok(ArrowResponse::from_raw_data(res, Some(duration)))
  } else {
    Err("not support dialect".to_string())
  }
}

#[tauri::command]
pub async fn query_table(
  table: &str,
  limit: usize,
  offset: usize,
  #[allow(non_snake_case)] orderBy: Option<String>,
  r#where: Option<String>,
  dialect: DialectPayload,
) -> Result<ArrowResponse, String> {
  let d = get_dialect(dialect.clone())
    .await
    .ok_or_else(|| format!("not support dialect {}", dialect.dialect))?;

  let start = Instant::now();
  let res = d
    .query_table(
      table,
      limit,
      offset,
      &r#where.clone().unwrap_or_default(),
      &orderBy.clone().unwrap_or_default(),
    )
    .await;
  let duration = start.elapsed().as_millis();
  Ok(ArrowResponse::from_raw_data(res, Some(duration)))
}

#[tauri::command]
pub async fn table_row_count(
  table: &str,
  condition: &str,
  dialect: DialectPayload,
) -> Result<usize, String> {
  if let Some(d) = get_dialect(dialect).await {
    d.table_row_count(table, condition)
      .await
      .map_err(|e| e.to_string())
  } else {
    Err("not support dialect".to_string())
  }
}

#[tauri::command]
pub async fn export(
  sql: String,
  file: String,
  format: Option<String>,
  dialect: DialectPayload,
) -> Result<(), String> {
  if let Some(d) = get_dialect(dialect).await {
    let format = if let Some(format) = format {
      format
    } else {
      file.split('.').next_back().unwrap_or("csv").to_string()
    };
    // 匹配以 "select * from (" 开头, 以 ") ____ limit 500 offset 0" 结尾的结构
    let pattern = r#"select \* from \((.*?)\) ____ limit 500 offset 0"#;
    let re = regex::Regex::new(pattern).unwrap();
    // 使用替换的方式提取结构中的内容
    let clean_sql = re.replace(&sql, |caps: &regex::Captures| {
        caps[1].to_string()
    });

    d.export(&clean_sql, &file, &format)
      .await
      .map_err(|e| format!("{e}"))?;
    Ok(())
  } else {
    Err("not support dialect".to_string())
  }
}

#[tauri::command]
pub async fn opened_files(state: State<'_, OpenedFiles>) -> Result<Vec<String>, String> {
  Ok(if let Some(files) = &*state.0.lock().unwrap() {
    files.to_vec()
  } else {
    vec![]
  })
}

#[tauri::command]
pub async fn get_db(dialect: DialectPayload) -> Result<TreeNode, String> {
  if let Some(d) = get_dialect(dialect).await {
    d.get_db().await.map_err(|e| e.to_string())
  } else {
    Err("not support dialect".to_string())
  }
}

#[tauri::command]
pub async fn show_schema(schema: &str, dialect: DialectPayload) -> Result<ArrowResponse, String> {
  let d = get_dialect(dialect.clone())
    .await
    .ok_or_else(|| format!("not support dialect {}", dialect.dialect))?;
  let res = d.show_schema(schema).await;

  Ok(ArrowResponse::from_raw_data(res, None))
}

#[tauri::command]
pub async fn show_column(
  schema: Option<&str>,
  table: &str,
  dialect: DialectPayload,
) -> Result<ArrowResponse, String> {
  let d = get_dialect(dialect.clone())
    .await
    .ok_or_else(|| format!("not support dialect {}", dialect.dialect))?;
  let res = d.show_column(schema, table).await;

  Ok(ArrowResponse::from_raw_data(res, None))
}

#[tauri::command]
pub async fn drop_table(
  schema: Option<&str>,
  table: &str,
  dialect: DialectPayload,
) -> Result<String, String> {
  let d = get_dialect(dialect.clone())
    .await
    .ok_or_else(|| format!("not support dialect {}", dialect.dialect))?;
  // TODO: ERROR INFO
  let res = d.drop_table(schema, table).await.expect("ERROR");
  Ok(res)
}

#[tauri::command]
pub async fn format_sql(sql: &str) -> Result<String, String> {
  let params = QueryParams::default();
  let options = FormatOptions::default();
  Ok(sqlformat::format(sql, &params, &options))
}

#[tauri::command]
pub async fn find(
  value: &str,
  path: &str,
  dialect: DialectPayload,
) -> Result<ArrowResponse, String> {
  let d = get_dialect(dialect.clone())
    .await
    .ok_or_else(|| format!("not support dialect {}", dialect.dialect))?;
  let res = d.find(value, path).await;

  Ok(ArrowResponse::from_raw_data(res, None))
}

#[tauri::command]
pub async fn all_columns(dialect: DialectPayload) -> Result<Vec<Metadata>, String> {
  let d = get_dialect(dialect.clone())
    .await
    .ok_or_else(|| format!("not support dialect {}", dialect.dialect))?;
  let s = d.all_columns().await;

  s.map_err(|e| format!("not support dialect {}", e))
}

#[tauri::command]
pub async fn load_csv(
  path: String,
  quote: String,
  table_name: String,
  all_varchar: String,
) -> Result<String, String> {
  let start_time = Instant::now();

  match csv2duckdb(path, quote, table_name, all_varchar).await {
    Ok(_) => {
      let end_time = Instant::now();
      let elapsed_time = end_time.duration_since(start_time).as_secs_f64();
      Ok(format!("{elapsed_time:.2}"))
    }
    Err(err) => Err(format!("load failed: {err}")),
  }
}
