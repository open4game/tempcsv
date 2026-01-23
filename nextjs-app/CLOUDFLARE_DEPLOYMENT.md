# Cloudflare Pages 部署指南

## 部署准备检查

### ✅ 已完成
- [x] Next.js 项目结构完整
- [x] TypeScript 配置正确
- [x] 环境变量配置
- [x] API 客户端实现
- [x] 响应式设计

### ⚠️ 需要配置
- [ ] 添加 `@cloudflare/next-on-pages` 适配器
- [ ] 配置构建命令
- [ ] 设置环境变量
- [ ] 配置输出模式

## Cloudflare Pages 特殊要求

### 1. Next.js 适配

Cloudflare Pages 使用 Workers 运行时，需要特殊适配。有两个选择：

#### 选项 A: 使用 @cloudflare/next-on-pages (推荐)

这个适配器可以让 Next.js 在 Cloudflare Pages 上运行。

**安装:**
```bash
cd nextjs-app
npm install --save-dev @cloudflare/next-on-pages
```

**更新 package.json:**
```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "pages:build": "npx @cloudflare/next-on-pages",
    "preview": "npx wrangler pages dev .vercel/output/static",
    "deploy": "npm run pages:build && npx wrangler pages deploy .vercel/output/static"
  }
}
```

**更新 next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // 静态导出模式
  images: {
    unoptimized: true, // Cloudflare Pages 不支持 Next.js Image Optimization
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://tempcsv.com/api',
    NEXT_PUBLIC_DOWNLOAD_HOST: process.env.NEXT_PUBLIC_DOWNLOAD_HOST || 'https://my.tempcsv.com',
  },
}

module.exports = nextConfig
```

#### 选项 B: 静态导出 (更简单，推荐用于当前项目)

由于我们的项目是纯客户端应用，可以使用静态导出。

**优势:**
- 更简单，无需额外依赖
- 更快的构建和部署
- 完全兼容 Cloudflare Pages
- 适合我们的用例（纯客户端 + API）

**配置:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // 静态导出
  images: {
    unoptimized: true,
  },
  trailingSlash: true, // 确保路由正常工作
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://tempcsv.com/api',
    NEXT_PUBLIC_DOWNLOAD_HOST: process.env.NEXT_PUBLIC_DOWNLOAD_HOST || 'https://my.tempcsv.com',
  },
}

module.exports = nextConfig
```

## 推荐方案：静态导出

由于我们的应用特点：
- ✅ 纯客户端渲染
- ✅ 所有 API 调用都是客户端发起
- ✅ 没有服务端渲染需求
- ✅ 没有 API Routes

**最适合使用静态导出模式！**

### 部署步骤

#### 1. 更新配置文件

创建 `nextjs-app/next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_DOWNLOAD_HOST: process.env.NEXT_PUBLIC_DOWNLOAD_HOST,
  },
}

module.exports = nextConfig
```

#### 2. 测试构建

```bash
cd nextjs-app
npm run build
```

这会在 `out/` 目录生成静态文件。

#### 3. 在 Cloudflare Pages 创建项目

**方式 A: 通过 Dashboard**

1. 登录 Cloudflare Dashboard
2. 进入 Pages
3. 点击 "Create a project"
4. 连接 GitHub 仓库
5. 配置构建设置：
   - **Framework preset**: Next.js (Static HTML Export)
   - **Build command**: `cd nextjs-app && npm install && npm run build`
   - **Build output directory**: `nextjs-app/out`
   - **Root directory**: `/`

**方式 B: 通过 Wrangler CLI**

```bash
cd nextjs-app
npm run build
npx wrangler pages deploy out --project-name=tempcsv
```

#### 4. 配置环境变量

在 Cloudflare Pages 项目设置中添加：

**生产环境:**
```
NEXT_PUBLIC_API_URL=https://tempcsv.com/api
NEXT_PUBLIC_DOWNLOAD_HOST=https://my.tempcsv.com
```

**预览环境:**
```
NEXT_PUBLIC_API_URL=https://tempcsv-staging.com/api
NEXT_PUBLIC_DOWNLOAD_HOST=https://my-staging.tempcsv.com
```

#### 5. 配置自定义域名

在 Cloudflare Pages 项目设置中：
1. 进入 "Custom domains"
2. 添加你的域名（如 `tempcsv.com`）
3. Cloudflare 会自动配置 DNS

## 构建输出检查

构建成功后，检查 `out/` 目录：

```bash
ls -la nextjs-app/out/
```

应该包含：
- `index.html` - 主页
- `viewer.html` - 查看器页面
- `about.html` - 关于页面
- `_next/` - Next.js 资源
- `*.css`, `*.js` - 静态资源

## 路由配置

Cloudflare Pages 会自动处理路由：
- `/` → `index.html`
- `/viewer` → `viewer.html`
- `/about` → `about.html`

如果需要自定义路由，创建 `_routes.json`:

```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": []
}
```

## 性能优化

### 1. 启用 Cloudflare 优化

在 Cloudflare Pages 设置中启用：
- ✅ Auto Minify (HTML, CSS, JS)
- ✅ Brotli compression
- ✅ HTTP/3
- ✅ 0-RTT Connection Resumption

### 2. 配置缓存

创建 `_headers` 文件：

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable
```

## 部署检查清单

- [ ] 更新 `next.config.js` 添加 `output: 'export'`
- [ ] 本地测试构建 `npm run build`
- [ ] 检查 `out/` 目录内容
- [ ] 在 Cloudflare Pages 创建项目
- [ ] 配置构建命令和输出目录
- [ ] 设置环境变量
- [ ] 配置自定义域名
- [ ] 测试部署的应用
- [ ] 验证 API 连接正常
- [ ] 测试文件上传功能
- [ ] 测试移动端响应式

## 常见问题

### Q: 构建失败，提示 "Error: Page ... is missing exported function"

**A:** 确保所有页面都是客户端组件（使用 `'use client'`）或者是静态页面。

### Q: 部署后页面空白

**A:** 检查浏览器控制台，可能是环境变量未设置或 API URL 错误。

### Q: 路由 404

**A:** 确保 `trailingSlash: true` 在 `next.config.js` 中设置。

### Q: 图片不显示

**A:** 确保 `images.unoptimized: true` 已设置。

## 回滚策略

Cloudflare Pages 保留所有部署历史：
1. 进入项目的 "Deployments" 页面
2. 找到之前的成功部署
3. 点击 "Rollback to this deployment"

## 监控和日志

- **实时日志**: Cloudflare Pages Dashboard
- **分析**: Cloudflare Web Analytics
- **错误追踪**: 可集成 Sentry

## 下一步

1. 更新 `next.config.js`
2. 测试本地构建
3. 部署到 Cloudflare Pages
4. 配置域名和环境变量
5. 测试生产环境

## 参考资料

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Next.js Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Deploy Next.js to Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
