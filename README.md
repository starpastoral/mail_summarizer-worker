# Mail Summarizer Worker

这是一个运行在 Cloudflare Workers 上的邮件智能总结服务。它利用 Google Gemini (Gemini 3 Flash Preview) 模型，将输入的邮件内容（单封或多封）转化为清晰、有条理且排版精美的 HTML 摘要。

## ✨ 功能特性

- **🤖 智能总结**：调用 Google Gemini 3 模型，深入理解邮件内容。
- **📝 多维度分析**：
  - **核心萃取**：一句话总结核心要点。
  - **逻辑演进**：如果是多封邮件，按时间线或逻辑脉络梳理。
  - **待办提取**：自动识别需要处理的事项并列出 checklist。
  - **财经洞察**：识别财经相关内容并给出投资风险提示（如有）。
- **🎨 精美排版**：
  - 内置精心设计的 CSS 样式。
  - 支持 **深色模式 (Dark Mode)** 和浅色模式自适应。
  - 字体和配色致敬 Reeder 阅读器风格，提供极致阅读体验。
- **⚡️ 高效缓存**：
  - 基于邮件内容的 SHA-256 哈希值进行缓存。
  - 相同内容的请求在 24 小时内直接命中缓存 (`X-Worker-Cache: HIT`)，无需重复调用 AI 接口，大幅提升速度并节省 Token。

## 🛠️ 技术栈

- [Cloudflare Workers](https://workers.cloudflare.com/) - Serverless 运行环境
- [Google Gemini API](https://ai.google.dev/) - AI 生成模型
- [TypeScript](https://www.typescriptlang.org/) - 开发语言
- [Marked](https://github.com/markedjs/marked) - Markdown 转 HTML
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) - CLI 工具

## 🚀 快速开始

### 1. 前置要求

- Node.js 环境
- Cloudflare 账号
- Google AI Studio 的 API Key

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

你需要设置 `API_KEY` 环境变量。

**本地开发：**

创建 `.dev.vars` 文件（如果不存在）：

```ini
API_KEY=your_google_gemini_api_key
```

**生产部署：**

使用 wrangler 设置 secret：

```bash
npx wrangler secret put API_KEY
```

### 4. 本地运行

启动本地开发服务器：

```bash
npm run dev
# 或者
npx wrangler dev
```

### 5. 部署

部署到 Cloudflare Workers：

```bash
npm run deploy
# 或者
npx wrangler deploy
```

## 🔌 API 使用说明

**Endpoint**: `POST /`

**Body**:
支持两种格式：

1. **Raw Text (推荐)**: 直接发送邮件正文内容。
2. **JSON**:
   ```json
   {
     "content": "邮件内容..."
   }
   ```

**Response**:
返回渲染好的 HTML 页面。

**示例 (cURL)**:

```bash
curl -X POST http://localhost:8787 \
  -H "Content-Type: text/plain" \
  -d "这是邮件内容..."
```

## 📂 项目结构

- `src/index.ts`: 核心逻辑代码，包含 Worker 处理流程、AI 调用和 HTML 渲染。
- `wrangler.toml`: Cloudflare Workers 配置文件。

## 📝 缓存策略

系统会对 POST 请求的内容计算 SHA-256 哈希。如果相同的邮件内容在 24 小时内再次被请求，Worker 将直接返回缓存的 HTML 结果，并在响应头中包含 `X-Worker-Cache: HIT`。
