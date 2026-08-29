# 卡牌图像资源

网页展示的完整卡面统一放在各类别的 `blank-card/`，独立插画放在同级的 `illustrator/`。网页只读取 `blank-card/`，不会把 Illustrator 素材当作卡面显示。

卡背统一放在 `card-back/` 下：`card-back/blank-card/` 存放网页展示用的卡背，`card-back/illustrator/` 预留给卡背插画或其他制作素材。

```text
card/
├── investigator/
│   ├── blank-card/awake/<card-id>.png
│   ├── blank-card/madness/<card-id>.png
│   └── illustrator/
├── strategy/blank-card/<card-id>.png
├── environment/blank-card/<card-id>.png
├── intel/blank-card/<card-id>.png
├── support/blank-card/<card-id>.png
└── card-back/
    ├── blank-card/<category>.png
    └── illustrator/
```

策略、环境、情报和辅助卡牌的卡背分别命名为 `strategy.png`、`environment.png`、`intel.png` 和 `support.png`，放在 `card-back/blank-card/`。新增卡牌时，沿用生成数据中的稳定 `id` 命名即可；暂时没有图像的卡牌会显示占位状态。

后续补充网页卡面时，仍然放入对应类别的 `blank-card/`：调查员使用 `blank-card/awake/<card-id>.png` 和 `blank-card/madness/<card-id>.png`，其他类别使用 `blank-card/<card-id>.png`。插画、原稿或不直接展示的视觉素材放入对应类别的 `illustrator/`；卡背插画放入 `card-back/illustrator/`。缺少 `blank-card` 时，网页会显示占位状态，不会回退到 `illustrator`。
