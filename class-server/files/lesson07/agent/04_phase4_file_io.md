# 第四阶段：添加文件读写功能

## 目标
让 AI 能够读写文件

## 功能
- `read_file` - 读取文件内容
- `list_files` - 列出文件目录
- `write_file` - 写入文件内容
- `delete_file` - 删除文件

## 使用场景
- 让 AI 浏览文件目录（先 list 后操作）
- 让 AI 生成代码并保存
- 让 AI 读取并修改现有文件
- 让 AI 删除不需要的文件

## 示例
```
用户：帮我创建一个 index.html 文件
Agent：[调用 write_file] 文件已创建

用户：删除之前的旧照片
Agent：[调用 list_files] → [调用 delete_file] 文件已删除
```

## 附加功能：语音输入
- 支持语音输入（麦克风按钮）
- 使用浏览器 Web Speech API
- 语音识别结果实时填入输入框
- 支持中文普通话连续识别
