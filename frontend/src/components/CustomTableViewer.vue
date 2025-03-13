<script setup>
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import TableMinimap from './TableMinimap.vue'
import { API_BASE_URL } from '../config'

const props = defineProps({
  fileUrl: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['file-updated'])

// Table data
const rows = ref([])
const columns = ref([])
const loading = ref(true)
const error = ref(null)
const editedData = ref(null)
const saving = ref(false)
const saveSuccess = ref(false)
const saveError = ref(null)
const copySuccess = ref(false)
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

// Load CSV data
const loadCSVData = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Fetch the CSV file
    const response = await fetch(props.fileUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch CSV file')
    }
    
    const csvText = await response.text()
    const parsedData = parseCSV(csvText)
    
    // Set columns and rows
    columns.value = parsedData.columns
    rows.value = parsedData.rows
    
    return true
  } catch (err) {
    error.value = err.message
    console.error('Error loading CSV:', err)
    return false
  } finally {
    loading.value = false
  }
}

// Parse CSV data
const parseCSV = (csvText) => {
  try {
    const lines = csvText.split('\n')
    if (lines.length === 0) {
      throw new Error('CSV file is empty')
    }
    
    // Parse headers
    const headers = lines[0].split(',').map(header => header.trim())
    
    // Create column definitions
    const columnDefs = headers.map(header => ({
      label: header,
      field: header,
      sortable: true
    }))
    
    // Parse data rows
    const parsedData = []
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue
      
      const values = lines[i].split(',')
      const row = {}
      
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j] ? values[j].trim() : ''
      }
      
      parsedData.push(row)
    }
    
    return {
      columns: columnDefs,
      rows: parsedData
    }
  } catch (err) {
    console.error('Error parsing CSV:', err)
    throw new Error('Failed to parse CSV data: ' + err.message)
  }
}

// Convert data to CSV
const convertToCSV = (data) => {
  if (!data || data.length === 0) return ''
  
  // Get headers from columns
  const headers = columns.value.map(col => col.field)
  
  // Create CSV rows
  const csvRows = []
  
  // Add header row
  csvRows.push(headers.join(','))
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header]
      // Handle values with commas by wrapping in quotes
      return typeof val === 'string' && val.includes(',') ? `"${val}"` : val
    })
    csvRows.push(values.join(','))
  }
  
  return csvRows.join('\n')
}

// Save changes
const saveChanges = async () => {
  if (!editedData.value) {
    return // No changes to save
  }
  
  saving.value = true
  saveError.value = null
  saveSuccess.value = false
  
  try {
    // Convert data back to CSV
    const csv = convertToCSV(editedData.value)
    
    // Create a file from the CSV string
    const file = new File([csv], 'updated.csv', { type: 'text/csv' })
    
    // Create form data for upload
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileUrl', props.fileUrl)
    
    const response = await fetch(`${API_BASE_URL}/update`, {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    
    if (response.ok) {
      saveSuccess.value = true
      // Update the rows with the edited data
      rows.value = JSON.parse(JSON.stringify(editedData.value))
      editedData.value = null
      
      // Format the file URL to include the API base URL if it's a relative path
      if (result.fileUrl && result.fileUrl.startsWith('/')) {
        result.fileUrl = `${API_BASE_URL}${result.fileUrl}`
      }
      
      // Emit the updated file event
      emit('file-updated', result)
    } else {
      saveError.value = result.error || 'Failed to save changes'
    }
  } catch (err) {
    saveError.value = err.message || 'An error occurred while saving changes'
    console.error('Error saving changes:', err)
  } finally {
    saving.value = false
  }
}

// Discard changes
const discardChanges = () => {
  editedData.value = null
}

// Check if there are unsaved changes
const hasUnsavedChanges = () => {
  return !!editedData.value
}

// Copy URL to clipboard
const copyFileUrl = async () => {
  try {
    if (props.fileUrl) {
      await navigator.clipboard.writeText(props.fileUrl)
      copySuccess.value = true
      setTimeout(() => {
        copySuccess.value = false
      }, 2000)
    }
  } catch (err) {
    console.error('Failed to copy URL to clipboard:', err)
    // Fallback method for browsers that don't support clipboard API
    const textArea = document.createElement('textarea')
    textArea.value = props.fileUrl
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  }
}

// Start cell editing
const startEditing = (row, column, rowIndex, colIndex) => {
  currentEditCell.value = { row, column, rowIndex, colIndex }
  editValue.value = row[column.field]
}

// Save cell edit
const saveEdit = () => {
  if (!currentEditCell.value) return
  
  const { row, column, rowIndex } = currentEditCell.value
  
  // Create a deep copy of rows if not already created
  if (!editedData.value) {
    editedData.value = JSON.parse(JSON.stringify(rows.value))
  }
  
  // Update the value
  editedData.value[rowIndex][column.field] = editValue.value
  
  // Update the displayed rows to show the change
  const updatedRows = JSON.parse(JSON.stringify(rows.value))
  updatedRows[rowIndex][column.field] = editValue.value
  rows.value = updatedRows
  
  // Reset edit state
  currentEditCell.value = null
  editValue.value = ''
}

// Cancel cell edit
const cancelEdit = () => {
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
watch(() => rows.value, () => {
  checkTableOverflow()
}, { deep: true })

watch(() => columns.value, () => {
  checkTableOverflow()
}, { deep: true })

// Watch for changes to the fileUrl prop
watch(() => props.fileUrl, (newUrl, oldUrl) => {
  if (newUrl && newUrl !== oldUrl) {
    // Reset state
    editedData.value = null
    saveSuccess.value = false
    saveError.value = null
    
    // Load new data
    loadCSVData().then(() => {
      // Check for overflow after data is loaded
      nextTick(() => {
        checkTableOverflow()
      })
    })
  }
}, { immediate: false })

// Initialize component
onMounted(() => {
  if (props.fileUrl) {
    loadCSVData().then(() => {
      nextTick(() => {
        // Set scrollable element reference
        scrollableElement.value = tableContainer.value.querySelector('.scrollable-table')
        
        // Add scroll event listener
        if (scrollableElement.value) {
          scrollableElement.value.addEventListener('scroll', handleTableScroll)
        }
        
        // Check for overflow
        checkTableOverflow()
        
        // Add a small delay to ensure the table is fully rendered
        setTimeout(() => {
          if (minimapRef.value) {
            minimapRef.value.updateMinimapViewport()
          }
        }, 500)
      })
    })
  }
  
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
</script>

<template>
  <div>
    <v-card width="100%">
      <v-card-title class="text-h5">
        <v-icon start icon="mdi-table-edit" class="mr-2"></v-icon>
        CSV Viewer & Editor
      </v-card-title>
      
      <v-card-text>
        <!-- Display current file URL -->
        <v-card variant="outlined" class="mb-4 pa-2" v-if="props.fileUrl">
          <div class="d-flex align-center">
            <v-icon icon="mdi-link-variant" color="primary" class="mr-2"></v-icon>
            <div class="text-subtitle-2 mr-2">Current File:</div>
            <code class="flex-grow-1 url-code">{{ props.fileUrl }}</code>
            <v-btn
              icon="mdi-content-copy"
              variant="text"
              size="small"
              @click="copyFileUrl"
              :color="copySuccess ? 'success' : ''"
            >
              <v-icon>{{ copySuccess ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
            </v-btn>
          </div>
        </v-card>
        
        <div v-if="loading" class="text-center py-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <div class="mt-2">Loading CSV data...</div>
        </div>
        
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          {{ error }}
        </v-alert>
        
        <v-alert
          v-if="saveSuccess"
          type="success"
          variant="tonal"
          class="mb-4"
        >
          Changes saved successfully!
        </v-alert>
        
        <v-alert
          v-if="saveError"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          {{ saveError }}
        </v-alert>
        
        <div v-if="!loading && !error">
          <v-alert
            type="info"
            variant="tonal"
            class="mb-4"
            icon="mdi-information"
          >
            Click on any cell to edit its content. Changes will be highlighted and must be saved using the "Save Changes" button.
          </v-alert>
          
          <div 
            ref="tableContainer" 
            class="table-container" 
            :class="{ 
              'has-horizontal-overflow': hasHorizontalOverflow,
              'has-vertical-overflow': hasVerticalOverflow 
            }"
          >
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="table-actions" v-if="hasUnsavedChanges()">
                <v-chip color="warning" class="mr-2">
                  Unsaved Changes
                </v-chip>
              </div>
              
              <v-btn
                v-if="rows.length > 10"
                color="info"
                variant="text"
                size="small"
                @click="toggleMinimapDebug"
                class="ml-auto"
              >
                <v-icon start>{{ enableMinimapDebug ? 'mdi-bug-check' : 'mdi-bug' }}</v-icon>
                {{ enableMinimapDebug ? 'Disable Debug' : 'Enable Debug' }}
              </v-btn>
            </div>
            
            <!-- Custom Table Implementation -->
            <div class="scrollable-table">
              <table>
                <thead>
                  <tr>
                    <th v-for="(column, colIndex) in columns" :key="colIndex">
                      {{ column.label }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, rowIndex) in rows" :key="rowIndex">
                    <td 
                      v-for="(column, colIndex) in columns" 
                      :key="colIndex"
                      @click="startEditing(row, column, rowIndex, colIndex)"
                      class="editable-cell"
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
            
            <!-- Scroll indicators -->
            <div class="scroll-indicator horizontal" v-if="hasHorizontalOverflow">
              <v-icon icon="mdi-gesture-swipe-horizontal" size="small" class="mr-1"></v-icon>
              <span class="text-caption">Scroll horizontally to see more columns</span>
            </div>
            
            <div class="scroll-indicator vertical" v-if="hasVerticalOverflow">
              <v-icon icon="mdi-gesture-swipe-vertical" size="small" class="mr-1"></v-icon>
              <span class="text-caption">Scroll vertically to see more rows</span>
            </div>
          </div>
        </div>
      </v-card-text>
      
      <v-card-actions>
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
          class="mr-auto"
        >
          <v-icon start>mdi-arrow-down-bold</v-icon>
          Bottom
        </v-btn>
        
        <v-spacer></v-spacer>
        
        <v-btn
          v-if="hasUnsavedChanges()"
          color="error"
          variant="outlined"
          @click="discardChanges"
          class="mr-2"
        >
          Discard Changes
        </v-btn>
        
        <v-btn
          color="primary"
          :loading="saving"
          :disabled="!hasUnsavedChanges()"
          @click="saveChanges"
        >
          <v-icon start icon="mdi-content-save"></v-icon>
          Save Changes
        </v-btn>
      </v-card-actions>
    </v-card>
    
    <!-- Table Minimap Component -->
    <TableMinimap
      ref="minimapRef"
      :scrollable-element="scrollableElement"
      :rows="rows"
      :columns="columns"
      :visible="showMinimap"
      :debug="enableMinimapDebug"
      @update:visible="showMinimap = $event"
    />
    
    <!-- Minimap toggle button -->
    <v-btn
      v-if="(hasHorizontalOverflow || hasVerticalOverflow) && scrollableElement"
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
.table-container {
  position: relative;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 16px;
}

.scrollable-table {
  overflow: auto;
  max-height: 500px;
  width: 100%;
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

tr:nth-child(even) {
  background-color: #f9f9f9;
}

.editable-cell {
  cursor: pointer;
  position: relative;
}

.editable-cell:hover {
  background-color: rgba(25, 118, 210, 0.05);
}

.editable-cell:hover::after {
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

.url-code {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
}

.scroll-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.75rem;
  padding: 4px;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
}

.scroll-indicator.vertical {
  margin-top: 0;
  margin-bottom: 8px;
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

/* Minimap toggle button */
.minimap-toggle-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9998;
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