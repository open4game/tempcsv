# 统一 CSV 查看器 - 代码重构

## 重构目标

将预览和查看功能统一使用同一个 `CsvViewer` 组件，实现代码复用和一致的用户体验。

## 架构改进

### 之前的架构
```
CsvUploader (独立的预览表格)
  ├── 自己的 Table 组件
  ├── 只显示前 5 行
  └── 独立的样式和逻辑

CsvViewer (查看在线文件)
  ├── 完整的 Table 组件
  ├── 分页功能
  └── 从 URL 加载数据
```

**问题:**
- 代码重复
- 样式不一致
- 功能不一致（预览只有 5 行）
- 维护成本高

### 现在的架构
```
CsvViewer (统一组件)
  ├── 支持本地文件 (file: File)
  ├── 支持在线文件 (fileUrl: string)
  ├── 完整的分页功能
  ├── 统一的样式
  └── 可自定义标题

CsvUploader (简化)
  ├── 文件选择
  ├── 调用 CsvViewer 预览
  └── 上传和分享逻辑
```

**优势:**
- ✅ 代码复用
- ✅ 样式一致
- ✅ 功能一致（都有分页）
- ✅ 易于维护

## CsvViewer 组件改进

### 新的 Props 接口

```typescript
interface CsvViewerProps {
  fileUrl?: string;  // 在线文件 URL
  file?: File;       // 本地文件对象
  title?: string;    // 自定义标题
}
```

### 数据加载逻辑

```typescript
if (file) {
  // 从本地文件加载
  csvText = await file.text();
} else if (fileUrl) {
  // 从 URL 加载
  csvText = await fetchCsvFile(fileUrl);
}
```

### 使用场景

**场景 1: 预览本地文件**
```tsx
<CsvViewer
  file={localFile}
  title="Preview: filename.csv"
/>
```

**场景 2: 查看在线文件**
```tsx
<CsvViewer
  fileUrl="http://localhost:3000/files/..."
  title="CSV Data"
/>
```

## CsvUploader 组件简化

### 移除的代码
- ❌ 独立的 Table 组件
- ❌ CSV 解析逻辑（移到 CsvViewer）
- ❌ 预览数据状态管理
- ❌ 只显示 5 行的限制

### 保留的功能
- ✅ 文件选择（拖拽/点击）
- ✅ 文件验证
- ✅ 上传逻辑
- ✅ 分享功能
- ✅ 成功状态展示

### 代码对比

**之前 (256 行):**
```tsx
const [previewData, setPreviewData] = useState<string[][]>([]);
const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);

// 复杂的 CSV 解析逻辑
const reader = new FileReader();
reader.onload = (e) => {
  Papa.parse(text, {
    complete: (results) => {
      // 只取前 5 行
      setPreviewData(data.slice(1, 6));
    }
  });
};

// 独立的 Table 渲染
<Table>
  <TableHeader>...</TableHeader>
  <TableBody>
    {previewData.map(...)}
  </TableBody>
</Table>
```

**现在 (简化到 ~300 行):**
```tsx
// 直接使用 CsvViewer
<CsvViewer file={file} title={`Preview: ${file.name}`} />
```

## 功能对比

| 功能 | 之前 | 现在 |
|------|------|------|
| 预览行数 | 5 行 | 全部数据 |
| 分页 | ❌ | ✅ |
| 样式 | 独立 | 统一 |
| 代码量 | 多 | 少 |
| 维护性 | 低 | 高 |

## 用户体验改进

### 1. 完整预览
- **之前**: 只能看到前 5 行
- **现在**: 可以查看所有数据，带分页

### 2. 一致的界面
- **之前**: 预览和查看界面不同
- **现在**: 完全一致的界面和交互

### 3. 更好的导航
- **之前**: 预览没有分页
- **现在**: 预览也有分页，可以浏览所有数据

## 代码结构

### 文件组织
```
src/components/
├── csv-viewer.tsx       # 统一的查看器组件
├── csv-uploader.tsx     # 简化的上传组件
└── ui/
    ├── table.tsx        # 基础表格组件
    ├── card.tsx
    └── button.tsx
```

### 组件职责

**CsvViewer**
- 负责: CSV 解析、数据展示、分页
- 输入: File 或 fileUrl
- 输出: 渲染的表格

**CsvUploader**
- 负责: 文件选择、上传、分享
- 输入: 用户选择的文件
- 输出: 上传结果

## 性能优化

### 1. 按需加载
- 只解析当前页的数据
- 分页减少 DOM 节点数量

### 2. 代码复用
- 减少重复代码
- 减小打包体积

### 3. 统一缓存
- 同一个组件，同样的缓存策略

## 维护优势

### 1. 单一真相来源
- 表格样式只在一个地方定义
- 修改一次，所有地方生效

### 2. 更容易测试
- 只需测试一个组件
- 测试覆盖预览和查看两种场景

### 3. 更容易扩展
- 添加新功能只需修改一个组件
- 例如：添加排序、筛选等功能

## 迁移指南

### 对于开发者

**旧代码:**
```tsx
// 预览
<div>
  <Table>
    {/* 自定义表格 */}
  </Table>
</div>

// 查看
<CsvViewer fileUrl={url} />
```

**新代码:**
```tsx
// 预览
<CsvViewer file={file} title="Preview" />

// 查看
<CsvViewer fileUrl={url} title="CSV Data" />
```

### 对于用户

无需任何改变！用户界面保持一致，但功能更强大：
- ✅ 预览现在可以看到所有数据
- ✅ 预览和查看界面完全一致
- ✅ 更流畅的体验

## 未来扩展

基于统一的 CsvViewer，可以轻松添加：

1. **列排序**
   ```tsx
   <CsvViewer file={file} sortable />
   ```

2. **列筛选**
   ```tsx
   <CsvViewer file={file} filterable />
   ```

3. **导出功能**
   ```tsx
   <CsvViewer file={file} exportable />
   ```

4. **列宽调整**
   ```tsx
   <CsvViewer file={file} resizable />
   ```

所有这些功能只需在一个组件中实现，预览和查看都能使用！

## 总结

通过统一 CSV 查看器组件：
- ✅ 减少了代码重复
- ✅ 提升了用户体验（完整预览）
- ✅ 简化了维护工作
- ✅ 为未来扩展打下基础

这是一个典型的 DRY (Don't Repeat Yourself) 原则的应用，通过抽象共同功能，提高了代码质量和可维护性。
