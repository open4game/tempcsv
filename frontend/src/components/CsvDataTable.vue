<script setup>
import { ref, onMounted, watch, nextTick, onBeforeUnmount, computed } from 'vue'
import TableMinimap from './TableMinimap.vue'

const props = defineProps({
  // Table data
  rows: {
    type: Array,
    required: true
  },
  // Table columns
  columns: {
    type: Array,
    required: true
  },
  // Whether the table is in edit mode
  editable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['cell-edited', 'edit-started', 'edit-cancelled'])

// Table state
const editedData = ref(null)
const currentEditCell = ref(null)
const editValue = ref('')
const hoveredRow = ref(null)
const hoveredColumn = ref(null)
const selectedCells = ref([])

// Table refs and state
const tableContainer = ref(null)
const scrollableElement = ref(null)
const showMinimap = ref(false)
const minimapRef = ref(null)
const enableMinimapDebug = ref(false)
const hasHorizontalOverflow = ref(false)
const hasVerticalOverflow = ref(false)

// Column resizing state
const isResizing = ref(false)
const resizingColumnIndex = ref(null)
const startX = ref(0)
const startWidth = ref(0)

// Generate alphabet column headers (A, B, C, ... Z, AA, AB, etc.)
const getColumnLetter = (index) => {
  let result = '';
  let num = index;
  
  while (num >= 0) {
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26) - 1;
  }
  
  return result;
}

// Column letters for display
const columnLetters = computed(() => {
  return props.columns.map((_, index) => getColumnLetter(index));
});

// Start cell editing (now with double-click)
const startEditing = (row, column, rowIndex, colIndex) => {
  if (!props.editable) return
  
  // Adjust colIndex to account for the row index column
  currentEditCell.value = { row, column, rowIndex, colIndex: colIndex }
  editValue.value = row[column.field]
  
  emit('edit-started', { row, column, rowIndex, colIndex })
}

// Save cell edit
const saveEdit = () => {
  if (!currentEditCell.value) return
  
  const { row, column, rowIndex } = currentEditCell.value
  
  // Create a deep copy of rows if not already created
  if (!editedData.value) {
    editedData.value = JSON.parse(JSON.stringify(props.rows))
  }
  
  // Update the value
  editedData.value[rowIndex][column.field] = editValue.value
  
  // Emit the edited cell event
  emit('cell-edited', {
    rowIndex,
    columnField: column.field,
    oldValue: row[column.field],
    newValue: editValue.value,
    editedData: editedData.value
  })
  
  // Reset edit state
  currentEditCell.value = null
  editValue.value = ''
}

// Cancel cell edit
const cancelEdit = () => {
  emit('edit-cancelled', currentEditCell.value)
  
  currentEditCell.value = null
  editValue.value = ''
}

// Handle table scroll
const handleTableScroll = () => {
  // Update minimap viewport if visible
  if (showMinimap.value && minimapRef.value) {
    minimapRef.value.handleTableScroll()
  }
}

// Check for table overflow
const checkTableOverflow = () => {
  nextTick(() => {
    if (scrollableElement.value) {
      hasHorizontalOverflow.value = scrollableElement.value.scrollWidth > scrollableElement.value.clientWidth
      hasVerticalOverflow.value = scrollableElement.value.scrollHeight > scrollableElement.value.clientHeight
      
      // If minimap is visible, update it
      if (showMinimap.value && minimapRef.value) {
        minimapRef.value.updateMinimapViewport()
      }
    } else {
      // Reset overflow flags if scrollable element is not available
      hasHorizontalOverflow.value = false
      hasVerticalOverflow.value = false
    }
  })
}

// Toggle minimap visibility
const toggleMinimap = () => {
  showMinimap.value = !showMinimap.value
}

// Toggle debug mode for minimap
const toggleMinimapDebug = () => {
  enableMinimapDebug.value = !enableMinimapDebug.value
}

// Scroll to top function
const scrollToTop = () => {
  if (scrollableElement.value) {
    scrollableElement.value.scrollTop = 0
    
    // Update minimap viewport if visible
    if (minimapRef.value) {
      minimapRef.value.updateMinimapViewport()
    }
  }
}

// Scroll to bottom function
const scrollToBottom = () => {
  if (scrollableElement.value) {
    scrollableElement.value.scrollTop = scrollableElement.value.scrollHeight
    
    // Update minimap viewport if visible
    if (minimapRef.value) {
      minimapRef.value.updateMinimapViewport()
    }
  }
}

// Set hovered row and column for visual feedback
const setHoveredCell = (rowIndex, colIndex) => {
  hoveredRow.value = rowIndex
  hoveredColumn.value = colIndex
}

// Clear hovered state
const clearHoveredCell = () => {
  hoveredRow.value = null
  hoveredColumn.value = null
}

// Toggle cell selection for export
const toggleCellSelection = (rowIndex, colIndex) => {
  const cellKey = `${rowIndex}-${colIndex}`
  const index = selectedCells.value.indexOf(cellKey)
  
  if (index === -1) {
    selectedCells.value.push(cellKey)
  } else {
    selectedCells.value.splice(index, 1)
  }
}

// Check if a cell is selected
const isCellSelected = (rowIndex, colIndex) => {
  return selectedCells.value.includes(`${rowIndex}-${colIndex}`)
}

// Export table data as CSV
const exportAsCSV = () => {
  // Get headers from columns
  const headers = props.columns.map(col => col.field)
  
  // Create CSV rows
  const csvRows = []
  
  // Add header row
  csvRows.push(headers.join(','))
  
  // Add data rows
  const dataToExport = editedData.value || props.rows
  for (const row of dataToExport) {
    const values = headers.map(header => {
      const val = row[header]
      // Handle values with commas by wrapping in quotes
      return typeof val === 'string' && val.includes(',') ? `"${val}"` : val
    })
    csvRows.push(values.join(','))
  }
  
  // Create a blob and download
  const csvContent = csvRows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  
  // Create a link and trigger download
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', 'table_export.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Copy selected cells to clipboard
const copySelectedToClipboard = () => {
  if (selectedCells.value.length === 0) {
    // If no cells are selected, copy all data
    exportAsCSV()
    return
  }
  
  // Get selected cells data
  const dataToExport = editedData.value || props.rows
  const selectedData = []
  
  // Group by row for proper formatting
  const rowGroups = {}
  
  selectedCells.value.forEach(cellKey => {
    const [rowIndex, colIndex] = cellKey.split('-').map(Number)
    if (!rowGroups[rowIndex]) {
      rowGroups[rowIndex] = []
    }
    
    const column = props.columns[colIndex]
    const cellValue = dataToExport[rowIndex][column.field]
    rowGroups[rowIndex].push({ colIndex, value: cellValue })
  })
  
  // Sort rows and columns
  Object.keys(rowGroups).sort((a, b) => Number(a) - Number(b)).forEach(rowIndex => {
    const rowData = rowGroups[rowIndex].sort((a, b) => a.colIndex - b.colIndex).map(cell => cell.value)
    selectedData.push(rowData.join('\t'))
  })
  
  // Copy to clipboard
  navigator.clipboard.writeText(selectedData.join('\n'))
    .then(() => {
      alert('Selected data copied to clipboard')
      // Clear selection after copy
      selectedCells.value = []
    })
    .catch(err => {
      console.error('Failed to copy data: ', err)
    })
}

// Add a computed property to determine if we need empty rows
const emptyRowsCount = computed(() => {
  // For small tables, add empty rows to reach a minimum of 5 rows
  const minRows = 5;
  return props.rows.length < minRows ? minRows - props.rows.length : 0;
});

// Function to calculate optimal column widths based on content
const calculateOptimalColumnWidths = () => {
  if (!props.columns || props.columns.length === 0) return
  
  // Get column fields
  const fields = props.columns.map(col => col.field)
  
  // Initialize with minimum widths based on header length
  const optimalWidths = props.columns.map(col => {
    // Start with header length (each character is roughly 8px wide)
    const headerLength = col.label ? col.label.length * 8 : 0
    return Math.max(120, headerLength + 32) // Add padding, minimum 120px
  })
  
  // If we have rows, sample them to determine width
  if (props.rows && props.rows.length > 0) {
    // Sample rows to determine width (check up to 100 rows for performance)
    const sampleSize = Math.min(props.rows.length, 100)
    const sampleRows = props.rows.slice(0, sampleSize)
    
    // Check content width for each cell
    sampleRows.forEach(row => {
      fields.forEach((field, index) => {
        const content = row[field]
        if (content) {
          // Estimate content width (each character is roughly 8px wide)
          const contentLength = String(content).length * 8
          optimalWidths[index] = Math.max(optimalWidths[index], contentLength + 32) // Add padding
        }
      })
    })
  }
  
  // For small tables (few columns), ensure minimum total width
  const totalWidth = optimalWidths.reduce((sum, width) => sum + width, 0)
  const minTotalWidth = 600 // Minimum total width for the table
  
  if (totalWidth < minTotalWidth && optimalWidths.length > 0) {
    // Distribute additional width evenly among columns
    const additionalWidthPerColumn = Math.floor((minTotalWidth - totalWidth) / optimalWidths.length)
    return optimalWidths.map(width => width + additionalWidthPerColumn)
  }
  
  // Cap maximum width to prevent extremely wide columns
  return optimalWidths.map(width => Math.min(width, 300))
}

// Apply calculated column widths
const applyColumnWidths = () => {
  nextTick(() => {
    if (!tableContainer.value) return
    
    const optimalWidths = calculateOptimalColumnWidths()
    if (!optimalWidths) return
    
    // Apply widths to all columns
    optimalWidths.forEach((width, index) => {
      // Column index is +1 because of row index column
      const colIndex = index + 1
      
      // Get all cells in this column (including headers and letter headers)
      const allCells = tableContainer.value.querySelectorAll(`th:nth-child(${colIndex + 1}), td:nth-child(${colIndex + 1})`)
      
      // Apply the width to all cells in the column
      allCells.forEach(cell => {
        cell.style.width = `${width}px`
        cell.style.minWidth = `${width}px`
      })
    })
  })
}

// Replace the adjustColumnWidths function with our new implementation
const adjustColumnWidths = () => {
  applyColumnWidths()
}

// Watch for changes that might affect table dimensions
watch(() => props.rows, () => {
  checkTableOverflow()
  // Reset edited data when rows change
  editedData.value = null
  // Adjust column widths when rows change
  nextTick(() => {
    applyColumnWidths()
    // Force a second adjustment after a short delay to ensure everything is rendered
    setTimeout(applyColumnWidths, 100)
  })
}, { deep: true })

watch(() => props.columns, () => {
  checkTableOverflow()
  // Adjust column widths when columns change
  nextTick(() => {
    applyColumnWidths()
    // Force a second adjustment after a short delay to ensure everything is rendered
    setTimeout(applyColumnWidths, 100)
  })
}, { deep: true })

// Start column resize
const startResize = (event, index) => {
  isResizing.value = true
  resizingColumnIndex.value = index
  startX.value = event.clientX
  
  // Add resizing class to body
  document.body.classList.add('resizing')
  
  // Get current width of the column
  const colIndex = index + 1 // +1 because of row index column
  const columnCell = tableContainer.value.querySelector(`th:nth-child(${colIndex + 1})`)
  
  if (columnCell) {
    startWidth.value = columnCell.getBoundingClientRect().width
  }
  
  // Add event listeners for mouse move and mouse up
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  
  // Prevent text selection during resize
  event.preventDefault()
}

// Handle column resize
const handleResize = (event) => {
  if (!isResizing.value) return
  
  const deltaX = event.clientX - startX.value
  const newWidth = Math.max(80, startWidth.value + deltaX) // Minimum width of 80px
  
  // Apply new width to all cells in the column (including headers)
  const colIndex = resizingColumnIndex.value + 1 // +1 because of row index column
  
  // Get all cells in this column (including headers and letter headers)
  const allCells = tableContainer.value.querySelectorAll(`th:nth-child(${colIndex + 1}), td:nth-child(${colIndex + 1})`)
  
  // Apply the new width to all cells in the column
  allCells.forEach(cell => {
    cell.style.width = `${newWidth}px`
    cell.style.minWidth = `${newWidth}px`
  })
}

// Stop column resize
const stopResize = () => {
  isResizing.value = false
  resizingColumnIndex.value = null
  
  // Remove resizing class from body
  document.body.classList.remove('resizing')
  
  // Remove event listeners
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

// Initialize component
onMounted(() => {
  nextTick(() => {
    // Set scrollable element reference
    if (tableContainer.value) {
      scrollableElement.value = tableContainer.value.querySelector('.scrollable-table')
      
      // Add scroll event listener
      if (scrollableElement.value) {
        scrollableElement.value.addEventListener('scroll', handleTableScroll)
      }
      
      // Check for overflow
      checkTableOverflow()
      
      // Add a small delay to ensure the table is fully rendered
      setTimeout(() => {
        if (minimapRef.value && scrollableElement.value) {
          minimapRef.value.updateMinimapViewport()
        }
        
        // Apply column widths
        applyColumnWidths()
        
        // Force a second adjustment after a short delay to ensure everything is rendered
        setTimeout(applyColumnWidths, 300)
      }, 200)
    }
  })
  
  // Add window resize listener
  window.addEventListener('resize', () => {
    checkTableOverflow()
    applyColumnWidths()
  })
})

// Clean up event listeners
onBeforeUnmount(() => {
  // Remove window event listeners
  window.removeEventListener('resize', checkTableOverflow)
  
  // Remove scroll event listener
  if (scrollableElement.value) {
    scrollableElement.value.removeEventListener('scroll', handleTableScroll)
  }
  
  // Remove resize event listeners
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})

// Expose methods to parent component
defineExpose({
  scrollToTop,
  scrollToBottom,
  toggleMinimap,
  toggleMinimapDebug,
  hasHorizontalOverflow,
  hasVerticalOverflow,
  exportAsCSV,
  copySelectedToClipboard
})
</script>

<template>
  <div>
    <!-- Table metadata and stats -->
    <div class="d-flex align-center justify-space-between mb-2">
      <div class="table-stats">
        <v-chip color="primary" size="small" class="mr-2">
          <v-icon start size="x-small">mdi-table-column</v-icon>
          {{ columns.length }} Columns
        </v-chip>
        <v-chip color="primary" size="small">
          <v-icon start size="x-small">mdi-table-row</v-icon>
          {{ rows.length }} Rows
        </v-chip>
      </div>
      
      <div class="d-flex align-center">
        <!-- Export options -->
        <v-btn
          color="success"
          variant="text"
          size="small"
          @click="exportAsCSV"
          class="mr-2"
        >
          <v-icon start>mdi-file-export</v-icon>
          Export CSV
        </v-btn>
        
        <v-btn
          color="info"
          variant="text"
          size="small"
          @click="copySelectedToClipboard"
          class="mr-2"
        >
          <v-icon start>mdi-content-copy</v-icon>
          Copy Selected
        </v-btn>
        
        <v-btn
          v-if="(hasHorizontalOverflow || hasVerticalOverflow) && scrollableElement"
          color="primary"
          variant="text"
          size="small"
          @click="toggleMinimap"
          class="mr-2"
        >
          <v-icon start>mdi-map</v-icon>
          {{ showMinimap ? 'Hide Minimap' : 'Show Minimap' }}
        </v-btn>
        
        <v-btn
          v-if="rows.length > 10"
          color="info"
          variant="text"
          size="small"
          @click="toggleMinimapDebug"
        >
          <v-icon start>{{ enableMinimapDebug ? 'mdi-bug-check' : 'mdi-bug' }}</v-icon>
          {{ enableMinimapDebug ? 'Disable Debug' : 'Enable Debug' }}
        </v-btn>
      </div>
    </div>
    
    <div 
      ref="tableContainer" 
      class="table-container" 
      :class="{ 
        'has-horizontal-overflow': hasHorizontalOverflow,
        'has-vertical-overflow': hasVerticalOverflow 
      }"
    >
      <!-- Unified Table Implementation -->
      <div class="scrollable-table">
        <table>
          <thead>
            <tr>
              <!-- Corner cell (empty) -->
              <th class="corner-cell">#</th>
              
              <!-- Column index headers (A, B, C, etc.) -->
              <th 
                v-for="(letter, index) in columnLetters" 
                :key="'col-' + index" 
                class="column-index"
                :class="{ 'hovered-column': hoveredColumn === index }"
              >
                {{ letter }}
                <div 
                  class="resize-handle"
                  @mousedown="startResize($event, index)"
                ></div>
              </th>
            </tr>
            <tr>
              <!-- Row index header -->
              <th class="row-index-header">#</th>
              
              <!-- Column headers with labels -->
              <th 
                v-for="(column, colIndex) in columns" 
                :key="colIndex"
                :class="{ 'hovered-column': hoveredColumn === colIndex }"
              >
                {{ column.label }}
                <div 
                  class="resize-handle"
                  @mousedown="startResize($event, colIndex)"
                ></div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(row, rowIndex) in rows" 
              :key="rowIndex"
              :class="{ 'hovered-row': hoveredRow === rowIndex }"
            >
              <!-- Row index -->
              <td class="row-index">{{ rowIndex + 1 }}</td>
              
              <!-- Data cells -->
              <td 
                v-for="(column, colIndex) in columns" 
                :key="colIndex"
                @dblclick="startEditing(row, column, rowIndex, colIndex)"
                @mouseover="setHoveredCell(rowIndex, colIndex)"
                @mouseleave="clearHoveredCell"
                @click="toggleCellSelection(rowIndex, colIndex)"
                class="editable-cell"
                :class="{ 
                  'not-editable': !editable,
                  'hovered-column': hoveredColumn === colIndex,
                  'edited-cell': editedData && editedData[rowIndex] && editedData[rowIndex][column.field] !== row[column.field],
                  'selected-cell': isCellSelected(rowIndex, colIndex)
                }"
              >
                <div v-if="currentEditCell && 
                          currentEditCell.rowIndex === rowIndex && 
                          currentEditCell.colIndex === colIndex" 
                     class="edit-cell-container">
                  <input 
                    v-model="editValue" 
                    class="edit-input"
                    @keyup.enter="saveEdit"
                    @keyup.esc="cancelEdit"
                    ref="editInput"
                    v-focus
                  />
                  <div class="edit-actions">
                    <v-btn size="x-small" color="success" icon @click="saveEdit">
                      <v-icon>mdi-check</v-icon>
                    </v-btn>
                    <v-btn size="x-small" color="error" icon @click="cancelEdit">
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                  </div>
                </div>
                <span v-else>{{ row[column.field] }}</span>
              </td>
            </tr>
            
            <!-- Add empty rows for small tables -->
            <tr 
              v-for="i in emptyRowsCount" 
              :key="`empty-${i}`"
              class="empty-row"
            >
              <td class="row-index">{{ rows.length + i }}</td>
              <td 
                v-for="(column, colIndex) in columns" 
                :key="colIndex"
              >
                &nbsp;
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Integrated Table Minimap Component -->
      <TableMinimap
        ref="minimapRef"
        :scrollable-element="scrollableElement"
        :rows="rows"
        :columns="columns"
        :visible="showMinimap"
        :debug="enableMinimapDebug"
        @update:visible="showMinimap = $event"
      />
    </div>
    
    <div class="table-actions">
      <v-btn
        color="primary"
        variant="text"
        @click="scrollToTop"
        class="mr-2"
      >
        <v-icon start>mdi-arrow-up-bold</v-icon>
        Top
      </v-btn>
      
      <v-btn
        color="primary"
        variant="text"
        @click="scrollToBottom"
      >
        <v-icon start>mdi-arrow-down-bold</v-icon>
        Bottom
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.table-container {
  position: relative;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 16px;
  min-width: 600px; /* Ensure minimum width for small tables */
}

.scrollable-table {
  overflow: auto;
  min-height: 300px; /* Minimum height for short tables */
  max-height: 500px;
  width: 100%;
}

/* Add styles for the integrated minimap */
:deep(.table-minimap-container) {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 100;
}

table {
  border-collapse: collapse;
  width: max-content; /* Allow it to expand based on content */
  min-width: 100%;
  table-layout: fixed;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
  min-width: 120px; /* Increased minimum width for small tables */
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Corner cell styling */
.corner-cell {
  width: 50px;
  min-width: 50px;
  background-color: #e0e0e0;
  position: sticky;
  top: 0;
  left: 0;
  z-index: 4;
  text-align: center;
}

/* Column index styling */
.column-index {
  background-color: #e0e0e0;
  font-weight: bold;
  color: #666;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 3;
}

/* Regular header styling */
thead tr:nth-child(2) th {
  background-color: #f5f5f5;
  position: sticky;
  top: 24px; /* Height of the column index row */
  z-index: 2;
}

/* Row index header styling */
.row-index-header, .row-index {
  width: 50px;
  min-width: 50px;
  text-align: center;
  background-color: #f5f5f5;
  font-weight: bold;
  color: #666;
}

.row-index {
  position: sticky;
  left: 0;
  z-index: 1;
}

/* Make sure the first row of headers stays fixed */
thead tr:first-child th {
  position: sticky;
  top: 0;
  z-index: 3;
}

/* Make sure the second row of headers stays fixed below the first row */
thead tr:nth-child(2) th {
  position: sticky;
  top: 24px; /* Height of the first header row */
  z-index: 2;
}

/* Ensure the corner cell in the second row has higher z-index */
thead tr:nth-child(2) th.row-index-header {
  z-index: 3;
}

/* For tables with few rows, add empty rows */
.empty-row td {
  height: 37px; /* Match the height of regular rows */
  background-color: #f9f9f9;
  border-color: #eee;
  color: transparent;
}

/* Row index column styling */
.row-index {
  position: sticky;
  left: 0;
  z-index: 1;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}

tr:nth-child(even) .row-index {
  background-color: #eaeaea;
}

.editable-cell {
  cursor: pointer;
  position: relative;
}

.not-editable {
  cursor: default;
}

/* Visual feedback for hovering */
.hovered-row {
  background-color: rgba(25, 118, 210, 0.05) !important;
}

.hovered-column {
  background-color: rgba(25, 118, 210, 0.05) !important;
}

.edited-cell {
  background-color: rgba(76, 175, 80, 0.1) !important;
}

.selected-cell {
  background-color: rgba(255, 193, 7, 0.2) !important;
  outline: 2px solid #FFC107;
}

.editable-cell:hover:not(.not-editable) {
  background-color: rgba(25, 118, 210, 0.1);
}

.editable-cell:hover:not(.not-editable)::after {
  content: '✏️';
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  opacity: 0.5;
}

.edit-cell-container {
  display: flex;
  align-items: center;
  width: 100%;
}

.edit-input {
  flex: 1;
  padding: 4px;
  border: 1px solid #1976D2;
  border-radius: 4px;
  outline: none;
}

.edit-actions {
  display: flex;
  margin-left: 4px;
}

.table-stats {
  margin-bottom: 8px;
}

.table-actions {
  display: flex;
  margin-top: 8px;
}

/* Add shadow indicators for horizontal scrolling when content overflows */
.table-container.has-horizontal-overflow .scrollable-table:before,
.table-container.has-horizontal-overflow .scrollable-table:after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 15px;
  pointer-events: none;
  z-index: 10;
}

.table-container.has-horizontal-overflow .scrollable-table:before {
  left: 0;
  background: linear-gradient(to right, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0));
}

.table-container.has-horizontal-overflow .scrollable-table:after {
  right: 0;
  background: linear-gradient(to left, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0));
}

/* Add shadow indicators for vertical scrolling when content overflows */
.table-container.has-vertical-overflow .scrollable-table:before,
.table-container.has-vertical-overflow .scrollable-table:after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 15px;
  pointer-events: none;
  z-index: 10;
}

.table-container.has-vertical-overflow .scrollable-table:before {
  top: 0;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0));
}

.table-container.has-vertical-overflow .scrollable-table:after {
  bottom: 0;
  background: linear-gradient(to top, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0));
}

/* Column resizing */
.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 5px;
  height: 100%;
  cursor: col-resize;
  background-color: transparent;
  transition: background-color 0.2s;
}

.resize-handle:hover {
  background-color: rgba(25, 118, 210, 0.3);
}

/* Make column headers and indices relative for resize handle positioning */
.column-index, th {
  position: relative;
}

/* Add cursor style for when resizing is active */
body.resizing {
  cursor: col-resize !important;
}
</style>

<script>
// Custom directive to focus input when editing
export default {
  directives: {
    focus: {
      mounted(el) {
        el.focus()
      }
    }
  }
}
</script> 