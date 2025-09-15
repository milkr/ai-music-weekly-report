# AI Music Weekly Report

自动化生成和发布AI音乐周报的GitHub Actions项目

## 🚀 功能特性

- 📅 每周一自动生成AI音乐行业周报
- 🤖 支持手动触发报告生成
- 📊 集成Notion数据库存储
- 🔄 自动化GitHub Actions工作流

## ⏰ 运行时间

- **自动运行**: 每周一上午9:00 (北京时间) / 01:00 (UTC时间)
- **手动触发**: 在GitHub Actions页面点击"Run workflow"

## 🛠️ 设置说明

### 1. GitHub Secrets配置

在GitHub仓库的Settings → Secrets and variables → Actions中添加以下Secrets：

- `COMPOSIO_API_KEY`: Composio API密钥（可选）
- `NOTION_DATABASE_ID`: Notion数据库ID（可选）

### 2. 本地测试

```bash
# 安装依赖
npm install

# 运行脚本
npm start
```

## 📝 故障排查

### 为什么周一没有自动运行？

1. **时间已过**: 如果当前UTC时间已超过01:00，则需等待下周一
2. **GitHub Secrets**: 检查是否正确配置了所需的Secrets
3. **工作流状态**: 在Actions页面查看工作流运行历史

### 手动触发运行

1. 进入GitHub仓库的Actions页面
2. 选择"Weekly AI Music Report"工作流
3. 点击"Run workflow"按钮
4. 选择分支并点击绿色的"Run workflow"按钮

## 📊 输出格式

脚本会生成包含以下内容的周报：
- 报告标题和日期
- 本周AI音乐动态总结
- 热门AI生成歌曲
- 技术更新和行业动态

## 🔧 自定义配置

可以在 `scripts/generateWeeklyReport.js` 中修改：
- 报告内容模板
- 数据源配置
- 输出格式