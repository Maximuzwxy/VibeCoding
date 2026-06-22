# 第十七阶段：火卫一 + 火卫二 — 卫星特写补完

## 目标

为火星的两颗卫星（Phobos / Deimos）实现特写模式，完成太阳系全部 21 颗卫星的纹理覆盖。

---

## 火卫一 / 火卫二概览

| 卫星 | 中文名 | 视觉特征 | 颜色 |
|------|--------|----------|------|
| **Phobos** | 火卫一 | 灰褐色不规则体 + 斯蒂克尼撞击坑（直径1/3）+ 密集沟槽 + 粗糙表面 | `#8b7355` |
| **Deimos** | 火卫二 | 灰褐色光滑表面 + 较少撞击坑 + 细小颗粒纹理 | `#a0826d` |
​
---

## 纹理生成

### Phobos — `phobos.js`（1024×512）

- 灰褐色3段底色（`#7b6b55` ↔ `#8b7355`）
- **斯蒂克尼撞击坑**：暗色圆心 `#6b5b45` + 深色边缘描边 `#5b4b35`（直径80px，占球面1/3）
- **150 个小型撞击坑**：随机棕灰色圆形
- **30 条沟槽**：Phobos 特征性线性裂缝，随机角度与长度
- **500 个粗糙表面像素**：微纹理颗粒

### Deimos — `deimos.js`（1024×512）

- 灰褐色3段底色（`#90725d` ↔ `#a0826d`）
- **80 个撞击坑**：Deimos 表面较光滑，坑更少
- **300 个表面颗粒**：微纹理（比 Phobos 更细腻）

---

## 配置

```js
phobos: { centerBody: { textureGenerator: createPhobosTexture } },
deimos: { centerBody: { textureGenerator: createDeimosTexture } },
```

火星特写真中 orbitingBodies 加 `textureGenerator`。

ALL_MOONS 中 `enabled: true`。

---

## 数据生成

```bash
python data/init_celestial.py phobos 火卫一 Phobos --type moon
python data/init_celestial.py deimos 火卫二 Deimos --type moon
```

---

## 文件变更

| 文件 | 变更 |
|------|------|
| `static/js/moons/phobos.js` | **新增**：`createPhobosTexture` |
| `static/js/moons/deimos.js` | **新增**：`createDeimosTexture` |
| `data/moons/phobos.json` | **新增** |
| `data/moons/deimos.json` | **新增** |
| `data/quizzes/phobos.json` | **新增** |
| `data/quizzes/deimos.json` | **新增** |
| `static/js/main.js` | **修改**：2 imports + 2条planetConfigs + 火星orbitingBodies纹理 + ALL_MOONS启用 |

---

## 里程碑 — 卫星纹理全部完成

此阶段后，太阳系 **22 颗天体**（含月球）全部具备独立特写纹理：

| 行星 | 卫星 |
|------|------|
| 地球 | Moon |
| 火星 | Phobos, Deimos |
| 木星 | Io, Europa, Ganymede, Callisto |
| 土星 | Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus |
| 天王星 | Miranda, Ariel, Umbriel, Titania, Oberon |
| 海王星 | Triton |
| **合计** | **22**（8大行星 + 月球 + 21颗卫星 − 月球已计入共22颗天体）|

> 注：以上指有独立特写纹理的天体 = 8大行星 + 太阳 + 22颗卫星 = 31个独立场景。
