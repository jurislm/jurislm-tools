# 合併後發布流程驗收

## 線上證據

- PR #211 `fix(release): prevent docs-only version bumps` 已合併為
  `4978501b1c0d3a395d58463627270920d9b331ae`。
- Drone PR build #94 成功；`validate` 通過。
- Drone main push build #95 成功；`validate` 與 `release` 都通過。`release-pr`
  的 eligibility helper 找到未發布的 `feat`／`fix` subject，實際呼叫
  Release Please 並建立 PR #212。
- Release Please PR #212 `chore(main): release 1.37.2` 已合併為
  `0ba38f52f080470ed2a44deb3dcd045e8d61af15`。
- Drone main push build #97 成功；`github-release` 建立正式的 `v1.37.2`
  tag／GitHub Release，target commit 是 `0ba38f52f080470ed2a44deb3dcd045e8d61af15`。
  隨後 `release-pr` 對已更新的發布基準得到空範圍，exit `10` 並輸出
  `release-pr skipped: no feat/fix commit in the unreleased range`，沒有再建立
  release PR。
- PR #213 `docs(openspec): sync release eligibility specs` 已合併為
  `be562b4e352246af3bac089ebaf500d9613af50f`；Drone PR build #98 成功。
- Drone main push build #99 成功；這次合併後未發布範圍只有 `docs`，`release-pr`
  helper 回傳 exit `10`，輸出 `Release eligibility: no feat/fix commit found;
  skipping release-pr.` 與 `release-pr skipped: no feat/fix commit in the unreleased
  range`，沒有建立或更新 Release Please PR，直接完成 `release` pipeline。

## 需求與審查處置

- Issue #210 保持開啟；PR #211 已實作其驗收範圍，沒有使用 `Closes` 隱含改變
  issue 生命周期。
- Codex 的 P2 分頁執行緒 `PRRT_kwDORILQ0M6YHGX8` 在加入初始
  `per_page=100&page=1` 並驗證 Link 分頁後，已標記為 outdated 並 resolved。
- 以上證據確認 `github-release` 仍先於資格閘門執行；資格判定只控制
  `release-pr`，安全跳過與 fail closed 不會誤把未知範圍當成成功發布。

## 來源

- [PR #211](https://github.com/jurislm/jurislm-tools/pull/211)
- [PR #212](https://github.com/jurislm/jurislm-tools/pull/212)
- [Drone PR build #94](https://ci.jurislm.com/jurislm/jurislm-tools/94)
- [Drone main build #95](https://ci.jurislm.com/jurislm/jurislm-tools/95)
- [Drone main build #97](https://ci.jurislm.com/jurislm/jurislm-tools/97)
- [PR #213](https://github.com/jurislm/jurislm-tools/pull/213)
- [Drone PR build #98](https://ci.jurislm.com/jurislm-tools/98)
- [Drone main build #99](https://ci.jurislm.com/jurislm-tools/99)
- [GitHub Release v1.37.2](https://github.com/jurislm/jurislm-tools/releases/tag/v1.37.2)
- [Issue #210](https://github.com/jurislm/jurislm-tools/issues/210)
