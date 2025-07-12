⚠️正在开发中，目前不稳定⚠️

# Duckling

[English](./README.md) | 中文

Duckling 是使用 Tauri 构建的轻量级桌面应用，用于快速浏览 `parquet`/`csv`文件数据和各种数据库数据，
支持 [DuckDB](https://github.com/duckdb/duckdb)

注意：本项目当前的目标不是构建一个全功能的数据库管理工具，只是为了方便的快速浏览各种类型的数据。

## 安装

从releases页面下载最新的安装包，进行安装。

对于 Windows 平台依赖 Webview2，如果遇到网络问题无法安装，可以[离线下载](https://developer.microsoft.com/en-us/microsoft-edge/webview2/#download-section) 安装 Webview2。

**注意**：软件安装路径要选择空白文件夹或者新建文件夹，不要选择非空文件夹，也不要将数据文件放到安装路径中，否则卸载时，如果选择了清空数据文件，整个文件夹会被删除，即使不是软件自己的文件。

## 使用

打开数据文件夹、`*.duckdb` 文件或者数据库连接。

![screenshot-dark](./assets/screenshot-dark.png)

![screenshot](./assets/screenshot.png)

## Q&A

在 Windows 上，DuckDB 需要 [Microsoft Visual C++ Redistributable](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist?view=msvc-170) 包作为构建时和**运行时**依赖项。如果 duckdb 相关功能异常，可能就是此依赖项的问题，需要自行下载安装修复。详见 [《构建 DuckDB》](https://duckdb.org/docs/stable/dev/building/windows)。
