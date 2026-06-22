# 第五阶段：添加时间、位置、天气

## 目标
让 AI 能够获取实时信息

## 功能
- `get_current_time` - 获取当前时间
- `get_location` - 获取位置信息（城市）
- `get_weather` - 获取天气信息

## 使用场景
```
用户：今天天气怎么样？
Agent：[调用 get_location] → [调用 get_weather] → 北京今天晴天，28°C
```
