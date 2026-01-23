# 上传流程优化 - 预览后上传

## 新流程

### 1. 选择文件
用户通过拖拽或点击选择 CSV 文件

### 2. 预览文件 ⭐ 新增
- 自动解析 CSV 文件
- 显示前 5 行数据预览
- 显示表头和数据格式
- 用户可以确认数据正确性

### 3. 确认上传
- 用户确认预览无误后点击"Confirm & Upload"
- 或者点击"Cancel"重新选择文件

### 4. 上传成功
- 显示文件 URL
- 提供分享、查看、下载选项

## 流程对比

### 旧流程
```
选择文件 → 直接上传 → 成功/失败
```

**问题:**
- 用户无法预先确认文件内容
- 上传后才发现文件有问题
- 浪费带宽和存储空间

### 新流程
```
选择文件 → 预览内容 → 确认上传 → 成功/失败
```

**优势:**
- ✅ 用户可以预先查看文件内容
- ✅ 确认数据格式正确
- ✅ 避免上传错误文件
- ✅ 更好的用户体验

## 功能特性

### 预览功能
- **自动解析**: 选择文件后自动解析 CSV
- **前 5 行预览**: 显示足够的数据供用户确认
- **表头显示**: 清晰显示列名
- **格式检查**: 自动检测 CSV 格式问题

### 交互优化
- **取消操作**: 可以随时取消并重新选择
- **错误提示**: 清晰的错误信息
- **加载状态**: 上传时显示进度

### 视觉改进
- **三阶段 UI**: 选择 → 预览 → 成功
- **卡片布局**: 清晰的视觉层次
- **响应式设计**: 适配各种屏幕尺寸

## 组件状态

### 状态 1: 文件选择
```tsx
<div className="border-dashed">
  <Upload icon />
  <h3>Drop your CSV file here</h3>
  <Button>Select CSV file</Button>
</div>
```

### 状态 2: 文件预览 ⭐ 新增
```tsx
<Card>
  <CardHeader>Preview: filename.csv</CardHeader>
  <CardContent>
    <Table>
      {/* 前 5 行数据 */}
    </Table>
    <Button>Confirm & Upload</Button>
    <Button>Cancel</Button>
  </CardContent>
</Card>
```

### 状态 3: 上传成功
```tsx
<Card className="border-green">
  <CheckCircle icon />
  <h3>Upload Successful!</h3>
  <code>{fileUrl}</code>
  <Button>Share This File</Button>
  <Button>View</Button>
  <Button>Download</Button>
</Card>
```

## 技术实现

### CSV 解析
使用 PapaCSV 在客户端解析：

```typescript
const reader = new FileReader();
reader.onload = (e) => {
  const text = e.target?.result as string;
  Papa.parse(text, {
    complete: (results) => {
      const data = results.data as string[][];
      setPreviewHeaders(data[0]);
      setPreviewData(data.slice(1, 6)); // 前 5 行
    }
  });
};
reader.readAsText(selectedFile);
```

### 状态管理
```typescript
const [file, setFile] = useState<File | null>(null);
const [previewData, setPreviewData] = useState<string[][] | null>(null);
const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
```

### 条件渲染
```typescript
if (uploadResult) return <SuccessView />;
if (file && previewData) return <PreviewView />;
return <FileSelectView />;
```

## 用户体验改进

### 1. 即时反馈
- 选择文件后立即显示预览
- 无需等待上传即可查看内容

### 2. 错误预防
- 预览时发现格式问题
- 避免上传错误文件

### 3. 信心提升
- 用户确认数据正确
- 减少上传后的焦虑

### 4. 操作灵活
- 可以随时取消
- 重新选择文件

## 移动端优化

### 响应式表格
```tsx
<div className="overflow-x-auto">
  <Table>
    {/* 横向滚动查看所有列 */}
  </Table>
</div>
```

### 按钮布局
```tsx
<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
  {/* 小屏幕垂直排列，大屏幕水平排列 */}
</div>
```

## 性能考虑

### 客户端解析
- 不增加服务器负担
- 即时预览，无需网络请求
- 只解析前几行，速度快

### 内存管理
- 只保存预览数据（5 行）
- 不保存完整文件内容
- 上传后清理预览数据

## 安全性

### 文件验证
- 检查文件类型（.csv）
- 检查 MIME 类型
- 解析验证 CSV 格式

### 错误处理
- 捕获解析错误
- 显示友好的错误信息
- 防止无效文件上传

## 未来改进

1. **更多预览选项**
   - 显示更多行
   - 显示文件统计信息
   - 数据类型检测

2. **编辑功能**
   - 预览时简单编辑
   - 删除空行
   - 格式化数据

3. **批量上传**
   - 支持多文件预览
   - 批量确认上传

4. **高级验证**
   - 列数验证
   - 数据类型验证
   - 必填字段检查

## 测试清单

- [ ] 选择 CSV 文件显示预览
- [ ] 预览显示正确的表头和数据
- [ ] 取消按钮返回文件选择
- [ ] 确认上传成功
- [ ] 错误文件显示错误信息
- [ ] 拖拽上传工作正常
- [ ] 移动端布局正确
- [ ] 大文件预览性能良好

## 文件变更

- ✅ 创建新组件: `csv-uploader.tsx`
- ✅ 备份旧组件: `csv-uploader-old.tsx`
- ✅ 保持 API 接口不变
- ✅ 保持父组件调用方式不变

## 兼容性

新组件完全兼容旧的调用方式：

```tsx
<CsvUploader
  onFileUploaded={(result) => {...}}
  onViewFile={(fileUrl) => {...}}
/>
```

无需修改父组件代码！
