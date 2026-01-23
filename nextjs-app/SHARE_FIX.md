# 分享链接问题修复

## 问题描述

分享链接时，URL 中包含了额外的文本，导致浏览器打开失败：

```
http://localhost:3001/viewer?file=http%3A%2F%2Flocalhost%3A3000%2Ffiles%2F20260121%2Fdfe77465-e12d-4b12-9582-dee4282d9c50.csv%20Check%20out%20this%20CSV%20file
```

注意末尾的 `%20Check%20out%20this%20CSV%20file` 被错误地附加到了 URL 中。

## 问题原因

在使用 Web Share API 时，`navigator.share()` 的 `text` 参数在某些浏览器中会被附加到 URL 参数中，导致 URL 格式错误。

**原始代码：**
```typescript
await navigator.share({
  title: 'View CSV File',
  text: 'Check out this CSV file',  // ❌ 这个会被附加到 URL
  url: shareUrl,
});
```

## 解决方案

移除 `text` 参数，只保留 `title` 和 `url`：

```typescript
await navigator.share({
  title: 'View CSV File',
  url: shareUrl,  // ✅ 只分享 URL
});
```

同时改进错误处理，区分用户取消和真正的错误：

```typescript
try {
  await navigator.share({
    title: 'View CSV File',
    url: shareUrl,
  });
  setShareSuccess(true);
  setTimeout(() => setShareSuccess(false), 2000);
} catch (err) {
  // 用户取消分享不需要复制到剪贴板
  if ((err as Error).name !== 'AbortError') {
    await copyShareUrlToClipboard(shareUrl);
  }
}
```

## 修改的文件

1. **nextjs-app/src/components/csv-uploader.tsx**
   - 移除 `text` 参数
   - 改进错误处理
   - 添加分享成功提示

2. **nextjs-app/src/app/page.tsx**
   - 移除 `text` 参数
   - 改进错误处理

## 测试步骤

1. 上传一个 CSV 文件
2. 点击"Share This File"按钮
3. 如果浏览器支持 Web Share API：
   - 会弹出系统分享对话框
   - 选择分享方式（如复制链接、发送到应用等）
4. 如果浏览器不支持 Web Share API：
   - 自动复制链接到剪贴板
   - 显示"Link Copied!"提示

## 预期结果

分享的 URL 应该是干净的，不包含额外文本：

```
http://localhost:3001/viewer?file=http%3A%2F%2Flocalhost%3A3000%2Ffiles%2F20260121%2Fdfe77465-e12d-4b12-9582-dee4282d9c50.csv
```

## Web Share API 最佳实践

根据 [Web Share API 规范](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)：

- `title`: 分享的标题
- `text`: 分享的文本内容（可选）
- `url`: 分享的 URL（可选）

**注意事项：**
- 不同浏览器对 `text` 和 `url` 的处理方式不同
- 某些浏览器会将 `text` 附加到 `url` 后面
- 如果只想分享 URL，建议只使用 `url` 参数
- 如果需要分享文本和 URL，应该在 `text` 中包含 URL

**推荐做法：**
```typescript
// ✅ 只分享 URL
await navigator.share({
  title: 'View CSV File',
  url: shareUrl,
});

// ✅ 分享文本和 URL（文本中包含 URL）
await navigator.share({
  title: 'View CSV File',
  text: `Check out this CSV file: ${shareUrl}`,
});

// ❌ 避免同时使用独立的 text 和 url
await navigator.share({
  title: 'View CSV File',
  text: 'Check out this CSV file',
  url: shareUrl,
});
```

## 相关问题

如果遇到类似问题，检查：
1. URL 编码是否正确
2. Web Share API 参数使用是否合理
3. 不同浏览器的兼容性
4. 错误处理是否完善

## 状态

✅ 已修复
✅ 已测试
✅ 文档已更新
