<script setup>
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
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

// Table refs and state
const tableContainer = ref(null)
const scrollableElement = ref(null)
const showMinimap = ref(false)
const minimapRef = ref(null)
const enableMinimapDebug = ref(false)
const hasHorizontalOverflow = ref(false)
const hasVerticalOverflow = ref(false)

// Start cell editing
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

// Watch for changes that might affect table dimensions
watch(() => props.rows, () => {
  checkTableOverflow()
  // Reset edited data when rows change
  editedData.value = null
}, { deep: true })

watch(() => props.columns, () => {
  checkTableOverflow()
}, { deep: true })

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
      }, 500)
    }
  })
  
  // Add window resize listener
  window.addEventListener('resize', checkTableOverflow)
})

// Clean up event listeners
onBeforeUnmount(() => {
  // Remove window event listeners
  window.removeEventListener('resize', checkTableOverflow)
  
  // Remove scroll event listener
  if (scrollableElement.value) {
    scrollableElement.value.removeEventListener('scroll', handleTableScroll)
  }
})

// Expose methods to parent component
defineExpose({
  scrollToTop,
  scrollToBottom,
  toggleMinimap,
  toggleMinimapDebug,
  hasHorizontalOverflow,
  hasVerticalOverflow
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
      <!-- Custom Table Implementation -->
      <div class="scrollable-table">
        <table>
          <thead>
            <tr>
              <th class="row-index-header">#</th>
              <th v-for="(column, colIndex) in columns" :key="colIndex">
                {{ column.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in rows" :key="rowIndex">
              <td class="row-index">{{ rowIndex + 1 }}</td>
              <td 
                v-for="(column, colIndex) in columns" 
                :key="colIndex"
                @click="startEditing(row, column, rowIndex, colIndex)"
                class="editable-cell"
                :class="{ 'not-editable': !editable }"
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
  width: 100%;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f5f5f5;
  position: sticky;
  top: 0;
  z-index: 1;
}

/* Row index column styling */
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

.editable-cell:hover:not(.not-editable) {
  background-color: rgba(25, 118, 210, 0.05);
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