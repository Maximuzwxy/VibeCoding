# 第十四阶段：木星伽利略卫星（4颗）

## 目标

在 Phase 13 的卫星框架基础上，实现木星的 4 颗伽利略卫星特写模式。验证框架对多样化纹理类型（硫磺火山、冰壳裂缝、冰岩混合、古老撞击坑）的支持。

---

## 4 颗伽利略卫星概览

| 卫星 | 中文名 | 视觉特征 | 颜色 |
|------|--------|----------|------|
| **Io** | 木卫一 | 硫磺黄色 + 橙色沉积 + 红色火山 + 白色羽流 + 暗色火山口 + 斑驳 | `#ffffcc` |
| **Europa** | 木卫二 | 冰白底色 + 深色冰裂纹 + 平行脊线 + 暗色/亮色区域 + 撞击坑 | `#ccddff` |
| **Ganymede** | 木卫三 | 灰褐色冰岩混合 + 暗色古老区 + 亮色沟槽 + 撞击坑 + 冰裂缝 | `#aaaaaa` |
| **Callisto** | 木卫四 | 灰褐古老表面 + 瓦尔哈拉多环结构 + 密集撞击坑400个 + 斑驳纹理 + 溅射纹 | `#886644` |

---

## 纹理生成（参照 solar-system 老代码）

### Io — 硫磺火山世界

- 硫磺黄色5段底色渐变（`#dcc658` ↔ `#e8d068`）
- **60 个橙色椭圆**：硫磺沉积 `rgba(220, 140, 60, 0.5)`
- **40 个红色椭圆**：火山活动区 `rgba(180, 60, 40, 0.4)`
- **30 个暗色火山口**：圆形暗斑 `rgba(60, 40, 30, 0.5)`
- **20 个白色羽流**：径向渐变亮点（火山喷发柱）
- **500 个斑驳像素**：棕色/橙色微纹理

### Europa — 冰下海洋

- 冰白浅褐色5段底色（`#d4c8b8` ↔ `#e4d8c8`）
- **100 条冰裂纹**：深色随机线条 `rgba(140, 120, 100, 0.6)`
- **80 组平行脊线**：每组5条平行线，Europa 最典型地貌 `rgba(160, 140, 120, 0.5)`
- **40 个暗色区域**：冰下物质露出
- **50 个亮色区域**：新鲜冰层
- **80 个小型撞击坑**

### Ganymede — 太阳系最大卫星

- 灰褐色冰岩混合3段底色（`#9a8a7a` ↔ `#a89888`）
- **80 个暗色古老区域**：撞击坑密集的椭圆
- **50 个亮色年轻区域**：沟槽地形
- **30 条平行沟槽**：Ganymede 典型线条地貌
- **21 个大型撞击坑**：1 主坑 + 20 随机坑
- **200 个小撞击坑**
- **50 条冰层裂缝**：细线

### Callisto — 最古老的表面

- 灰褐色3段底色（`#7a6f65` ↔ `#8a7f75`）
- **瓦尔哈拉多环结构**：8 层同心圆（半径 100~660），Callisto 最独特特征
- **5 个大型撞击坑**：各有边缘描边
- **400 个密集小撞击坑**：Callisto 撞击坑密度最高
- **600 个斑驳像素**：古老退化表面
- **30 条暗色溅射纹**

---

## 配置

```js
// planetConfigs 中各卫星特写
io: {
    centerBody: { radius: 0.95, textureGenerator: createIoTexture, axialTilt: 0 },
    cameraPosition: { x: 0, y: 2, z: 5 },
    minDistance: 2, maxDistance: 15,
    starCount: 5000
},
// europa / ganymede / callisto 配置相同，仅纹理函数不同
```

木星特写中的卫星：
```js
orbitingBodies: [
    { name: 'io', ..., textureGenerator: createIoTexture },
    { name: 'europa', ..., textureGenerator: createEuropaTexture },
    { name: 'ganymede', ..., textureGenerator: createGanymedeTexture },
    { name: 'callisto', ..., textureGenerator: createCallistoTexture }
]
```

---

## 数据生成

```bash
python data/init_celestial.py io 木卫一 Io --type moon
python data/init_celestial.py europa 木卫二 Europa --type moon
python data/init_celestial.py ganymede 木卫三 Ganymede --type moon
python data/init_celestial.py callisto 木卫四 Callisto --type moon
```

---

## 文件变更

| 文件 | 变更 |
|------|------|
| `static/js/moons/io.js` | **新增**：`createIoTexture` |
| `static/js/moons/europa.js` | **新增**：`createEuropaTexture` |
| `static/js/moons/ganymede.js` | **新增**：`createGanymedeTexture` |
| `static/js/moons/callisto.js` | **新增**：`createCallistoTexture` |
| `data/moons/io.json` | **新增** |
| `data/moons/europa.json` | **新增** |
| `data/moons/ganymede.json` | **新增** |
| `data/moons/callisto.json` | **新增** |
| `data/quizzes/io.json` | **新增** |
| `data/quizzes/europa.json` | **新增** |
| `data/quizzes/ganymede.json` | **新增** |
| `data/quizzes/callisto.json` | **新增** |
| `static/js/main.js` | **修改**：imports + planetConfigs 4条 + orbitingBodies 纹理 + ALL_MOONS 启用 |
| `data/init_celestial.py` | **修复**：`--type moon` 参数解析 bug |

---

## 框架验证

4 颗伽利略卫星验证了框架对多样化纹理的支持：

1. **硫磺火山**（Io）：多层颜色叠加 + 径向渐变羽流 + 斑驳微纹理
2. **冰壳裂缝**（Europa）：密集线条网 + 平行脊线组
3. **冰岩混合**（Ganymede）：暗色/亮色区域对比 + 沟槽地貌 + 撞击坑
4. **古老撞击表面**（Callisto）：多环结构 + 极高密度撞击坑 + 溅射纹

---

## 注意

修复了 `init_celestial.py` 的 bug：原 `len(sys.argv) != 4` 硬编码检查拒绝了 `--type moon` 参数（6个argv），改为 `not in (4, 6)`。
