# 第十六阶段：天王星 5 卫星 + 海卫一（6颗）

## 目标

为天王星的 5 颗主要卫星和海王星的海卫一实现特写模式。完成太阳系除火卫一/二外的全部卫星纹理。

---

## 6 颗卫星概览

| 卫星 | 中文名 | 所属行星 | 视觉特征 | 纹理来源 |
|------|--------|----------|----------|----------|
| **Miranda** | 天卫一 | Uranus | 灰色冰岩 + 拼贴地貌（chevron） + 撞击坑 | `uranus-ice-moons.js` |
| **Ariel** | 天卫二 | Uranus | 亮灰色冰卫星 + 峡谷裂缝 + 亮斑 | `uranus-ice-moons.js` |
| **Umbriel** | 天卫三 | Uranus | 极暗灰色 + 少数亮色撞击坑边缘 | `uranus-ice-moons.js` |
| **Titania** | 天卫四 | Uranus | 中灰色（天王星最大卫星） + 撞击坑 | `uranus-ice-moons.js` |
| **Oberon** | 天卫五 | Uranus | 暗灰色 + 古老撞击表面 | `uranus-ice-moons.js` |
| **Triton** | 海卫一 | Neptune | 粉灰色哈密瓜地貌 + 氮冰羽流 + 冰冠 | 独立 `triton.js` |

---

## 纹理生成

### 天王星 5 卫星 — 统一 `uranus-ice-moons.js`

`createUranusIceMoonTexture(moonId)` 通过参数区分5颗卫星的色调和特殊特征：

| moonId | 底色色系 | 特殊特征 |
|--------|---------|---------|
| `'miranda'` | 亮灰蓝 `#b8c4d6` | 20个三角形拼贴地貌（chevron） |
| `'ariel'` | 更亮灰蓝 `#c8d0d8` | 标准冰卫星外观 |
| `'umbriel'` | 暗灰 `#98a0a8` | 全局再暗化15% |
| `'titania'` | 中灰 `#b0b8c0` | 标准冰卫星外观 |
| `'oberon'` | 深灰 `#a8b0b8` | 标准冰卫星外观 |

通用特征（所有5颗共享）：
- 撞击坑 ×100 ：`rgba(80,80,90,0.4)`
- 冰裂缝线 ×40
- 亮色冰斑 ×15

### Triton — 独立 `triton.js`

海卫一是太阳系最独特的卫星之一（逆行轨道 + 哈密瓜地貌）：

- 粉灰色5段底色（`#d4c4b8` ↔ `#d8c8bc`）
- **200 个哈密瓜纹理**：密集圆形/椭圆凸起 + 描边（Triton 最独特特征）
- **30 个暗色氮冰羽流区**：极地径向渐变暗斑
- **25 个亮色冰冠**：南半球氮冰
- **60 个撞击坑**
- **30 条线性裂缝**

---

## 配置

### planetConfigs 新增

```js
miranda: { centerBody: { textureGenerator: () => createUranusIceMoonTexture('miranda') } },
ariel:   { centerBody: { textureGenerator: () => createUranusIceMoonTexture('ariel')   } },
umbriel: { centerBody: { textureGenerator: () => createUranusIceMoonTexture('umbriel') } },
titania: { centerBody: { textureGenerator: () => createUranusIceMoonTexture('titania') } },
oberon:  { centerBody: { textureGenerator: () => createUranusIceMoonTexture('oberon')  } },
triton:  { centerBody: { textureGenerator: createTritonTexture } },
```

### orbitingBodies 纹理

天王星特写真中5颗卫星 + 海王星特写真中海卫一 均加上 `textureGenerator`。

ALL_MOONS 中 `enabled: true`。

---

## 数据生成

```bash
python data/init_celestial.py miranda 天卫一 Miranda --type moon
python data/init_celestial.py ariel 天卫二 Ariel --type moon
python data/init_celestial.py umbriel 天卫三 Umbriel --type moon
python data/init_celestial.py titania 天卫四 Titania --type moon
python data/init_celestial.py oberon 天卫五 Oberon --type moon
python data/init_celestial.py triton 海卫一 Triton --type moon
```

---

## 文件变更

| 文件 | 变更 |
|------|------|
| `static/js/moons/uranus-ice-moons.js` | **新增**：`createUranusIceMoonTexture(moonId)` |
| `static/js/moons/triton.js` | **新增**：`createTritonTexture` |
| `data/moons/{miranda,ariel,umbriel,titania,oberon,triton}.json` | 各**新增** |
| `data/quizzes/{miranda,ariel,umbriel,titania,oberon,triton}.json` | 各**新增** |
| `static/js/main.js` | **修改**：2 imports + 6条planetConfigs + 天王星/海王星 orbitingBodies 纹理 + ALL_MOONS 启用 |

---

## 里程碑

此阶段完成后，太阳系 **19 颗卫星**全部具备特写纹理：

| 行星 | 已实现卫星数 | 
|------|-------------|
| 地球 | 1 (Moon) |
| 火星 | 2 (Phobos, Deimos) — 待 Phase 17 |
| 木星 | 4 (Io, Europa, Ganymede, Callisto) |
| 土星 | 7 (Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus) |
| 天王星 | 5 (Miranda, Ariel, Umbriel, Titania, Oberon) |
| 海王星 | 1 (Triton) |
| **合计** | **20** |

仅剩火卫一/二待实现。
