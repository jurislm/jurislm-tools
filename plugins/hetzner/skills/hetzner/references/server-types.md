# Hetzner Server Types — Cheatsheet

| Type | vCPU | RAM | Disk | Arch | 月費 (€) | 適用場景 |
|------|------|-----|------|------|---------|---------|
| `cx22` | 2 | 4GB | 40GB | x86 | 4.59 | 開發、staging、小型 web app |
| `cx32` | 4 | 8GB | 80GB | x86 | 7.49 | 一般 production app |
| `cx42` | 8 | 16GB | 160GB | x86 | 14.59 | 中型 app + DB |
| `cx52` | 16 | 32GB | 320GB | x86 | 28.79 | 大型 app + DB |
| `cax11` | 2 | 4GB | 40GB | arm64 | 3.79 | 預算優先（ARM 便宜 20%）|
| `cax21` | 4 | 8GB | 80GB | arm64 | 6.49 | ARM-native workload |
| `cax31` | 8 | 16GB | 160GB | arm64 | 12.49 | — |
| `cax41` | 16 | 32GB | 320GB | arm64 | 24.49 | — |
| `ccx13` | 2 | 8GB | 80GB | x86 dedicated | 13.10 | 需要保證 CPU（DB、CI runner）|
| `ccx23` | 4 | 16GB | 160GB | x86 dedicated | 26.20 | — |
| `ccx33` | 8 | 32GB | 240GB | x86 dedicated | 49.20 | — |

**價格僅供參考，請以 `hetzner_list_server_types` 取得即時價格。**

## 選擇建議

- **預設選 `cx32`**（4vCPU/8GB）— 大多 web app 夠用
- **DB 專用機選 `ccx*`**（dedicated vCPU）— 避免共用機因 noisy neighbor 影響 query 延遲
- **預算敏感選 `cax*`**（ARM）— 少 20% 但要確認 image 支援 arm64
- **JurisLM production: `cx53`**（16/32/320 + EU），跑 30+ container
