# 卡牌图像资源

网页使用的卡面 PNG 按卡牌稳定 ID 存放，当前结构如下：

```text
card/
├── investigator/png/awake/<card-id>.png
├── investigator/png/madness/<card-id>.png
├── strategy/png/front/<card-id>.png
├── environment/png/front/<card-id>.png
├── intel/png/front/<card-id>.png
└── support/png/front/<card-id>.png
```

策略、环境、情报和辅助卡牌的卡背分别放在对应类别的 `png/back.png`。新增卡牌时，沿用生成数据中的 `id` 命名即可；暂时没有图像的卡牌会显示占位状态。

`illustrator/png/` 是后续补充插画的预留目录。插画准备完成后，导出为网页可用的 PNG、JPG 或 SVG：调查员使用 `<card-id>-awake.png` 和 `<card-id>-madness.png`，其他类别使用 `<card-id>.png` 或 `<card-id>-front.png`。这些文件会优先作为网页卡面显示，缺失时回退到当前完整卡面 PNG。
