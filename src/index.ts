
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { marked } from "marked";

export interface Env {
  API_KEY: string;
}

// Global variable to reuse the model instance across requests in the same isolate
let cachedModel: GenerativeModel | null = null;

const CSS_STYLE = `
<style>
  :root {
    --bg-color: #DCDAD7; /* 背景改为浅米色 */
    --card-bg: #f3f1ed;
    --text-primary: #42403c;
    --text-secondary: #86868b;
    --accent-color: #D85E4B; /* Reeder红 */
  }

  /* --- 翔鹤黑体字重偏移映射 --- */

  @font-face {
    font-family: 'XiangHe-Pro-Custom';
    /* 400 (Regular) 映射到 Book*/
    src: local('MXiangHeHeiSCPro-Book'), local('M XiangHe Hei SC Pro Book'), local('M 翔鹤黑体 SC Pro Book');
    font-weight: 400;
  }

  @font-face {
    font-family: 'XiangHe-Pro-Custom';
    src: local('MXiangHeHeiSCPro-Regular'), local('M XiangHe Hei SC Pro Regular'), local('M 翔鹤黑体 SC Pro Regular');
    font-weight: 500;
  }
    
  @font-face {
    font-family: 'XiangHe-Pro-Custom';
    src: local('MXiangHeHeiSCPro-Medium'), local('M XiangHe Hei SC Pro Medium'), local('M 翔鹤黑体 SC Pro Medium');
    font-weight: 600;
  }
    
  @font-face {
    font-family: 'XiangHe-Pro-Custom';
    src: local('MXiangHeHeiSCPro-Bold'), local('M XiangHe Hei SC Pro Bold'), local('M 翔鹤黑体 SC Pro Bold');
    font-weight: 700;
  }
    
  @font-face {
    font-family: 'XiangHe-Pro-Custom';
    src: local('MXiangHeHeiSCPro-Heavy'), local('M XiangHe Hei SC Pro Heavy'), local('M 翔鹤黑体 SC Pro Heavy');
    font-weight: 800;
  }

    /* --- 筑紫明朝字重偏移映射 --- */

  @font-face {
    font-family: 'FZFWZhuZiMincho-Custom';
    /* 400 (Regular) 映射到 Book*/
    src: local('FZFW-ZhuZiMinchoS-M--GB1-0'), local('FZFW ZhuZi MinchoS_M');
    font-weight: 400;
  }

  @font-face {
    font-family: 'FZFWZhuZiMincho-Custom';
    src: local('FZFW-ZhuZiMinchoS-RB--GB1-0'), local('FZFW ZhuZi MinchoS_RB');
    font-weight: 500;
  }
    
  @font-face {
    font-family: 'FZFWZhuZiMincho-Custom';
    src: local('FZFW-ZhuZiMinchoS-D--GB1-0'), local('FZFW ZhuZi MinchoS_D');
    font-weight: 600;
  }
    
  @font-face {
    font-family: 'FZFWZhuZiMincho-Custom';
    src: local('FZFW-ZhuZiMinchoS-B--GB1-0'), local('FZFW ZhuZi MinchoS_B');
    font-weight: 700;
  }
    
  @font-face {
    font-family: 'FZFWZhuZiMincho-Custom';
    src: local('FZFW-ZhuZiMinchoS-E--GB1-0'), local('FZFW ZhuZi MinchoS_E');
    font-weight: 800;
  }
    
  @font-face {
    font-family: 'FZFWZhuZiMincho-Custom';
    src: local('FZFW-ZhuZiMinchoS-H--GB1-0'), local('FZFW ZhuZi MinchoS_H');
    font-weight: 900;
  }

  /* --- 字体栈应用 --- */
  :root {
    --font-sans:
      "Google Sans Flex",
      "XiangHe-Pro-Custom",
      "-apple-system",
      BlinkMacSystemFont,
      "Noto Sans SC",
      sans-serif;
    --font-serif:
      "Lyon Text Trial",
      "FZFWZhuZiMincho-Custom",
      "FZPingXianYaSongS-R-GB",
      "FZPINGXYSFW--GB1-0",
      "HYXuanSong",
      "Noto Serif SC",
      "Source Han Serif SC",
      serif;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg-color: #1E1E1E;
      --card-bg: #1c1c1e;
      --text-primary: #DDDDDD;
      --text-secondary: #65635E;
      --accent-color: #D85E4B;
    }
    
    body {
      -webkit-font-smoothing: antialiased; /* 深色模式下开启灰度抗锯齿，防止文字变粗发光 */
    }
  }

  body {
    font-family: var(--font-serif);
    background-color: var(--bg-color);
    color: var(--text-primary);
    font-size: 18px;
    line-height: 1.5;
    margin: 0;
    padding: 20px;
    -webkit-font-smoothing: auto; /* 浅色模式下依赖 macOS 默认次像素渲染，增加宋体扎实感 */
    letter-spacing: 0.015em; 
  }

  /* 核心容器：限制宽度，居中，做成卡片效果 */
  .container {
    max-width: 900px; /* 限制阅读宽度，像一篇文章 */
    margin: 0 auto;
    background-color: var(--card-bg);
    padding: 40px;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  }

  /* 标题样式 */
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-sans);
  }

  h3 {
    color: var(--text-primary);
    font-size: 1.5em;
    margin-top: 1.5em;
    margin-bottom: 0.8em;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(127, 127, 127, 0.1);
    font-weight: 800;
    letter-spacing: -0.01em;
  }

  /* 针对没有正确解析成 H3 但使用了加粗的兜底样式 */
  p > strong {
    font-family: var(--font-sans);
    color: var(--text-primary);
    font-weight: 800;
  }

  /* 段落间距 */
  p {
    margin-bottom: 1.2em;
    text-align: left; /* 左对齐，提升可读性 */
  }

  /* 列表样式 */
  ul, ol {
    padding-left: 20px;
    margin-bottom: 1.5em;
  }

  li {
    margin-bottom: 0.8em; /* 列表项之间拉开距离 */
    padding-left: 5px;
  }

  /* 重点强调样式 */
  strong {
    font-weight: 700;
  }
  
  /* 待办事项 */
  li:has(input[type="checkbox"]) {
    list-style: none;
    margin-left: -15px;
    color: var(--text-primary);
    font-weight: 500;
  }
</style>
`;

async function sha256(message: string) {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message);
  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // convert bytes to hex string
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

function getModel(apiKey: string): GenerativeModel {
  if (!cachedModel) {
    const genAI = new GoogleGenerativeAI(apiKey);
    cachedModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" }, { apiVersion: "v1beta" });
  }
  return cachedModel;
}

async function summarizeContent(apiKey: string, userInput: string): Promise<string> {
  const model = getModel(apiKey);

  const prompt = `
    请作为一名高效的私人助理，总结以下邮件内容。
    注意：输入可能包含多封邮件（由分隔符分隔）。
    
    如果是多封邮件，请：
    1. 综合概述这些邮件的共同主题。
    2. 分别列出每封邮件的关键信息（如果它们讨论的是不同事项）。
    3. 如果是同一个话题，则通过时间线将其串起来。

    要求：
    1. 语言：中文。
        - 遇到非中文需翻译，翻译时必须完全消除“翻译腔”，采用地道的、有温度的中文表达。
        - 识别邮件中的所有双关语、隐喻或技术梗，并将其转化为中文语境下同等力度的表达。
    2. 格式：
       - **核心萃取**：用极具洞察力的一句话总结。
       - **逻辑演进线（时间轴）**：不要只列要点，要梳理出事件背后的逻辑、发展脉络或时间线。
       - **投资建议**：如果有财经新闻，则需要析出投资风险和机会，给出相应的建议，但是要注意很多大利好在上新闻后已经不适合入局了，反而是利空后值得研究，因此最有价值的其实是大盘和行业的机会。如果没有财经新闻和任何相关的消息，则不显示此项。
       - **待办事项**：如果有需要我处理的事项，请用 "- [ ]" 标记并单独列出；如果没有，则不显示此项。
    3. 风格：客观、极简。

    邮件正文：
    ${userInput}
    `;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 1.0,
      },
    });

    const response = await result.response;
    const mdText = response.text();

    // Use marked for conversion
    const htmlContent = marked.parse(mdText) as string;

    const finalHtml = `
        <!DOCTYPE html>
        <html lang="zh">
        <head>
            <meta charset='utf-8'>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            ${CSS_STYLE}
        </head>
        <body>
            <div class="container">
                ${htmlContent}
            </div>
        </body>
        </html>
        `;

    return finalHtml;

  } catch (e: any) {
    // If error occurs, we might want to throw it so we don't cache the error page indefinitely if we were caching inside this function
    // But here we return HTML string.
    throw new Error(e.message || e);
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed. Please send a POST request with the email content.", { status: 405 });
    }

    if (!env.API_KEY) {
      return new Response("API_KEY is not set in worker environment variables.", { status: 500 });
    }

    try {
      let userInput = "";
      const contentType = request.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        try {
          const body = await request.json() as any;
          userInput = body.content || body.text || body.email || "";
        } catch (e) {
          return new Response("Invalid JSON body", { status: 400 });
        }
      } else {
        userInput = await request.text();
      }

      if (!userInput || userInput.trim().length === 0) {
        return new Response("<html><body><p>没有接收到邮件内容。</p></body></html>", {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      // --- Cache Implementation ---
      const cache = caches.default;
      const inputHash = await sha256(userInput);
      // Construct a cache key based on the request URL and the hash of the content.
      // Since the POST body isn't part of the Cache Key by default, we simulate distinct resources via the URL.
      const cacheUrl = new URL(request.url);

      // Critical: Remove any existing query parameters supplied by the client.
      // This prevents cache busting from random parameters (e.g., timestamps, tracking IDs)
      // and ensures the cache key relies ONLY on the content hash.
      cacheUrl.search = '';

      cacheUrl.searchParams.set("content_hash", inputHash);

      // Use a fresh GET request for the cache key to avoid issues with the original request body being consumed.
      // We use the URL with the hash as the unique key.
      const cacheKey = new Request(cacheUrl.toString());

      // Check for cache hit
      let response = await cache.match(cacheKey);

      if (response) {
        // Determine if we need to recreate the response to add headers (responses from cache are immutable usually)
        // But returning it directly is fine. Let's add a header to indicate hit for debugging.
        const newHeaders = new Headers(response.headers);
        newHeaders.set("X-Worker-Cache", "HIT");
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });
      }

      // Cache miss - Generate content
      const html = await summarizeContent(env.API_KEY, userInput);

      response = new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=86400", // Cache for 24 hours
          "X-Worker-Cache": "MISS"
        },
      });

      // Put into cache (waits until execution context is done)
      ctx.waitUntil(cache.put(cacheKey, response.clone()));

      return response;

    } catch (e: any) {
      return new Response(`<html><body><h3>系统错误</h3><pre>${e.message || e}</pre></body></html>`, {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
  },
};
