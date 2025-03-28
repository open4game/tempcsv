<script setup>
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'

const props = defineProps({
  // The scrollable element that contains the table
  scrollableElement: {
    type: Object,
    required: false,
    default: null
  },
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
  // Whether the minimap is visible
  visible: {
    type: Boolean,
    default: false
  },
  // Debug mode
  debug: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible'])

// Minimap refs and state
const minimapContainer = ref(null)
const minimapContent = ref(null)
const minimapViewport = ref(null)
const minimapRows = ref([])
const isDraggingMinimap = ref(false)
const minimapStartX = ref(0)
const minimapStartY = ref(0)
const minimapStartScrollX = ref(0)
const minimapStartScrollY = ref(0)
const minimapScale = ref({ x: 1, y: 1 })
const verticalScrollIndicator = ref(null)
const horizontalScrollIndicator = ref(null)
const verticalScrollPosition = ref(0)
const horizontalScrollPosition = ref(0)
const tableScrollHeight = ref(0)
const tableScrollWidth = ref(0)
const visibleRows = ref(0)
const visibleColumns = ref(0)
const currentRowIndex = ref(0)
const currentColIndex = ref(0)

// Debug information
const debugInfo = ref({
  tableScrollHeight: 0,
  tableScrollWidth: 0,
  tableClientHeight: 0,
  tableClientWidth: 0,
  avgRowHeight: 0,
  avgColWidth: 0,
  rowCount: 0,
  colCount: 0,
  visibleRows: 0,
  visibleCols: 0,
  scaleX: 0,
  scaleY: 0
})

// Update minimap viewport position based on scroll position
const updateMinimapViewport = () => {
  if (!minimapViewport.value || !minimapContent.value || !props.scrollableElement) {
    // If scrollableElement is null, just update the minimap rows
    if (minimapViewport.value && minimapContent.value) {
      // Set default viewport size
      minimapViewport.value.style.width = `${minimapContent.value.clientWidth}px`
      minimapViewport.value.style.height = `${minimapContent.value.clientHeight}px`
      minimapViewport.value.style.left = '0px'
      minimapViewport.value.style.top = '0px'
      
      // Update the minimap rows
      updateMinimapRows()
    }
    return
  }
  
  const table = props.scrollableElement
  const minimap = minimapContent.value
  
  // Store table scroll dimensions for reference
  tableScrollHeight.value = table.scrollHeight || 0
  tableScrollWidth.value = table.scrollWidth || 0
  
  // Calculate visible rows and columns
  // For Vue Good Table, we need to handle the case where rows might have variable heights
  // and the table might have pagination
  
  // Get the actual table element inside the scrollable container
  const actualTable = table.querySelector('table') || table
  
  // Get all rows in the table
  const tableRows = actualTable.querySelectorAll('tbody tr')
  const tableHeaders = actualTable.querySelectorAll('thead th')
  
  // Calculate average row height if we have rows
  let avgRowHeight = 0
  if (tableRows.length > 0) {
    const totalRowHeight = Array.from(tableRows).reduce((sum, row) => sum + row.offsetHeight, 0)
    avgRowHeight = totalRowHeight / tableRows.length
  } else if (props.rows.length > 0) {
    // Fallback: estimate based on container height and number of rows
    avgRowHeight = tableScrollHeight.value / props.rows.length
  }
  
  // Calculate average column width if we have columns
  let avgColWidth = 0
  if (tableHeaders.length > 0) {
    const totalColWidth = Array.from(tableHeaders).reduce((sum, col) => sum + col.offsetWidth, 0)
    avgColWidth = totalColWidth / tableHeaders.length
  } else if (props.columns.length > 0) {
    // Fallback: estimate based on container width and number of columns
    avgColWidth = tableScrollWidth.value / props.columns.length
  }
  
  // Calculate visible rows and columns based on averages
  visibleRows.value = avgRowHeight > 0 
    ? Math.round(table.clientHeight / avgRowHeight) 
    : Math.min(10, props.rows.length)
    
  visibleColumns.value = avgColWidth > 0 
    ? Math.round(table.clientWidth / avgColWidth) 
    : Math.min(5, props.columns.length)
  
  // Calculate the scale between the minimap and the actual table
  minimapScale.value = {
    x: minimap.clientWidth / Math.max(1, tableScrollWidth.value),
    y: minimap.clientHeight / Math.max(1, tableScrollHeight.value)
  }
  
  // Update debug info
  if (props.debug) {
    debugInfo.value = {
      tableScrollHeight: tableScrollHeight.value,
      tableScrollWidth: tableScrollWidth.value,
      tableClientHeight: table.clientHeight,
      tableClientWidth: table.clientWidth,
      avgRowHeight,
      avgColWidth,
      rowCount: tableRows.length,
      colCount: tableHeaders.length,
      visibleRows: visibleRows.value,
      visibleCols: visibleColumns.value,
      scaleX: minimapScale.value.x,
      scaleY: minimapScale.value.y
    }
  }
  
  // Calculate viewport dimensions and position
  const viewportWidth = Math.min(
    minimap.clientWidth, 
    table.clientWidth * minimapScale.value.x
  )
  
  const viewportHeight = Math.min(
    minimap.clientHeight, 
    table.clientHeight * minimapScale.value.y
  )
  
  const viewportLeft = table.scrollLeft * minimapScale.value.x
  const viewportTop = table.scrollTop * minimapScale.value.y
  
  // Update viewport position and size
  minimapViewport.value.style.width = `${viewportWidth}px`
  minimapViewport.value.style.height = `${viewportHeight}px`
  minimapViewport.value.style.left = `${viewportLeft}px`
  minimapViewport.value.style.top = `${viewportTop}px`
  
  // Update scroll position indicators
  const maxHorizontalScroll = Math.max(0, tableScrollWidth.value - table.clientWidth)
  const maxVerticalScroll = Math.max(0, tableScrollHeight.value - table.clientHeight)
  
  horizontalScrollPosition.value = maxHorizontalScroll > 0 
    ? Math.round((table.scrollLeft / maxHorizontalScroll) * 100) 
    : 0
  
  verticalScrollPosition.value = maxVerticalScroll > 0 
    ? Math.round((table.scrollTop / maxVerticalScroll) * 100) 
    : 0
  
  // Calculate current row and column indices
  if (props.rows.length > 0 && props.columns.length > 0) {
    // For row index, use the scroll position and average row height
    if (avgRowHeight > 0) {
      currentRowIndex.value = Math.min(
        Math.floor(table.scrollTop / avgRowHeight),
        props.rows.length - 1
      )
    } else if (tableScrollHeight.value > 0) {
      // Fallback to the previous calculation
      currentRowIndex.value = Math.min(
        Math.floor(table.scrollTop / (tableScrollHeight.value / props.rows.length)),
        props.rows.length - 1
      )
    } else {
      currentRowIndex.value = 0
    }
    
    // For column index, use the scroll position and average column width
    if (avgColWidth > 0) {
      currentColIndex.value = Math.min(
        Math.floor(table.scrollLeft / avgColWidth),
        props.columns.length - 1
      )
    } else if (tableScrollWidth.value > 0) {
      // Fallback to the previous calculation
      currentColIndex.value = Math.min(
        Math.floor(table.scrollLeft / (tableScrollWidth.value / props.columns.length)),
        props.columns.length - 1
      )
    } else {
      currentColIndex.value = 0
    }
  }
  
  // Update scroll indicators
  updateScrollIndicators()
}

// Update scroll indicators
const updateScrollIndicators = () => {
  if (!horizontalScrollIndicator.value || !verticalScrollIndicator.value) return
  
  // Update horizontal scroll indicator
  horizontalScrollIndicator.value.style.width = `${horizontalScrollPosition.value}%`
  
  // Update vertical scroll indicator
  verticalScrollIndicator.value.style.height = `${verticalScrollPosition.value}%`
}

// Generate minimap rows based on actual data
const updateMinimapRows = () => {
  // Limit to a reasonable number of rows for performance
  const maxRows = Math.min(props.rows.length, 100)
  minimapRows.value = Array(maxRows).fill(0)
  
  // Update the minimap grid to better represent the table structure
  nextTick(() => {
    if (minimapContent.value) {
      const minimap = minimapContent.value
      const minimapTable = minimap.querySelector('.minimap-table')
      
      if (minimapTable) {
        // Adjust grid template rows based on data
        minimapTable.style.gridTemplateRows = `repeat(${maxRows}, 1fr)`
        
        // Adjust grid template columns based on data
        const colCount = Math.max(1, props.columns.length)
        minimapTable.style.gridTemplateColumns = `repeat(${colCount}, 1fr)`
        
        // Add data-attributes to rows for better debugging
        const rowElements = minimapTable.querySelectorAll('.minimap-row')
        rowElements.forEach((rowEl, index) => {
          rowEl.setAttribute('data-row-index', index)
          
          // Add visual indicator for current row
          if (index === currentRowIndex.value) {
            rowEl.classList.add('current-row')
          } else {
            rowEl.classList.remove('current-row')
          }
        })
      }
    }
  })
}

// Start dragging the minimap viewport
const startMinimapDrag = (event) => {
  if (!props.scrollableElement) return
  
  event.preventDefault()
  
  // Record starting position
  minimapStartX.value = event.clientX
  minimapStartY.value = event.clientY
  minimapStartScrollX.value = props.scrollableElement.scrollLeft
  minimapStartScrollY.value = props.scrollableElement.scrollTop
  
  isDraggingMinimap.value = true
  
  // Add event listeners for drag and end events
  document.addEventListener('mousemove', onMinimapDrag)
  document.addEventListener('mouseup', stopMinimapDrag)
}

// Start dragging the minimap viewport (touch events)
const startMinimapTouchDrag = (event) => {
  if (!props.scrollableElement) return
  
  // Record starting position
  minimapStartX.value = event.touches[0].clientX
  minimapStartY.value = event.touches[0].clientY
  minimapStartScrollX.value = props.scrollableElement.scrollLeft
  minimapStartScrollY.value = props.scrollableElement.scrollTop
  
  isDraggingMinimap.value = true
  
  // Add event listeners for touch drag and end events
  document.addEventListener('touchmove', onMinimapDrag, { passive: true })
  document.addEventListener('touchend', stopMinimapDrag)
}

// Handle minimap dragging
const onMinimapDrag = (event) => {
  if (!isDraggingMinimap.value || !minimapContent.value || !props.scrollableElement) return
  
  // Get current position
  let clientX, clientY
  if (event.type === 'touchmove') {
    clientX = event.touches[0].clientX
    clientY = event.touches[0].clientY
  } else {
    clientX = event.clientX
    clientY = event.clientY
  }
  
  // Calculate the distance moved in minimap scale
  const deltaX = clientX - minimapStartX.value
  const deltaY = clientY - minimapStartY.value
  
  // Convert minimap movement to table scroll
  const scrollX = minimapStartScrollX.value + (deltaX / minimapScale.value.x)
  const scrollY = minimapStartScrollY.value + (deltaY / minimapScale.value.y)
  
  // Update scroll position
  props.scrollableElement.scrollLeft = scrollX
  props.scrollableElement.scrollTop = scrollY
  
  // Update minimap viewport
  updateMinimapViewport()
}

const stopMinimapDrag = () => {
  isDraggingMinimap.value = false
  
  // Remove event listeners
  document.removeEventListener('mousemove', onMinimapDrag)
  document.removeEventListener('mouseup', stopMinimapDrag)
  document.removeEventListener('touchmove', onMinimapDrag)
  document.removeEventListener('touchend', stopMinimapDrag)
}

// Zoom to fit the entire table in the viewport
const zoomToFit = () => {
  if (!props.scrollableElement) return
  
  // Reset scroll position to show the beginning of the table
  props.scrollableElement.scrollLeft = 0
  props.scrollableElement.scrollTop = 0
  
  // Update minimap viewport
  updateMinimapViewport()
}

const toggleMinimap = () => {
  emit('update:visible', !props.visible)
}

// Jump to a position in the table when clicking on the minimap
const jumpToPosition = (event) => {
  if (!props.scrollableElement || !minimapContent.value) return
  
  const minimap = minimapContent.value
  const minimapRect = minimap.getBoundingClientRect()
  
  // Calculate relative position within the minimap
  const relativeX = (event.clientX - minimapRect.left) / minimapRect.width
  const relativeY = (event.clientY - minimapRect.top) / minimapRect.height
  
  // Calculate target scroll position
  const targetScrollLeft = relativeX * (props.scrollableElement.scrollWidth - props.scrollableElement.clientWidth)
  const targetScrollTop = relativeY * (props.scrollableElement.scrollHeight - props.scrollableElement.clientHeight)
  
  // Scroll to the target position
  props.scrollableElement.scrollLeft = targetScrollLeft
  props.scrollableElement.scrollTop = targetScrollTop
  
  // Update minimap viewport
  updateMinimapViewport()
}

// Scroll to the top of the table
const scrollToTop = () => {
  if (!props.scrollableElement) return
  
  props.scrollableElement.scrollTop = 0
  updateMinimapViewport()
}

// Scroll to the bottom of the table
const scrollToBottom = () => {
  if (!props.scrollableElement) return
  
  props.scrollableElement.scrollTop = props.scrollableElement.scrollHeight
  updateMinimapViewport()
}

// Watch for changes that might affect table dimensions
watch(() => props.rows, () => {
  updateMinimapRows()
}, { deep: true })

watch(() => props.columns, () => {
  updateMinimapRows()
}, { deep: true })

watch(() => props.visible, (newValue) => {
  if (newValue) {
    // Update minimap when shown
    nextTick(() => {
      updateMinimapRows()
      updateMinimapViewport()
      
      // Initialize scroll indicators
      horizontalScrollIndicator.value = minimapContainer.value.querySelector('.horizontal-scroll-indicator')
      verticalScrollIndicator.value = minimapContainer.value.querySelector('.vertical-scroll-indicator')
      updateScrollIndicators()
    })
  }
})

// Handle scroll events from the parent component
const handleTableScroll = () => {
  if (!props.scrollableElement || !props.visible) return
  
  updateMinimapViewport()
  
  // Update current row indicator
  const prevRowIndex = currentRowIndex.value
  
  // If the row index changed, update the row indicators
  if (prevRowIndex !== currentRowIndex.value) {
    nextTick(() => {
      const minimapTable = minimapContent.value?.querySelector('.minimap-table')
      if (minimapTable) {
        const rowElements = minimapTable.querySelectorAll('.minimap-row')
        
        // Remove current-row class from all rows
        rowElements.forEach(row => row.classList.remove('current-row'))
        
        // Add current-row class to the current row
        if (currentRowIndex.value >= 0 && currentRowIndex.value < rowElements.length) {
          rowElements[currentRowIndex.value].classList.add('current-row')
        }
      }
    })
  }
}

// Initialize component
onMounted(() => {
  if (props.visible) {
    updateMinimapRows()
    
    // Initialize scroll indicators after the DOM is updated
    nextTick(() => {
      horizontalScrollIndicator.value = minimapContainer.value.querySelector('.horizontal-scroll-indicator')
      verticalScrollIndicator.value = minimapContainer.value.querySelector('.vertical-scroll-indicator')
      updateMinimapViewport()
    })
  }
  
  // Add window resize listener
  window.addEventListener('resize', updateMinimapViewport)
})

// Clean up event listeners
onBeforeUnmount(() => {
  // Remove window event listeners
  window.removeEventListener('resize', updateMinimapViewport)
  
  // Remove document event listeners
  document.removeEventListener('mousemove', onMinimapDrag)
  document.removeEventListener('mouseup', stopMinimapDrag)
  document.removeEventListener('touchmove', onMinimapDrag)
  document.removeEventListener('touchend', stopMinimapDrag)
})

// Expose methods to parent component
defineExpose({
  updateMinimapViewport,
  handleTableScroll,
  scrollToTop,
  scrollToBottom,
  zoomToFit
})
</script>

<template>
  <div>
    <!-- Table Minimap Navigation -->
    <div 
      ref="minimapContainer" 
      class="table-minimap-container"
      :class="{ 'visible': visible }"
    >
      <div class="minimap-header">
        <div class="d-flex align-center">
          <v-icon icon="mdi-table-search" size="small" class="mr-2"></v-icon>
          <span>Table Navigation</span>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="toggleMinimap"
          class="close-btn"
        ></v-btn>
      </div>
      
      <div class="minimap-content" ref="minimapContent">
        <!-- Miniature representation of the table -->
        <div class="minimap-table">
          <div 
            v-for="(col, colIndex) in columns" 
            :key="'col-' + colIndex"
            class="minimap-column"
            :style="{ width: `${100 / columns.length}%` }"
          ></div>
          
          <div 
            v-for="(row, rowIndex) in minimapRows" 
            :key="'row-' + rowIndex"
            class="minimap-row"
            :data-row-index="rowIndex"
            :class="{ 'current-row': rowIndex === currentRowIndex }"
          ></div>
        </div>
        
        <!-- Viewport indicator -->
        <div 
          ref="minimapViewport" 
          class="minimap-viewport"
          @mousedown.prevent="startMinimapDrag"
          @touchstart.passive="startMinimapTouchDrag"
        >
          <div class="minimap-viewport-handle"></div>
        </div>
        
        <!-- Click anywhere on the minimap to jump to that position -->
        <div 
          class="minimap-click-area"
          @click="jumpToPosition"
        ></div>
        
        <!-- Scroll position indicators -->
        <div class="scroll-indicators">
          <div class="horizontal-scroll-indicator"></div>
          <div class="vertical-scroll-indicator"></div>
        </div>
      </div>
      
      <div class="minimap-info">
        <div class="info-item">
          <span class="info-label">Columns:</span>
          <span class="info-value">{{ columns.length }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Rows:</span>
          <span class="info-value">{{ rows.length }}</span>
        </div>
      </div>
      
      <div class="minimap-stats" v-if="visible">
        <div class="stats-item">
          <span class="stats-label">Visible:</span>
          <span class="stats-value">{{ visibleRows }} rows × {{ visibleColumns }} cols</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">Position:</span>
          <span class="stats-value">{{ verticalScrollPosition }}% down, {{ horizontalScrollPosition }}% across</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">Current:</span>
          <span class="stats-value">Row {{ currentRowIndex + 1 }}, Col {{ currentColIndex + 1 }}</span>
        </div>
      </div>
      
      <!-- Debug information -->
      <div class="debug-info" v-if="debug && visible">
        <div class="debug-header">Debug Information</div>
        <div class="debug-item">
          <span class="debug-label">Table Scroll Size:</span>
          <span class="debug-value">{{ debugInfo.tableScrollWidth }}×{{ debugInfo.tableScrollHeight }}px</span>
        </div>
        <div class="debug-item">
          <span class="debug-label">Table Client Size:</span>
          <span class="debug-value">{{ debugInfo.tableClientWidth }}×{{ debugInfo.tableClientHeight }}px</span>
        </div>
        <div class="debug-item">
          <span class="debug-label">Row/Col Count:</span>
          <span class="debug-value">{{ debugInfo.rowCount }} rows, {{ debugInfo.colCount }} cols</span>
        </div>
        <div class="debug-item">
          <span class="debug-label">Avg Row Height:</span>
          <span class="debug-value">{{ debugInfo.avgRowHeight.toFixed(2) }}px</span>
        </div>
        <div class="debug-item">
          <span class="debug-label">Avg Col Width:</span>
          <span class="debug-value">{{ debugInfo.avgColWidth.toFixed(2) }}px</span>
        </div>
        <div class="debug-item">
          <span class="debug-label">Scale:</span>
          <span class="debug-value">X: {{ debugInfo.scaleX.toFixed(4) }}, Y: {{ debugInfo.scaleY.toFixed(4) }}</span>
        </div>
      </div>
      
      <div class="minimap-footer">
        <v-btn
          size="small"
          variant="text"
          color="primary"
          @click="zoomToFit"
          class="zoom-btn mr-2"
        >
          <v-icon start size="small">mdi-fit-to-page</v-icon>
          Fit to View
        </v-btn>
        
        <v-btn
          size="small"
          variant="text"
          color="primary"
          @click="scrollToTop"
          class="zoom-btn mr-2"
        >
          <v-icon start size="small">mdi-arrow-up-bold</v-icon>
          Top
        </v-btn>
        
        <v-btn
          size="small"
          variant="text"
          color="primary"
          @click="scrollToBottom"
          class="zoom-btn"
        >
          <v-icon start size="small">mdi-arrow-down-bold</v-icon>
          Bottom
        </v-btn>
      </div>
    </div>
    
    <!-- Minimap toggle button (fixed position) -->
    <v-btn
      icon="mdi-map"
      color="primary"
      size="large"
      fab
      elevation="4"
      class="minimap-toggle-btn"
      @click="toggleMinimap"
    >
      <v-tooltip activator="parent" location="left">
        Table Navigation Map
      </v-tooltip>
    </v-btn>
  </div>
</template>

<style scoped>
/* Table Minimap styles */
.minimap-toggle-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9998;
}

.table-minimap-container {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 300px;
  height: 320px; /* Increased height to accommodate new elements */
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  opacity: 0;
  transform: translateY(20px) scale(0.95);
  pointer-events: none;
  transition: opacity 0.3s, transform 0.3s;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.table-minimap-container.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

.minimap-header {
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.7);
}

.minimap-content {
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: #fafafa;
  border: 1px solid rgba(0, 0, 0, 0.05);
  margin: 8px;
  border-radius: 4px;
}

/* Add vertical scroll indicator */
.minimap-content::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 2px;
  pointer-events: none;
}

.minimap-table {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(5px, 1fr));
  grid-template-rows: repeat(auto-fit, minmax(3px, 1fr));
  background: 
    repeating-linear-gradient(
      to right,
      rgba(0, 0, 0, 0.02) 0px,
      rgba(0, 0, 0, 0.02) 1px,
      transparent 1px,
      transparent 20px
    ),
    repeating-linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.02) 0px,
      rgba(0, 0, 0, 0.02) 1px,
      transparent 1px,
      transparent 20px
    );
}

.minimap-column {
  height: 100%;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}

.minimap-row {
  width: 100%;
  height: 3px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background-color: rgba(0, 0, 0, 0.01);
}

/* Add alternating row colors for better visibility */
.minimap-row:nth-child(even) {
  background-color: rgba(0, 0, 0, 0.03);
}

/* Highlight header row */
.minimap-row:first-child {
  background-color: rgba(25, 118, 210, 0.1);
  height: 5px;
  border-bottom: 1px solid rgba(25, 118, 210, 0.2);
}

/* Highlight current row */
.minimap-row.current-row {
  background-color: rgba(25, 118, 210, 0.3);
  height: 4px;
  border-bottom: 1px solid rgba(25, 118, 210, 0.5);
  position: relative;
}

/* Add a marker for the current row */
.minimap-row.current-row::after {
  content: '';
  position: absolute;
  left: -5px;
  top: 0;
  width: 5px;
  height: 100%;
  background-color: rgba(25, 118, 210, 0.8);
  border-radius: 0 2px 2px 0;
}

.minimap-viewport {
  position: absolute;
  background-color: rgba(25, 118, 210, 0.15);
  border: 2px solid rgba(25, 118, 210, 0.7);
  cursor: move;
  border-radius: 4px;
  box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.1);
  transition: background-color 0.2s;
  z-index: 2;
}

.minimap-viewport:hover {
  background-color: rgba(25, 118, 210, 0.25);
}

.minimap-viewport:active {
  background-color: rgba(25, 118, 210, 0.3);
  border-color: rgba(25, 118, 210, 0.8);
}

.minimap-viewport-handle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: rgba(25, 118, 210, 0.8);
  border: 2px solid white;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
}

.minimap-click-area {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  cursor: crosshair;
}

.scroll-indicators {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 3;
}

.horizontal-scroll-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 0%;
  background-color: rgba(25, 118, 210, 0.7);
  border-radius: 0 3px 3px 0;
}

.vertical-scroll-indicator {
  position: absolute;
  top: 0;
  right: 0;
  width: 3px;
  height: 0%;
  background-color: rgba(25, 118, 210, 0.7);
  border-radius: 0 0 3px 3px;
}

.minimap-info {
  padding: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  background-color: #f5f5f5;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-label {
  margin-right: 4px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
}

.info-value {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.minimap-stats {
  padding: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 4px;
  background-color: #f5f5f5;
  font-size: 11px;
}

.stats-item {
  display: flex;
  align-items: center;
}

.stats-label {
  margin-right: 4px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
  width: 60px;
}

.stats-value {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 10px;
}

.minimap-footer {
  padding: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  background-color: #f5f5f5;
}

.zoom-btn {
  font-size: 11px;
}

/* Debug styles */
.debug-info {
  padding: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  background-color: #fff3e0;
  font-size: 10px;
  max-height: 200px;
  overflow-y: auto;
}

.debug-header {
  font-weight: bold;
  margin-bottom: 4px;
  color: #e65100;
}

.debug-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
}

.debug-label {
  font-weight: 500;
  color: #e65100;
}

.debug-value {
  font-family: monospace;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 1px 4px;
  border-radius: 2px;
}
</style> 