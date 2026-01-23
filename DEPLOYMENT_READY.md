# 🚀 Cloudflare 部署就绪清单

## ✅ 准备完成

### 前端 (Next.js)
- ✅ 静态导出模式已配置 (`output: 'export'`)
- ✅ 图片优化已禁用（Cloudflare 兼容）
- ✅ 路由配置正确（trailing slash）
- ✅ 构建测试通过
- ✅ 输出目录: `nextjs-app/out/`
- ✅ TypeScript 类型检查通过

### 后端 (Hono)
- ✅ Cloudflare Workers 配置完整
- ✅ R2 存储集成
- ✅ CORS 配置正确
- ✅ 环境变量配置

## 📋 部署步骤

### 方式 1: Cloudflare Pages Dashboard (推荐)

#### 1. 推送代码到 GitHub
```bash
git push origin main
```

#### 2. 在 Cloudflare Dashboard 创建项目
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Pages**
3. 点击 **Create a project**
4. 选择 **Connect to Git**
5. 选择你的 GitHub 仓库

#### 3. 配置构建设置
```
Framework preset: Next.js (Static HTML Export)
Build command: cd nextjs-app && npm install && npm run build
Build output directory: nextjs-app/out
Root directory: (leave empty or /)
```

#### 4. 设置环境变量
在 **Settings → Environment variables** 添加：

**Production:**
```
NEXT_PUBLIC_API_URL=https://tempcsv.com/api
NEXT_PUBLIC_DOWNLOAD_HOST=https://my.tempcsv.com
```

**Preview:**
```
NEXT_PUBLIC_API_URL=https://tempcsv-staging.com/api
NEXT_PUBLIC_DOWNLOAD_HOST=https://my-staging.tempcsv.com
```

#### 5. 部署
点击 **Save and Deploy**

### 方式 2: Wrangler CLI

```bash
# 构建
cd nextjs-app
npm run build

# 部署
npx wrangler pages deploy out --project-name=tempcsv-frontend

# 或者添加到 package.json
npm run deploy
```

## 🔧 后端部署

后端已经配置好，部署命令：

```bash
cd backend
npm run deploy
```

确保 `wrangler.jsonc` 中的配置正确：
- R2 bucket 绑定
- 环境变量
- 路由配置

## 🌐 域名配置

### 前端域名
在 Cloudflare Pages 项目中：
1. **Custom domains** → **Set up a custom domain**
2. 添加域名（如 `tempcsv.com`）
3. Cloudflare 自动配置 DNS

### 后端域名
在 Cloudflare Workers 中：
1. 配置 Workers 路由
2. 或使用 `workers.dev` 子域名

## 📊 部署后验证

### 前端检查
- [ ] 访问主页正常加载
- [ ] 导航链接工作正常
- [ ] 文件选择功能正常
- [ ] 预览功能正常
- [ ] 移动端响应式正常

### 后端检查
- [ ] API 端点可访问
- [ ] CORS 配置正确
- [ ] 文件上传成功
- [ ] 文件下载成功
- [ ] R2 存储正常

### 集成测试
- [ ] 上传文件成功
- [ ] 预览显示正确
- [ ] 查看在线文件成功
- [ ] 分享链接正常
- [ ] 下载文件成功

## 🔍 监控和调试

### Cloudflare Pages 日志
```
Dashboard → Pages → Your Project → Deployments → View build log
```

### Cloudflare Workers 日志
```
Dashboard → Workers & Pages → Your Worker → Logs
```

### 实时日志
```bash
npx wrangler tail
```

## ⚙️ 环境变量说明

### 前端环境变量
| 变量 | 说明 | 示例 |
|------|------|------|
| `NEXT_PUBLIC_API_URL` | 后端 API 地址 | `https://tempcsv.com/api` |
| `NEXT_PUBLIC_DOWNLOAD_HOST` | 文件下载地址 | `https://my.tempcsv.com` |

### 后端环境变量
| 变量 | 说明 | 示例 |
|------|------|------|
| `FRONT_HOST` | 前端地址 | `https://tempcsv.com` |
| `API_HOST` | API 地址 | `https://tempcsv.com` |
| `DOWNLOAD_HOST` | 下载地址 | `https://my.tempcsv.com` |
| `FILE_FOLDER` | R2 文件夹 | `temp` |
| `MAX_FILE_SIZE` | 最大文件大小 | `10485760` (10MB) |

## 🎯 性能优化

### Cloudflare 优化
在 Pages 设置中启用：
- ✅ Auto Minify (HTML, CSS, JS)
- ✅ Brotli compression
- ✅ HTTP/3
- ✅ Early Hints

### 缓存策略
创建 `nextjs-app/public/_headers`:
```
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable
```

## 🔒 安全配置

创建 `nextjs-app/public/_headers`:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## 📈 预期性能

### Lighthouse 分数目标
- Performance: 95+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

### 加载时间
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Total Blocking Time: < 200ms

## 🐛 常见问题

### 构建失败
```bash
# 清理并重新构建
rm -rf .next out node_modules
npm install
npm run build
```

### 环境变量不生效
- 确保变量名以 `NEXT_PUBLIC_` 开头
- 重新部署以应用新的环境变量

### 路由 404
- 检查 `trailingSlash: true` 是否设置
- 检查 Cloudflare Pages 的路由配置

### API CORS 错误
- 更新后端 CORS 配置，添加生产域名
- 检查环境变量是否正确

## 📝 部署后任务

- [ ] 配置自定义域名
- [ ] 设置 SSL/TLS
- [ ] 配置 DNS
- [ ] 测试所有功能
- [ ] 监控错误日志
- [ ] 设置分析追踪
- [ ] 配置告警通知

## 🎉 部署完成

一旦部署成功，你的应用将：
- ✅ 全球 CDN 加速
- ✅ 自动 HTTPS
- ✅ 无限带宽
- ✅ 自动扩展
- ✅ 零停机部署

## 📚 相关文档

- [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md) - 详细部署指南
- [README.md](README.md) - 项目文档
- [QUICKSTART.md](QUICKSTART.md) - 快速开始
- [API_SETUP.md](API_SETUP.md) - API 配置

---

**当前状态**: ✅ 准备就绪，可以部署！

**下一步**: 推送代码到 GitHub，然后在 Cloudflare Pages 创建项目。
