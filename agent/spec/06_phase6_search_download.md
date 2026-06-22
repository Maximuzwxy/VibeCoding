# 第六阶段：添加搜索和下载

## 目标
让 AI 能够搜索网络和下载资源

## 功能
- `web_search` - 网页搜索
- `news_search` - 新闻搜索（使用网页搜索作为后备）
- `download_image` - 下载图片到 files 目录

## 使用场景
```
用户：帮我搜索一下 Python 教程
Agent：[调用 web_search] → 返回搜索结果

用户：帮我下载一张故宫的图片
Agent：[调用 download_image] → 图片已保存到 files/
```
