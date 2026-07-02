# 第十五阶段：土星卫星群（7颗）

## 目标

为土星的 7 颗主要卫星实现特写模式，含独立纹理生成。

---

## 7 颗卫星概览

| 卫星 | 中文名 | 视觉特征 | 纹理来源 |
|------|--------|----------|----------|
| **Mimas** | 土卫一 | 灰色冰壳 + 赫歇尔撞击坑（直径1/3） + 中央峰 | 独立 `mimas.js` |
| **Enceladus** | 土卫二 | 亮白冰壳 + 虎纹裂缝 + 反光率极高 | 独立 `enceladus.js` |
| **Tethys** | 土卫三 | 浅灰色冰卫星 + 撞击坑 | 通用 `saturn-ice-moons.js` (light) |
| **Dione** | 土卫四 | 中灰色冰卫星 + 亮斑 | 通用 `saturn-ice-moons.js` (medium) |
| **Rhea** | 土卫五 | 暗灰色冰卫星 + 撞击坑 | 通用 `saturn-ice-moons.js` (dark) |
| **Titan** | 土卫六 | 橙黄色浓厚大气 + 甲烷湖泊 + 沙丘 | 独立 `titan.js` |
| **Iapetus** | 土卫八 | 双色（亮暗） + 撞击坑 | 通用 `saturn-ice-moons.js` (twoface) |

---

## 纹理生成

### Titan — 浓厚大气 + 甲烷湖泊（2048×1024）

- 橙黄色5段底色（`#c4a87c` ↔ `#e0c89c`）
- **50 个大气雾霾**：径向渐变 `rgba(220, 190, 140, 0→0.3)`
- **30 个碳氢化合物沙丘**：赤道带状暗色椭圆 `rgba(120, 100, 70, 0.4)`
- **40 个冰质地表**：亮色椭圆 `rgba(230, 210, 180, 0.3)`
- **3 个甲烷湖泊**（北极）：克拉肯海 + 丽姬亚海 + 蓬加海
- **20 条大气条纹**：橙色带状
- **40 个云层**：淡橙径向渐变亮斑

### Mimas — 死亡之星（1024×512）

- 灰色3段底色（`#b0b0b0` ↔ `#c0c0c0`）
- **赫歇尔撞击坑**：圆心带边缘描边 + 中央峰（占球面1/3）
- **100 个小型撞击坑**：`rgba(100,100,100,0.5)`

### Enceladus — 亮白冰壳（1024×512）

- 亮白3段底色（`#e0e0e0` ↔ `#f0f0f0`）
- **40 条虎纹裂缝**：暗色多段折线 `rgba(150,145,140,0.7)`
- **50 个暗色裂缝区域**：圆形暗斑
- **30 个光滑光斑**：白色径向渐变（反光率极高）

### 通用冰卫星 — Tethys / Dione / Rhea / Iapetus（1024×512）

`createSaturnIceMoonTexture(colorStyle)` 支持4种色系：

| style | 底色 | 针对天体 | 特别处理 |
|-------|------|----------|----------|
| `'light'` | `#d0d0d0` / `#c8c8c8` | Tethys | - |
| `'medium'` | `#c0c0c0` / `#b8b8b8` | Dione | - |
| `'dark'` | `#b0b0b0` / `#a8a8a8` | Rhea | - |
| `'twoface'` | 左亮右暗 | Iapetus | 右半填充 `#707070` |

通用特征：
- 冰裂缝线 ×30
- 撞击坑 ×80
- 亮色光斑 ×20

---

## 配置

土星特写中的卫星（`orbitingBodies`）全部加上 `textureGenerator`：

```js
{ name: 'mimas', ..., textureGenerator: createMimasTexture },
{ name: 'enceladus', ..., textureGenerator: createEnceladusTexture },
{ name: 'tethys', ..., textureGenerator: () => createSaturnIceMoonTexture('light') },
{ name: 'dione', ..., textureGenerator: () => createSaturnIceMoonTexture('medium') },
{ name: 'rhea', ..., textureGenerator: () => createSaturnIceMoonTexture('dark') },
{ name: 'titan', ..., textureGenerator: createTitanTexture },
{ name: 'iapetus', ..., textureGenerator: () => createSaturnIceMoonTexture('twoface') },
```

Tethys/Dione/Rhea/Iapetus 4 颗共享 `saturn-ice-moons.js`，通过颜色参数区分。

---

## 数据生成

```bash
python data/init_celestial.py titan 土卫六 Titan --type moon
python data/init_celestial.py enceladus 土卫二 Enceladus --type moon
python data/init_celestial.py mimas 土卫一 Mimas --type moon
python data/init_celestial.py tethys 土卫三 Tethys --type moon
python data/init_celestial.py dione 土卫四 Dione --type moon
python data/init_celestial.py rhea 土卫五 Rhea --type moon
python data/init_celestial.py iapetus 土卫八 Iapetus --type moon
```

---

## 文件变更

| 文件 | 变更 |
|------|------|
| `static/js/moons/titan.js` | **新增**：`createTitanTexture` |
| `static/js/moons/mimas.js` | **新增**：`createMimasTexture` |
| `static/js/moons/enceladus.js` | **新增**：`createEnceladusTexture` |
| `static/js/moons/saturn-ice-moons.js` | **新增**：`createSaturnIceMoonTexture(colorStyle)` |
| `data/moons/{titan,enceladus,mimas,tethys,dione,rhea,iapetus}.json` | 各**新增** |
| `data/quizzes/{titan,enceladus,mimas,tethys,dione,rhea,iapetus}.json` | 各**新增** |
| `static/js/main.js` | **修改**：4 imports + 7条planetConfigs + orbitingBodies纹理 + ALL_MOONS启用 |

---

## 设计说明

采用"独立纹理 + 通用纹理"分层策略：
- **视觉独特**的行星（Titan 浓厚大气、Mimas 赫歇尔坑、Enceladus 亮冰） → 独立文件
- **视觉相近**的灰色冰卫星（Tethys/Dione/Rhea/Iapetus） → 1 个通用文件 + 参数区分
- 避免为4颗相似天体重复代码，同时保持每颗的视觉辨识度

- Iapetus 独具"阴阳脸"特征（一半亮一半暗），通用纹理的 `twoface` 模式实现了此效果
