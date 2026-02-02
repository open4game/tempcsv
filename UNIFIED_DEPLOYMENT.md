# 统一部署：Next.js + Hono 在同一个 Cloudflare Worker

## 架构说明

### 当前架构（Vue 版本）
```
Cloudflare Worker (csv-manager)
├── Hono API (/api/*)
└── Vue 静态文件 (frontend/dist)
    └── 通过 assets 绑定服务
```

### 新架构（Next.js 版本）
```
Cloudflare Worker (csv-manager)
├── Hono API (/api/*)
└── Next.js 静态文件 (nextjs-app/out)
    └── 通过 assets 绑定服务
```

## 工作原理

### Cloudflare Workers Assets

Cloudflare Workers 的 `assets` 功能允许你在 Worker 中服务静态文件：

```jsonc
{
  "assets": {
    "directory": "../nextjs-app/out",  // 静态文件目录
    "binding": "ASSETS"                 // 绑定名称
  }
}
```

### 路由优先级

Worker 会按以下顺序处理请求：

1. **API 路由** (`/api/*`) → Hono 处理
2. **文件路由** (`/files/*`) → Hono 处理（从 R2 获取）
3. **其他路由** (`/*`) → 静态文件（Next.js）

### 后端代码中的静态文件服务

查看 `backend/src/index.ts`，应该有类似的代码：

```typescript
// 在开发环境中服务静态文件
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  app.use('/*', serveStatic({ root: './public/static' }))
}

// 在生产环境中，Cloudflare Workers 会自动通过 assets 绑定服务静态文件
```

## 已完成的配置更改

### 1. wrangler.jsonc 更新

**之前:**
```jsonc
"assets": {
  "directory": "../frontend/dist",
  "binding": "ASSETS"
}
```

**现在:**
```jsonc
"assets": {
  "directory": "../nextjs-app/out",
  "binding": "ASSETS"
}
```

### 2. 文件大小限制更新

**之前:** `MAX_FILE_SIZE: 102400` (100KB)
**现在:** `MAX_FILE_SIZE: 10485760` (10MB)

## 部署流程

### 完整部署步骤

#### 1. 构建 Next.js 前端
```bash
cd nextjs-app
npm install
npm run build
```

这会生成 `nextjs-app/out/` 目录，包含所有静态文件。

#### 2. 部署到 Cloudflare Workers
```bash
cd backend
npm run deploy
```

Wrangler 会：
1. 打包 Hono 后端代码
2. 上传 `nextjs-app/out/` 中的静态文件
3. 部署到 Cloudflare Workers
4. 配置 R2 bucket 绑定

#### 3. 使用自动化脚本

或者使用我创建的自动化脚本：

```bash
chmod +x deploy.sh
./deploy.sh
```

## 路由配置

### API 路由
```typescript
app.post('/api/upload', ...)      // 文件上传
app.post('/api/update/:folder/:fileName', ...)  // 文件更新
app.get('/files/:folder/:fileName', ...)  // 文件下载
app.get('/debug', ...)            // 调试端点
```

### 静态文件路由
```
/                 → nextjs-app/out/index.html
/about            → nextjs-app/out/about/index.html
/viewer           → nextjs-app/out/viewer/index.html
/_next/static/*   → Next.js 静态资源
```

### 路由优先级

Hono 的路由会优先匹配，如果没有匹配的路由，Workers 会自动从 assets 中查找静态文件。

## 验证部署

### 本地测试

在部署前，可以本地测试完整的 Worker：

```bash
cd backend
npm run dev
```

这会启动本地 Worker，服务：
- API: `http://localhost:3000/api/*`
- 静态文件: `http://localhost:3000/*`

### 部署后测试

```bash
# 查看实时日志
cd backend
npx wrangler tail

# 测试 API
curl https://your-worker.workers.dev/api/debug

# 测试前端
open https://your-worker.workers.dev
```

## 环境变量配置

### 生产环境

在 `backend/wrangler.jsonc` 中已配置：
```jsonc
"vars": {
  "FRONT_HOST": "https://tempcsv.com",
  "API_HOST": "https://tempcsv.com",
  "DOWNLOAD_HOST": "https://my.tempcsv.com",
  "FILE_FOLDER": "f",
  "MAX_FILE_SIZE": 10485760
}
```

### 开发环境

在 `backend/.env` 中配置：
```env
FRONT_HOST=http://localhost:3001
API_HOST=http://localhost:3000
DOWNLOAD_HOST=http://localhost:3000
FILE_FOLDER=temp
MAX_FILE_SIZE=10485760
```

## 部署前检查清单

- [x] Next.js 配置为静态导出模式
- [x] wrangler.jsonc 指向正确的输出目录
- [x] 文件大小限制已更新
- [x] 本地构建测试通过
- [ ] 构建 Next.js 前端
- [ ] 部署到 Cloudflare Workers
- [ ] 测试 API 功能
- [ ] 测试前端页面
- [ ] 配置自定义域名

## 部署命令

### 快速部署
```bash
./deploy.sh
```

### 手动部署
```bash
# 1. 构建前端
cd nextjs-app
npm run build

# 2. 部署 Worker
cd ../backend
npm run deploy
```

### 预览部署
```bash
cd backend
npx wrangler deploy --dry-run
```

## 自定义域名配置

### 方式 1: Workers 路由

在 Cloudflare Dashboard 中：
1. **Workers & Pages** → **Your Worker**
2. **Settings** → **Triggers** → **Routes**
3. 添加路由：
   - `tempcsv.com/*`
   - `my.tempcsv.com/*`

### 方式 2: wrangler.jsonc

```jsonc
{
  "routes": [
    {
      "pattern": "tempcsv.com/*",
      "zone_name": "tempcsv.com"
    }
  ]
}
```

## 文件结构对比

### 部署前
```
tempcsv/
├── backend/
│   ├── src/index.ts
│   └── wrangler.jsonc
├── nextjs-app/
│   ├── src/
│   └── package.json
└── frontend/ (旧的 Vue 项目)
```

### 部署时
```
Cloudflare Worker
├── Worker 代码 (Hono API)
└── Assets (Next.js 静态文件)
    ├── index.html
    ├── about/index.html
    ├── viewer/index.html
    └── _next/static/*
```

## 优势

### 统一部署的好处

1. **单一端点**
   - 前后端在同一个域名下
   - 无需配置 CORS（同源）
   - 简化部署流程

2. **成本优化**
   - 只需一个 Worker
   - 共享免费额度
   - 减少管理开销

3. **性能优化**
   - 减少 DNS 查询
   - 减少 TLS 握手
   - 更快的响应时间

4. **简化配置**
   - 统一的环境变量
   - 统一的域名配置
   - 统一的监控和日志

## 注意事项

### 1. 构建顺序

必须先构建前端，再部署后端：
```bash
cd nextjs-app && npm run build  # 先构建
cd ../backend && npm run deploy  # 再部署
```

### 2. 文件大小限制

Cloudflare Workers 有大小限制：
- 免费版: 1MB (压缩后)
- 付费版: 10MB (压缩后)

Next.js 静态导出通常在限制内，但要注意：
- 优化图片大小
- 移除未使用的依赖
- 启用压缩

### 3. 路由冲突

确保 API 路由不与静态文件路由冲突：
- API: `/api/*`, `/files/*`
- 静态: `/`, `/about`, `/viewer`, `/_next/*`

### 4. 环境变量

前端环境变量在构建时注入，后端环境变量在运行时读取：
- 前端: `NEXT_PUBLIC_*` 变量在构建时替换
- 后端: `vars` 在运行时可用

## 回滚策略

### 回滚到之前的版本

```bash
# 查看部署历史
cd backend
npx wrangler deployments list

# 回滚到特定版本
npx wrangler rollback [deployment-id]
```

### 回滚到 Vue 版本

如果需要回滚到 Vue 版本：

1. 更新 `wrangler.jsonc`:
   ```jsonc
   "assets": {
     "directory": "../frontend/dist",
     "binding": "ASSETS"
   }
   ```

2. 构建 Vue 前端:
   ```bash
   cd frontend
   npm run build
   ```

3. 重新部署:
   ```bash
   cd backend
   npm run deploy
   ```

## 监控和调试

### 实时日志
```bash
cd backend
npx wrangler tail
```

### 查看部署信息
```bash
npx wrangler deployments list
```

### 查看 Worker 详情
```bash
npx wrangler whoami
npx wrangler status
```

## 性能优化

### 1. 启用压缩

Workers 自动启用 Brotli 和 Gzip 压缩。

### 2. 缓存策略

静态文件自动缓存在 Cloudflare CDN：
- HTML: 短期缓存
- CSS/JS: 长期缓存（带版本号）
- 图片: 长期缓存

### 3. 边缘缓存

API 响应可以配置边缘缓存：
```typescript
return new Response(data, {
  headers: {
    'Cache-Control': 'public, max-age=3600'
  }
})
```

## 成本估算

### Cloudflare Workers 免费额度
- 100,000 请求/天
- 10ms CPU 时间/请求

### 超出免费额度
- $5/月 起
- 1000 万请求/月
- 50ms CPU 时间/请求

### R2 存储
- 10GB 免费存储
- 免费的 Class A 操作（写入）
- 免费的 Class B 操作（读取）

## 故障排查

### 问题 1: 静态文件 404

**原因:** assets 目录路径不正确

**解决:**
```bash
# 检查输出目录是否存在
ls -la nextjs-app/out/

# 确保 wrangler.jsonc 路径正确
cat backend/wrangler.jsonc | grep assets
```

### 问题 2: API 404

**原因:** 路由配置问题

**解决:** 检查 `backend/src/index.ts` 中的路由定义

### 问题 3: CORS 错误

**原因:** 生产域名未添加到 CORS 配置

**解决:** 更新 `backend/src/index.ts`:
```typescript
app.use('*', cors({
  origin: [
    'https://tempcsv.com',
    'https://your-worker.workers.dev'
  ],
  // ...
}))
```

## 下一步

1. **给脚本添加执行权限**
   ```bash
   chmod +x deploy.sh
   ```

2. **测试本地构建**
   ```bash
   cd nextjs-app && npm run build
   ```

3. **部署到 Cloudflare**
   ```bash
   ./deploy.sh
   ```

4. **配置域名**
   - 在 Cloudflare Dashboard 配置自定义域名

5. **测试生产环境**
   - 上传文件
   - 查看文件
   - 分享链接

## 参考文档

- [Cloudflare Workers Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Wrangler Configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
