# 表格字符间距问题修复

## 问题描述

表格中的文字字符之间有异常大的间距，看起来像是每个字符之间都插入了空格。

**症状:**
- 日期显示为: `2 0 2 6 - 0 1 - 1 4`
- 数字显示为: `3 3 . 3 5`
- 文本显示稀疏，难以阅读

## 问题原因

可能的原因：
1. CSS 中设置了过大的 `letter-spacing`
2. 使用了特殊的字体变体 (`font-variant-numeric`)
3. 字体特性设置 (`font-feature-settings`) 导致异常渲染
4. 等宽字体的不当使用

## 解决方案

### 1. 全局 CSS 修复

在 `globals.css` 中添加表格专用样式：

```css
/* Fix table text spacing */
table {
  letter-spacing: normal;
  font-variant-numeric: normal;
}

table th,
table td {
  letter-spacing: normal;
  font-feature-settings: normal;
}
```

### 2. 组件级修复

在 CSV viewer 组件中：

1. **添加 `font-sans` 类**
   - 确保使用系统默认的无衬线字体
   - 避免使用等宽字体

2. **内联样式强制**
   ```tsx
   style={{ letterSpacing: 'normal' }}
   ```

3. **更新所有表格单元格**
   ```tsx
   <TableCell className="... font-sans" style={{ letterSpacing: 'normal' }}>
   ```

## 修改的文件

1. **nextjs-app/src/app/globals.css**
   - 添加表格字符间距重置样式

2. **nextjs-app/src/components/csv-viewer.tsx**
   - 所有 `TableHead` 添加 `font-sans`
   - 所有 `TableCell` 添加 `font-sans`
   - 数据单元格添加 `style={{ letterSpacing: 'normal' }}`

## 字体栈说明

`font-sans` 在 Tailwind CSS 中对应的字体栈：

```css
font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
             "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans",
             sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
             "Segoe UI Symbol", "Noto Color Emoji";
```

这确保在所有平台上使用最佳的系统字体。

## CSS 属性说明

### letter-spacing
控制字符之间的间距：
- `normal`: 默认间距（推荐）
- `0`: 无额外间距
- 正值: 增加间距
- 负值: 减少间距

### font-variant-numeric
控制数字的显示方式：
- `normal`: 默认显示（推荐）
- `tabular-nums`: 等宽数字（可能导致间距问题）
- `proportional-nums`: 比例数字

### font-feature-settings
控制 OpenType 字体特性：
- `normal`: 默认设置（推荐）
- 自定义值可能导致渲染异常

## 测试步骤

1. 清除浏览器缓存
2. 刷新页面（Cmd/Ctrl + Shift + R）
3. 检查表格文字显示
4. 验证字符间距正常

## 预期效果

修复后，表格应该显示为：
- 日期: `2026-01-14` （紧凑）
- 数字: `33.35` （正常间距）
- 文本: 正常的字符间距，易于阅读

## 调试技巧

如果问题仍然存在，使用浏览器开发者工具检查：

1. **检查计算样式**
   ```
   右键单元格 → 检查 → Computed 标签
   查看 letter-spacing 的值
   ```

2. **检查字体**
   ```
   查看 font-family 是否正确
   确认没有使用 monospace 字体
   ```

3. **检查继承**
   ```
   查看是否有父元素设置了异常的 letter-spacing
   ```

## 浏览器兼容性

所有现代浏览器都支持这些 CSS 属性：
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ 移动浏览器

## 相关问题

如果遇到类似的字符间距问题：
1. 检查是否使用了自定义字体
2. 检查 CSS 中的 `letter-spacing` 设置
3. 检查字体特性设置
4. 尝试使用系统默认字体

## 参考资料

- [MDN: letter-spacing](https://developer.mozilla.org/en-US/docs/Web/CSS/letter-spacing)
- [MDN: font-variant-numeric](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric)
- [Tailwind CSS: Font Family](https://tailwindcss.com/docs/font-family)
