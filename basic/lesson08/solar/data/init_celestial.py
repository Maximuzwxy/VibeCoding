"""
天体数据初始化工具
用法: python data/init_celestial.py <id> <name_zh> <name_en> [--type moon]
示例:
  python data/init_celestial.py mercury 水星 Mercury
  python data/init_celestial.py moon 月球 Moon --type moon

功能:
  1. 调用 DeepSeek 生成 info_sections JSON → data/planets/{id}.json（或 data/moons/{id}.json）
  2. 调用 DeepSeek 生成 10 道选择题 → data/quizzes/{id}.json
"""

import json
import os
import sys

import requests

# 从项目根目录的 .env 文件加载环境变量
def _load_env():
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, val = line.split('=', 1)
                    os.environ.setdefault(key.strip(), val.strip())

_load_env()

# DeepSeek 配置（与 app.py 保持一致）
API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
API_URL = os.environ.get("DEEPSEEK_API_URL", "https://api.deepseek.com/chat/completions")
MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-v4-pro")

DATA_DIR = os.path.dirname(os.path.abspath(__file__))


def call_llm(prompt):
    """调用 DeepSeek API"""
    resp = requests.post(API_URL, json={
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "thinking": {"type": "disabled"}
    }, headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }, timeout=120)
    resp.raise_for_status()
    content = resp.json()["choices"][0]["message"]["content"].strip()

    # 去掉可能的 markdown 代码块包裹
    if content.startswith("```"):
        lines = content.split("\n")
        content = "\n".join(lines[1:]) if lines[0].startswith("```") else content
        content = content.rsplit("```", 1)[0] if content.endswith("```") else content
    return content


def generate_info(celestial_id, name_zh, name_en):
    """生成天体 info_sections 数据"""
    prompt = f"""请为天文物体 {name_zh}（{name_en}）生成详细的科普数据，使用中英文双语格式。

严格按以下 JSON 格式返回，不要其他说明，不要 markdown 包裹：

{{
  "id": "{celestial_id}",
  "name": {{"zh": "{name_zh}", "en": "{name_en}"}},
  "icon": "对应的天文emoji",
  "theme_color": "#hex颜色（符合该天体的代表色）",
  "info_sections": [
    {{
      "title": {{"zh": "📊 基本参数", "en": "📊 Basic Parameters"}},
      "items": [
        {{"label": {{"zh": "行星类型", "en": "Planet Type"}}, "value": {{"zh": "...", "en": "..."}}}},
        {{"label": {{"zh": "赤道直径", "en": "Equatorial Diameter"}}, "value": {{"zh": "...", "en": "..."}}}},
        {{"label": {{"zh": "质量", "en": "Mass"}}, "value": {{"zh": "...", "en": "..."}}}},
        {{"label": {{"zh": "体积", "en": "Volume"}}, "value": {{"zh": "...", "en": "..."}}}},
        {{"label": {{"zh": "平均密度", "en": "Average Density"}}, "value": {{"zh": "...", "en": "..."}}}},
        {{"label": {{"zh": "表面重力", "en": "Surface Gravity"}}, "value": {{"zh": "...", "en": "..."}}}}
      ],
      "note": {{"zh": "※ 一个该天体最独特的事实", "en": "※ One most distinctive fact"}}
    }},
    {{
      "title": {{"zh": "🕐 时间参数", "en": "🕐 Time Parameters"}},
      "items": [
        {{"label": {{"zh": "自转周期", "en": "Rotation Period"}}, "value": {{"zh": "...", "en": "..."}}}},
        {{"label": {{"zh": "公转周期", "en": "Orbital Period"}}, "value": {{"zh": "...", "en": "..."}}}},
        {{"label": {{"zh": "公转速度", "en": "Orbital Speed"}}, "value": {{"zh": "...", "en": "..."}}}},
        {{"label": {{"zh": "轨道离心率", "en": "Orbital Eccentricity"}}, "value": {{"zh": "...", "en": "..."}}}},
        {{"label": {{"zh": "轨道倾角", "en": "Orbital Inclination"}}, "value": {{"zh": "...", "en": "..."}}}}
      ],
      "note": {{"zh": "※ 一个关于其轨道的有趣事实", "en": "※ Interesting orbital fact"}}
    }},
    {{
      "title": {{"zh": "🌡 环境参数", "en": "🌡 Environmental Parameters"}},
      "items": [
        {{"label": {{"zh": "表面温度", "en": "Surface Temperature"}}, "value": {{"zh": "...", "en": "..."}}}},
        {{"label": {{"zh": "平均温度", "en": "Average Temperature"}}, "value": {{"zh": "...", "en": "..."}}}},
        {{"label": {{"zh": "大气压力", "en": "Atmospheric Pressure"}}, "value": {{"zh": "...", "en": "..."}}}},
        {{"label": {{"zh": "大气成分", "en": "Atmospheric Composition"}}, "value": {{"zh": "...", "en": "..."}}}},
        {{"label": {{"zh": "磁场强度", "en": "Magnetic Field Strength"}}, "value": {{"zh": "...", "en": "..."}}}}
      ],
      "note": {{"zh": "※ 环境特质说明", "en": "※ Environmental trait note"}}
    }},
    {{
      "title": {{"zh": "📍 位置参数", "en": "📍 Position Parameters"}},
      "items": [
        {{"label": {{"zh": "近日点", "en": "Perihelion"}}, "value": {{"zh": "...", "en": "..."}}}},
        {{"label": {{"zh": "远日点", "en": "Aphelion"}}, "value": {{"zh": "...", "en": "..."}}}},
        {{"label": {{"zh": "半长轴", "en": "Semi-major Axis"}}, "value": {{"zh": "...", "en": "..."}}}},
        {{"label": {{"zh": "天文单位", "en": "Astronomical Units"}}, "value": {{"zh": "...", "en": "..."}}}},
        {{"label": {{"zh": "光行时", "en": "Light Travel Time"}}, "value": {{"zh": "...", "en": "..."}}}}
      ]
    }},
    {{
      "title": {{"zh": "🌑 卫星系统", "en": "🌑 Satellite System"}},
      "items": [
        {{"label": {{"zh": "已知卫星", "en": "Known Moons"}}, "value": {{"zh": "...", "en": "..."}}}},
        {{"label": {{"zh": "卫星名称", "en": "Moon Names"}}, "value": {{"zh": "...", "en": "..."}}}}
      ],
      "note": {{"zh": "※ 该天体卫星的整体特征", "en": "※ Overall moon system trait"}}
    }},
    {{
      "title": {{"zh": "🌋 地表特征", "en": "🌋 Surface Features"}},
      "items": [
        {{"label": {{"zh": "主要地形", "en": "Main Terrain"}}, "value": {{"zh": "...", "en": "..."}}}},
        {{"label": {{"zh": "最大撞击坑", "en": "Largest Crater"}}, "value": {{"zh": "...", "en": "..."}}}},
        {{"label": {{"zh": "地表年龄", "en": "Surface Age"}}, "value": {{"zh": "...", "en": "..."}}}},
        {{"label": {{"zh": "最高峰", "en": "Highest Peak"}}, "value": {{"zh": "...", "en": "..."}}}}
      ],
      "note": {{"zh": "※ 地表最显著的特征", "en": "※ Most notable surface feature"}}
    }},
    {{
      "title": {{"zh": "🔭 探索历史", "en": "🔭 Exploration History"}},
      "items": [
        {{"label": {{"zh": "首次发现/观测", "en": "First Discovered/Observed"}}, "value": {{"zh": "...", "en": "..."}}}},
        {{"label": {{"zh": "首次飞掠", "en": "First Flyby"}}, "value": {{"zh": "...", "en": "..."}}}},
        {{"label": {{"zh": "首次入轨", "en": "First Orbit"}}, "value": {{"zh": "...", "en": "..."}}}},
        {{"label": {{"zh": "当前/最近任务", "en": "Current/Recent Mission"}}, "value": {{"zh": "...", "en": "..."}}}}
      ],
      "note": {{"zh": "※ 探测任务的亮点", "en": "※ Mission highlight"}}
    }}
  ]
}}

要求：
- 所有数值准确、科学、标准单位
- 每个 note 给出独特有趣的事实
- emoji 使用该天体的天文符号"""
    return call_llm(prompt)


def generate_quiz(celestial_id, name_zh, name_en):
    """生成 10 道选择题"""
    prompt = f"""请为 {name_zh}（{name_en}）生成 10 道四选一选择题，使用中英文双语格式。

严格按以下 JSON 数组格式返回，不要其他说明，不要 markdown 包裹：

[
  {{
    "id": "q_{celestial_id}_001",
    "question": {{"zh": "问题中文", "en": "Question in English"}},
    "options": [
      {{"zh": "选项A", "en": "Option A"}},
      {{"zh": "选项B", "en": "Option B"}},
      {{"zh": "选项C", "en": "Option C"}},
      {{"zh": "选项D", "en": "Option D"}}
    ],
    "answer": 0,
    "explanation": {{"zh": "解析中文", "en": "Explanation in English"}}
  }},
  ...共10题
]

要求：
- 题目覆盖：基本特征、轨道参数、物理特性、环境条件、探索历史
- 答案均匀分布在 0-3
- 确保科学准确性"""
    return json.loads(call_llm(prompt))


def main():
    if len(sys.argv) not in (4, 6):
        print("用法: python data/init_celestial.py <id> <name_zh> <name_en> [--type moon]")
        print("示例: python data/init_celestial.py mercury 水星 Mercury")
        print("      python data/init_celestial.py moon 月球 Moon --type moon")
        sys.exit(1)

    celestial_id = sys.argv[1]
    name_zh = sys.argv[2]
    name_en = sys.argv[3]
    celestial_type = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] == '--type' and len(sys.argv) > 5 else None
    if celestial_type:
        celestial_type = sys.argv[5]  # 'moon' or 'planet'

    print(f"正在为 {name_zh}({name_en}) 生成 info 数据...")
    info_json = generate_info(celestial_id, name_zh, name_en)
    info = json.loads(info_json)

    print(f"正在为 {name_zh}({name_en}) 生成 quiz 题库...")
    questions = generate_quiz(celestial_id, name_zh, name_en)

    # 写入文件 — 卫星存 moons/，行星存 planets/
    sub_dir = "moons" if celestial_type == "moon" else "planets"
    planet_path = os.path.join(DATA_DIR, sub_dir, f"{celestial_id}.json")
    quiz_path = os.path.join(DATA_DIR, "quizzes", f"{celestial_id}.json")

    with open(planet_path, "w", encoding="utf-8") as f:
        json.dump(info, f, ensure_ascii=False, indent=2)

    with open(quiz_path, "w", encoding="utf-8") as f:
        json.dump({"questions": questions}, f, ensure_ascii=False, indent=2)

    print(f"✓ {planet_path}")
    print(f"✓ {quiz_path}")
    print("完成！")


if __name__ == "__main__":
    main()
