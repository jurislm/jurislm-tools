# Pipeline Architecture Reference

Two pipeline architectures handle data synchronization for judicial and law data.

## Architecture Comparison

| Feature | Judicial Pipeline | Law Pipeline |
|---------|------------------|-------------|
| Core Class | `SyncPipeline` + `PhaseExecutor` | `LawPipeline` |
| Design Pattern | IoC (Executor-per-phase) | Method-oriented |
| Processing Unit | Fileset (each fileset completes all 9 stages independently) | Pcode (CHUNK/EMBED per-pcode, others global) |
| Status Tracking | `StatusManager` + `status.json` (per-fileset) | `LawStatusManager` (per-pipeline) |
| Checkpoint Recovery | Automatic (status.json records each phase status) | Automatic (status.json tracks global + per-pcode) |
| Stages | 9: DOWNLOAD → UNZIP → PARSE → CHUNK → EMBED → ZIP → NAS → DB_UPLOAD → CLEANUP | 9: DOWNLOAD → UNZIP → PARSE → CHUNK → EMBED → ZIP → NAS → IMPORT → CLEANUP |

## Pipeline Stages (9-Stage)

### Judicial Pipeline

```
DOWNLOAD → UNZIP → PARSE → CHUNK → EMBED → ZIP → NAS → DB_UPLOAD → CLEANUP
```

| Stage | Executor Class | Per-Fileset | Description |
|-------|---------------|-------------|-------------|
| DOWNLOAD | `DownloadExecutor` | Yes | Fetch compressed filesets from Judicial Yuan API |
| UNZIP | `UnzipExecutor` | Yes | Extract files (auto-detect ZIP/7Z/RAR) |
| PARSE | `ParseExecutor` | Yes | PDF parsing (052-054: attorneys, justices, opinions) |
| CHUNK | `ChunkExecutor` | Yes | Metadata Context text splitting (no LLM) |
| EMBED | `EmbedExecutor` | Yes | Generate bge-m3 embeddings (1024 dim)；可先查 NAS 快取（tryNasCacheHit） |
| ZIP | `ZipExecutor` | Yes | Compress embeddings to JSONL.gz |
| NAS | `NasExecutor` | Yes | Upload to Synology NAS（nasCache=true 時跳過重複上傳） |
| DB_UPLOAD | `DbUploadExecutor` | Yes | Import to shared database (ON CONFLICT UPSERT) |
| CLEANUP | `CleanupExecutor` | Yes | Remove extend/ dir + embeddings.jsonl.gz |

### Law Pipeline

```
DOWNLOAD → UNZIP → PARSE → CHUNK → EMBED → ZIP → NAS → IMPORT → CLEANUP
```

| Stage | Method | Scope | Description |
|-------|--------|-------|-------------|
| DOWNLOAD | `executeGlobalPhase("DOWNLOAD")` | Global | Fetch ChLaw.zip + ChOrder.zip |
| UNZIP | `executeGlobalPhase("UNZIP")` | Global | Extract JSON files |
| PARSE | `executeGlobalPhase("PARSE")` | Global | Parse JSON, extract pcode, output source.json |
| CHUNK | Per-pcode loop | Per-pcode | Split articles with Metadata Context |
| EMBED | Per-pcode loop | Per-pcode | Generate bge-m3 embeddings |
| ZIP | `executeGlobalPhase("ZIP")` | Global | Compress to JSONL.gz |
| NAS | `executeGlobalPhase("NAS")` | Global | Upload to Synology NAS |
| IMPORT | `executeGlobalPhase("IMPORT")` | Global | Import to DB via LawImportWorker |
| CLEANUP | `executeGlobalPhase("CLEANUP")` | Global | Remove pcode dirs + ChLaw/ChOrder.json |

## Core Class Mapping

| Class | File Path | Responsibility |
|-------|-----------|----------------|
| `SyncPipeline` | `core/pipeline/sync-pipeline.ts` | Judicial Pipeline orchestrator |
| `PhaseExecutor` | `adapters/worker/base.ts` | Phase executor abstract class |
| `DbUploadExecutor` | `adapters/worker/db-upload.ts` | Judicial DB upload executor |
| `CleanupExecutor` | `adapters/worker/cleanup.ts` | Judicial cleanup executor |
| `LawPipeline` | `core/law-pipeline.ts` | Law Pipeline orchestrator |
| `StatusManager` | `core/status-manager.ts` | Judicial status.json management |
| `PipelineContext` | `core/context.ts` | Judicial execution environment |
| `FilesetContext` | `core/fileset-context.ts` | Judicial fileset context |

## Idempotency Strategy

Both pipelines are safe to re-execute (idempotent).

### Judicial (ON CONFLICT UPSERT)

All INSERTs have ON CONFLICT protection:

| Table | Unique Key | ON CONFLICT Strategy |
|-------|-----------|---------------------|
| `datasets` | dataset_id | DO NOTHING |
| `filesets` | fileset_id | DO UPDATE (desc, format) |
| `documents_051` | jid (PK) | DO UPDATE (jfull, file_path) |
| `documents_052` | inte_no (UK) | DO UPDATE (desc, reason, file_path) |
| `documents_053/054` | ruling_id (UK) | DO UPDATE (content, reason, file_path) |
| `document_embeddings_051` | (jid, model, chunk_strategy, chunk_index) | DO UPDATE (embedding, text) |
| `document_embeddings_052/053/054` | (document_id, model, chunk_index) | DO UPDATE (embedding, text) |

### Law (Transaction DELETE + INSERT)

Atomic operations within a single transaction:

| Table | Strategy |
|-------|----------|
| `laws` | ON CONFLICT (pcode) DO UPDATE |
| `law_articles` | DELETE + INSERT within transaction |
| `law_attachments` | DELETE + INSERT within transaction |
| `law_embeddings` | DELETE + INSERT within transaction |

## Cleanup Behavior

### Judicial Cleanup (Precise)

- Deletes: `extend/` directory (extracted content + chunks + embeddings)
- Deletes: `embeddings.jsonl.gz` (compressed output)
- Preserves: `status.json` (checkpoint tracking)
- Preserves: Archive files (`.rar`, `.zip`, `.7z`)

### Law Cleanup

- Deletes: All `{pcode}_embed_{strategy}/` directories
- Deletes: `ChLaw.json` (~200MB) and `ChOrder.json` (~500MB)
- Preserves: `ChLaw.zip` (~25MB) and `ChOrder.zip` (~111MB) for re-extraction
- Preserves: `status.json` and `embeddings_{strategy}.jsonl.gz`

## NAS Stage — Skip 優化（nasCache）

`NasExecutor` 在上傳前會先檢查 `status.json` 中 EMBED 階段的快取旗標，若 EMBED 已從 NAS 下載 gz（而非重新計算），則跳過重複上傳。

### Skip 決策邏輯

```
讀取 status.json → EMBED.nasCache === true？
  是 → fileExists(nasPath)?   ← SYNO.FileStation.List getinfo API
    存在 → 寫 NAS=skipped 到 status.json → return SKIPPED
    不存在 → 繼續正常上傳（自動 fallback）
  否 → 繼續正常上傳
```

### status.json 關鍵欄位（由 EMBED nasCache 寫入）

```json
{
  "phases": {
    "EMBED": {
      "status": "completed",
      "nasCache": true,
      "nasPath": "/home/entire-embedding/bge-m3/051/48508/60685/embeddings.jsonl.gz"
    },
    "NAS": {
      "status": "skipped",
      "reason": "NAS cache hit（EMBED 從 NAS 下載，跳過重複上傳）",
      "nasPath": "/home/entire-embedding/bge-m3/051/48508/60685/embeddings.jsonl.gz"
    }
  }
}
```

### 情境矩陣

| nasCache | NAS 檔案存在 | force | 結果 |
|----------|------------|-------|------|
| true | 是 | any | 跳過（SKIPPED） |
| true | 否 | any | 自動 fallback → 正常上傳 |
| false / 無 | - | any | 正常上傳 |

**設計原則**：不看 `--force` flag。EMBED 的 `tryNasCacheHit` 本身不看 force，已信任 NAS cache；NAS 階段保持一致，避免「force = 重算 embedding + 但仍跳過上傳」的矛盾。

### SynologyClient.fileExists()

```typescript
// 查詢 NAS 上的檔案是否存在
await client.fileExists("/home/entire-embedding/bge-m3/051/.../embeddings.jsonl.gz");
// → true / false（API: SYNO.FileStation.List method: getinfo）
```

**注意**：`fileExists()` 需要先登入（`ensureLoggedIn()`），即使最終 skip 也會連 NAS 做一次驗證。

## Pre-flight Checks

The pipeline performs automatic pre-flight checks before execution:

| Check | Condition | Required For |
|-------|-----------|-------------|
| Ollama connection | `curl localhost:11434` | CHUNK, EMBED phases |
| NAS connection | Synology API auth | NAS phase |
| Shared DB connection | PostgreSQL ping | DB_UPLOAD / IMPORT phase |

If a check fails, the pipeline exits with an error message before starting any work.
