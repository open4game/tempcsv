<script setup>
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import { VueGoodTable } from 'vue-good-table-next'
import 'vue-good-table-next/dist/vue-good-table-next.css'
import { API_BASE_URL } from '../config'
import TableMinimap from './TableMinimap.vue'

const props = defineProps({
  fileUrl: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['file-updated'])

const rows = ref([])
const columns = ref([])
const loading = ref(true)
const error = ref(null)
const editedData = ref(null)
const saving = ref(false)
const saveSuccess = ref(false)
const saveError = ref(null)
const copySuccess = ref(false)

// Table options
const tableOptions = ref({
  editable: true,
  editableCellStyle: {
    backgroundColor: '#f9f9f9',
    border: '1px dashed #1976D2',
  },
  rowStyleClass: 'row-style',
  pagination: {
    enabled: true,
    perPage: 10
  },
  search: {
    enabled: true,
    placeholder: 'Search...'
  },
  sort: {
    enabled: true,
    multipleColumns: true
  }
})

// Table Minimap Navigation
const showMinimap = ref(false)
const minimapRef = ref(null)

// Handle cell edit
const onCellChanged = (params) => {
  const { row, column, rowIndex, event } = params
  
  // Skip if the column is not editable
  if (!column.isEditable) return
  
  // Create a deep copy of rows if not already created
  if (!editedData.value) {
    editedData.value = JSON.parse(JSON.stringify(rows.value))
  }
  
  // Prompt the user for a new value
  const currentValue = row[column.field]
  const newValue = prompt(`Edit value for ${column.label}:`, currentValue)
  
  // Update the value if the user provided one
  if (newValue !== null && newValue !== currentValue) {
    editedData.value[rowIndex][column.field] = newValue
    
    // Update the displayed rows to show the change
    // This is a workaround since Vue Good Table doesn't update the UI automatically
    const updatedRows = JSON.parse(JSON.stringify(rows.value))
    updatedRows[rowIndex][column.field] = newValue
    rows.value = updatedRows
  }
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
    columns.value = headers.map(header => ({
      label: header,
      field: header,
      sortable: true,
      type: 'string',
      tdClass: 'editable-cell',
      thClass: 'header-cell',
      // Explicitly enable editing for this column
      isEditable: true
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
    
    return parsedData
  } catch (err) {
    console.error('Error parsing CSV:', err)
    throw new Error('Failed to parse CSV data: ' + err.message)
  }
}

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
    rows.value = parseCSV(csvText)
    return true
  } catch (err) {
    error.value = err.message
    console.error('Error loading CSV:', err)
    return false
  } finally {
    loading.value = false
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

// Check for table overflow
const tableContainer = ref(null)
const vgtTable = ref(null)
const hasHorizontalOverflow = ref(false)
const floatingScrollbar = ref(null)
const scrollableElement = ref(null)
const scrollTimeout = ref(null)

const checkTableOverflow = () => {
  nextTick(() => {
    if (tableContainer.value) {
      const container = tableContainer.value
      scrollableElement.value = container.querySelector('.vgt-responsive')
      
      if (scrollableElement.value) {
        const hasHorizOverflow = scrollableElement.value.scrollWidth > scrollableElement.value.clientWidth
        const hasVertOverflow = scrollableElement.value.scrollHeight > scrollableElement.value.clientHeight
        
        hasHorizontalOverflow.value = hasHorizOverflow || hasVertOverflow
        
        if (hasHorizOverflow || hasVertOverflow) {
          updateScrollbarDimensions()
          updateScrollbarPosition()
        }
      }
    }
  })
}

const updateScrollbarDimensions = () => {
  if (!scrollableElement.value || !floatingScrollbar.value) return
  
  const scrollable = scrollableElement.value
  const scrollbarWidth = floatingScrollbar.value.clientWidth
  
  // Calculate thumb width based on the ratio of visible width to total width
  const ratio = scrollable.clientWidth / scrollable.scrollWidth
  thumbWidth.value = Math.max(40, Math.floor(scrollbarWidth * ratio))
  
  // Update thumb position
  updateThumbPosition()
}

const updateThumbPosition = () => {
  if (!scrollableElement.value || !floatingScrollbar.value) return
  
  const scrollable = scrollableElement.value
  const scrollbarWidth = floatingScrollbar.value.clientWidth
  
  // Calculate the maximum position for the thumb
  const maxThumbPosition = scrollbarWidth - thumbWidth.value
  
  // Calculate the scroll ratio
  const scrollRatio = scrollable.scrollLeft / (scrollable.scrollWidth - scrollable.clientWidth)
  
  // Calculate the new thumb position
  thumbPosition.value = Math.floor(scrollRatio * maxThumbPosition)
}

const updateScrollbarPosition = () => {
  if (!tableContainer.value || !floatingScrollbar.value) return
  
  // Get the table container's position
  const tableRect = tableContainer.value.getBoundingClientRect()
  
  // Position the scrollbar at the bottom of the viewport
  // but within the visible area of the table if possible
  const viewportHeight = window.innerHeight
  const scrollbarHeight = floatingScrollbar.value.offsetHeight
  
  // Calculate the ideal position - at the bottom of the viewport
  let bottom = 20
  
  // If the table is visible in the viewport, position relative to it
  if (tableRect.bottom > 0 && tableRect.top < viewportHeight) {
    // If the table bottom is in view, position just above it
    if (tableRect.bottom < viewportHeight) {
      bottom = viewportHeight - tableRect.bottom + 10
    }
  }
  
  // Update the scrollbar position
  floatingScrollbar.value.style.bottom = `${bottom}px`
}

// Handle table scroll
const handleTableScroll = (event) => {
  if (hasHorizontalOverflow.value) {
    // Update thumb position for horizontal scrollbar (if still using it)
    updateThumbPosition()
    updateScrollbarPosition()
    
    // Show the floating scrollbar
    showFloatingScrollbar.value = true
    
    // Hide the scrollbar after a delay
    clearTimeout(scrollTimeout.value)
    scrollTimeout.value = setTimeout(() => {
      if (!isDragging.value) {
        showFloatingScrollbar.value = false
      }
    }, 1500)
  }
  
  // Update minimap viewport if visible
  if (showMinimap.value && minimapRef.value) {
    minimapRef.value.handleTableScroll()
  }
}

const startDrag = (event) => {
  // Prevent default behavior to avoid text selection
  // event.preventDefault() - now handled by the .prevent modifier
  
  // Get the initial position
  startX.value = event.clientX
  startLeft.value = thumbPosition.value
  isDragging.value = true
  
  // Add event listeners for drag and end events
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

const startTouchDrag = (event) => {
  // Get the initial position from touch event
  startX.value = event.touches[0].clientX
  startLeft.value = thumbPosition.value
  isDragging.value = true
  
  // Add event listeners for touch drag and end events
  document.addEventListener('touchmove', onDrag, { passive: true })
  document.addEventListener('touchend', stopDrag)
}

const onDrag = (event) => {
  if (!isDragging.value || !scrollableElement.value || !floatingScrollbar.value) return
  
  // Calculate the distance moved
  let clientX
  if (event.type === 'touchmove') {
    clientX = event.touches[0].clientX
  } else {
    clientX = event.clientX
  }
  
  const deltaX = clientX - startX.value
  
  // Calculate the new thumb position
  const scrollbarWidth = floatingScrollbar.value.clientWidth
  const maxThumbPosition = scrollbarWidth - thumbWidth.value
  let newPosition = Math.max(0, Math.min(maxThumbPosition, startLeft.value + deltaX))
  
  // Update thumb position
  thumbPosition.value = newPosition
  
  // Calculate the scroll position based on the thumb position
  const scrollRatio = newPosition / maxThumbPosition
  const newScrollLeft = scrollRatio * (scrollableElement.value.scrollWidth - scrollableElement.value.clientWidth)
  
  // Update the scroll position
  scrollableElement.value.scrollLeft = newScrollLeft
}

const stopDrag = () => {
  isDragging.value = false
  
  // Remove event listeners
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
  
  // Hide the scrollbar after a delay
  clearTimeout(scrollTimeout.value)
  scrollTimeout.value = setTimeout(() => {
    showFloatingScrollbar.value = false
  }, 1500)
}

// Show the floating scrollbar when hovering over the table
const showScrollbarOnHover = () => {
  if (hasHorizontalOverflow.value) {
    updateScrollbarPosition()
    showFloatingScrollbar.value = true
    
    // Add event listener to hide the scrollbar when mouse leaves
    document.addEventListener('mousemove', checkMousePosition)
  }
}

const checkMousePosition = (event) => {
  if (!floatingScrollbar.value || isDragging.value) return
  
  const scrollbarRect = floatingScrollbar.value.getBoundingClientRect()
  const tableRect = tableContainer.value.getBoundingClientRect()
  
  // Check if mouse is over the table or the scrollbar
  const isOverTable = (
    event.clientX >= tableRect.left &&
    event.clientX <= tableRect.right &&
    event.clientY >= tableRect.top &&
    event.clientY <= tableRect.bottom
  )
  
  const isOverScrollbar = (
    event.clientX >= scrollbarRect.left &&
    event.clientX <= scrollbarRect.right &&
    event.clientY >= scrollbarRect.top &&
    event.clientY <= scrollbarRect.bottom
  )
  
  if (!isOverTable && !isOverScrollbar) {
    showFloatingScrollbar.value = false
    document.removeEventListener('mousemove', checkMousePosition)
  }
}

// Watch for changes that might affect table width
watch(() => rows.value, () => {
  checkTableOverflow()
}, { deep: true })

watch(() => columns.value, () => {
  checkTableOverflow()
}, { deep: true })

// Initialize component
onMounted(() => {
  if (props.fileUrl) {
    loadCSVData().then(() => {
      checkTableOverflow()
    })
  }
  
  // Add window resize listener to check overflow
  window.addEventListener('resize', () => {
    checkTableOverflow()
    updateScrollbarDimensions()
    updateScrollbarPosition()
  })
  
  // Add window scroll listener to update scrollbar position
  window.addEventListener('scroll', updateScrollbarPosition)
  
  // Add event listener to show scrollbar on hover
  if (tableContainer.value) {
    tableContainer.value.addEventListener('mouseenter', showScrollbarOnHover)
  }
  
  // Add scroll event listener to the scrollable element
  nextTick(() => {
    if (tableContainer.value) {
      const scrollable = tableContainer.value.querySelector('.vgt-responsive')
      if (scrollable) {
        scrollableElement.value = scrollable
        scrollable.addEventListener('scroll', handleTableScroll)
        
        // Show the scrollbar initially if there's overflow
        if (scrollable.scrollWidth > scrollable.clientWidth) {
          showFloatingScrollbar.value = true
          // Hide after a delay
          setTimeout(() => {
            showFloatingScrollbar.value = false
          }, 3000)
        }
      }
    }
  })
})

// Watch for changes to the fileUrl prop
watch(() => props.fileUrl, (newUrl, oldUrl) => {
  if (newUrl && newUrl !== oldUrl) {
    // Reset state
    editedData.value = null
    saveSuccess.value = false
    saveError.value = null
    
    // Load new data
    loadCSVData().then(() => {
      // Set up scroll event listener after data is loaded
      nextTick(() => {
        if (tableContainer.value) {
          const scrollable = tableContainer.value.querySelector('.vgt-responsive')
          if (scrollable) {
            // Remove old listener if exists
            if (scrollableElement.value) {
              scrollableElement.value.removeEventListener('scroll', handleTableScroll)
            }
            
            // Set new scrollable element and add listener
            scrollableElement.value = scrollable
            scrollable.addEventListener('scroll', handleTableScroll)
            
            // Check for overflow
            checkTableOverflow()
          }
        }
      })
    })
  }
}, { immediate: false })

// Clean up event listeners
onBeforeUnmount(() => {
  // Remove window event listeners
  window.removeEventListener('resize', () => {
    checkTableOverflow()
    updateScrollbarDimensions()
    updateScrollbarPosition()
  })
  window.removeEventListener('scroll', updateScrollbarPosition)
  
  // Remove document event listeners
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
  document.removeEventListener('mousemove', checkMousePosition)
  
  // Remove element event listeners
  if (tableContainer.value) {
    tableContainer.value.removeEventListener('mouseenter', showScrollbarOnHover)
  }
  
  if (scrollableElement.value) {
    scrollableElement.value.removeEventListener('scroll', handleTableScroll)
  }
  
  // Clear any pending timeouts
  clearTimeout(scrollTimeout.value)
})

// Add a button to manually show the scrollbar and make it more prominent
const toggleScrollbar = () => {
  showFloatingScrollbar.value = !showFloatingScrollbar.value
}

const scrollToTop = () => {
  if (!scrollableElement.value) return
  
  // Scroll to the top of the table
  scrollableElement.value.scrollTop = 0
  
  // Update minimap viewport if visible
  if (minimapRef.value) {
    minimapRef.value.updateMinimapViewport()
  }
}

// Scroll to bottom function
const scrollToBottom = () => {
  if (!scrollableElement.value) return
  
  // Scroll to the bottom of the table
  scrollableElement.value.scrollTop = scrollableElement.value.scrollHeight
  
  // Update minimap viewport if visible
  if (minimapRef.value) {
    minimapRef.value.updateMinimapViewport()
  }
}

// Toggle minimap visibility
const toggleMinimap = () => {
  showMinimap.value = !showMinimap.value
}
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
            class="csv-table-container" 
            :class="{ 'has-overflow': hasHorizontalOverflow }"
          >
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="table-actions" v-if="hasUnsavedChanges()">
                <v-chip color="warning" class="mr-2">
                  Unsaved Changes
                </v-chip>
              </div>
              
              <v-btn
                v-if="hasHorizontalOverflow"
                size="small"
                variant="text"
                color="primary"
                @click="toggleScrollbar"
                class="ml-auto"
              >
                <v-icon start>mdi-gesture-swipe-horizontal</v-icon>
                Scroll Horizontally
              </v-btn>
            </div>
            
            <!-- Add shadow elements for vertical scrolling -->
            <div class="horizontal-shadow"></div>
            <div class="vertical-shadow"></div>
            
            <vue-good-table
              ref="vgtTable"
              :columns="columns"
              :rows="rows"
              :options="tableOptions"
              @cell-click="onCellChanged"
              style="width: 100%"
            >
              <template #emptystate>
                <div class="empty-table">
                  No data available
                </div>
              </template>
            </vue-good-table>
            
            <div class="scroll-indicator" v-if="hasHorizontalOverflow">
              <v-icon icon="mdi-gesture-swipe-horizontal" size="small" class="mr-1"></v-icon>
              <span class="text-caption">Scroll horizontally to see more columns</span>
            </div>
            
            <!-- Add vertical scroll indicator -->
            <div class="scroll-indicator vertical" v-if="rows.length > 10">
              <v-icon icon="mdi-gesture-swipe-vertical" size="small" class="mr-1"></v-icon>
              <span class="text-caption">Scroll vertically to see more rows</span>
            </div>
          </div>
        </div>
      </v-card-text>
      
      <v-card-actions>
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
    
    <!-- Replace the old minimap code with the new component -->
    <TableMinimap
      ref="minimapRef"
      :scrollable-element="scrollableElement"
      :rows="rows"
      :columns="columns"
      :visible="showMinimap"
      @update:visible="showMinimap = $event"
    />
    
    <!-- Minimap toggle button (fixed position) -->
    <v-btn
      v-if="hasHorizontalOverflow || rows.length > 10"
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
.csv-table-container {
  width: 100%;
  overflow-x: hidden;
  position: relative;
  box-shadow: inset -10px 0 10px -10px rgba(0, 0, 0, 0.1);
}

/* Add shadow indicators for horizontal scrolling when content overflows */
.csv-table-container.has-overflow::before,
.csv-table-container.has-overflow::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 15px;
  pointer-events: none;
  z-index: 10;
}

.csv-table-container.has-overflow::before {
  left: 0;
  background: linear-gradient(to right, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0));
}

.csv-table-container.has-overflow::after {
  right: 0;
  background: linear-gradient(to left, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0));
}

/* Floating scrollbar container */
.floating-scrollbar-container {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  max-width: 1000px;
  height: 20px; /* Increased height for better visibility */
  background-color: rgba(255, 255, 255, 0.95); /* More opaque */
  border-radius: 10px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4); /* Stronger shadow */
  z-index: 9999; /* Ensure it's above everything */
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  border: 1px solid rgba(0, 0, 0, 0.2); /* Darker border */
}

/* Add a pulsing animation to make it more noticeable initially */
@keyframes pulse {
  0% { box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4); }
  50% { box-shadow: 0 3px 15px rgba(25, 118, 210, 0.6); }
  100% { box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4); }
}

.floating-scrollbar-container.visible {
  opacity: 1;
  pointer-events: auto;
  animation: pulse 2s infinite;
}

.floating-scrollbar-thumb {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: rgba(25, 118, 210, 0.7); /* Primary color with opacity */
  border-radius: 10px;
  cursor: grab;
  min-width: 50px; /* Ensure minimum size */
}

.floating-scrollbar-thumb:hover {
  background-color: rgba(25, 118, 210, 0.9);
}

.floating-scrollbar-thumb:active {
  cursor: grabbing;
  background-color: rgba(25, 118, 210, 1);
}

/* Make sure the table wrapper has a visible scrollbar at the bottom */
:deep(.vgt-responsive) {
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
  margin-bottom: 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

:deep(.vgt-responsive::-webkit-scrollbar) {
  height: 8px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

:deep(.vgt-responsive::-webkit-scrollbar-track) {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

:deep(.vgt-responsive::-webkit-scrollbar-thumb) {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  border: 2px solid rgba(0, 0, 0, 0.05);
}

:deep(.vgt-responsive::-webkit-scrollbar-thumb:hover) {
  background-color: rgba(0, 0, 0, 0.5);
}

.empty-table {
  text-align: center;
  padding: 20px;
  color: #666;
}

.table-actions {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
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

.url-code {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
}

/* Custom styles for the table */
:deep(.vgt-table) {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  width: 100%;
}

:deep(.vgt-table th) {
  background-color: #f5f5f5 !important;
  color: rgba(0, 0, 0, 0.87) !important;
  font-weight: 500;
}

:deep(.vgt-table td) {
  padding: 8px 16px;
}

:deep(.editable-cell) {
  cursor: pointer;
  position: relative;
}

:deep(.editable-cell:hover) {
  background-color: rgba(25, 118, 210, 0.05);
}

:deep(.editable-cell:hover::after) {
  content: '✏️';
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  opacity: 0.5;
}

:deep(.vgt-wrap__footer) {
  padding: 8px 16px;
  background-color: #f5f5f5;
}

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

/* Horizontal and vertical scroll shadows */
.csv-table-container.has-overflow::before,
.csv-table-container.has-overflow::after,
.csv-table-container.has-overflow .horizontal-shadow::before,
.csv-table-container.has-overflow .vertical-shadow::after {
  content: '';
  position: absolute;
  pointer-events: none;
  z-index: 10;
}

/* Left shadow */
.csv-table-container.has-overflow::before {
  left: 0;
  top: 0;
  bottom: 0;
  width: 15px;
  background: linear-gradient(to right, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0));
}

/* Right shadow */
.csv-table-container.has-overflow::after {
  right: 0;
  top: 0;
  bottom: 0;
  width: 15px;
  background: linear-gradient(to left, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0));
}

/* Top shadow */
.csv-table-container.has-overflow .horizontal-shadow::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 15px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0));
}

/* Bottom shadow */
.csv-table-container.has-overflow .vertical-shadow::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 15px;
  background: linear-gradient(to top, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0));
}

/* Add CSS for vertical scroll indicator */
.scroll-indicator.vertical {
  margin-top: 0;
  margin-bottom: 8px;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.75rem;
}
</style> 