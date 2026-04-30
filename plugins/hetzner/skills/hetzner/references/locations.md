# Hetzner Cloud Locations

| Code | Name | Region | 適用場景 |
|------|------|--------|---------|
| `nbg1` | Nuremberg | EU 中部 | 預設、JurisLM 主要 region |
| `fsn1` | Falkenstein | EU 東部 | EU 備援 |
| `hel1` | Helsinki | EU 北部 | 北歐使用者 |
| `ash` | Ashburn (Virginia) | US 東部 | 美國使用者 |
| `hil` | Hillsboro (Oregon) | US 西部 | 美西、跨美亞流量 |
| `sin` | Singapore | Asia | 東南亞使用者 |

## Region 選擇規則

- **GDPR / EU 用戶**：必須留 EU（`nbg1` / `fsn1` / `hel1`）
- **跨國 latency 敏感**：選最靠近最大流量來源的 region
- **同 region 內網免費**：相同 location 的 server 之間 traffic 不計費

## JurisLM 現況

- Production CX53：`fsn1` (Falkenstein)
- 所有 DB 跟 app server 同 location 才能用 private network 內網

## 不要做

- 不要把 DB 跟 app 放不同 region（latency + cross-region traffic 費用）
- 不要為了「分散風險」開 5 region——增加複雜度，效益低
