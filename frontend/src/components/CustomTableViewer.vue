<script setup>
import { ref, watch } from 'vue'
import DirectCsvFetcher from './DirectCsvFetcher.vue'
import CsvIframeViewer from './CsvIframeViewer.vue'
import CsvDirectLink from './CsvDirectLink.vue'
import CsvDataTable from './CsvDataTable.vue'
import { API_BASE_URL } from '../config'
import { saveChangesToCsv } from '../services/api'

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

// Table refs
const dataTableRef = ref(null)

// Add a flag to track if we should show the iframe viewer
const showIframeViewer = ref(false)

// Handle CSV data loaded from DirectCsvFetcher
const handleCsvLoaded = (csvText) => {
  try {
    const parsedData = parseCSV(csvText)
    
    // Set columns and rows
    columns.value = parsedData.columns
    rows.value = parsedData.rows
    
    loading.value = false
    error.value = null
  } catch (err) {
    error.value = `Error parsing CSV: ${err.message}`
    loading.value = false
  }
}

// Handle error from DirectCsvFetcher
const handleCsvError = (errorMessage) => {
  error.value = errorMessage
  loading.value = false
  
  // If we couldn't load the CSV data, show the iframe viewer as a last resort
  showIframeViewer.value = true
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
    const csvContent = convertToCSV(editedData.value)
    
    // Use the direct API service to save changes
    const result = await saveChangesToCsv(props.fileUrl, csvContent)
    
    saveSuccess.value = true
    // Update the rows with the edited data
    rows.value = JSON.parse(JSON.stringify(editedData.value))
    editedData.value = null
    
    // Emit the updated file event
    emit('file-updated', result)
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

// Handle cell edited event from CsvDataTable
const handleCellEdited = (editInfo) => {
  editedData.value = editInfo.editedData
}

// Scroll to top function
const scrollToTop = () => {
  if (dataTableRef.value) {
    dataTableRef.value.scrollToTop()
  }
}

// Scroll to bottom function
const scrollToBottom = () => {
  if (dataTableRef.value) {
    dataTableRef.value.scrollToBottom()
  }
}

// Watch for changes to the fileUrl prop
watch(() => props.fileUrl, (newUrl, oldUrl) => {
  if (newUrl && newUrl !== oldUrl) {
    // Reset state
    editedData.value = null
    saveSuccess.value = false
    saveError.value = null
    loading.value = true
    showIframeViewer.value = false
    
    // The DirectCsvFetcher component will handle loading the data
  }
}, { immediate: false })
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
        
        <!-- Direct link options -->
        <CsvDirectLink
          :fileUrl="props.fileUrl"
          :visible="error || loading"
        />
        
        <!-- Use DirectCsvFetcher to load CSV data -->
        <DirectCsvFetcher
          :fileUrl="props.fileUrl"
          @csv-loaded="handleCsvLoaded"
          @error="handleCsvError"
        />
        
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
        
        <!-- Iframe viewer as a last resort -->
        <CsvIframeViewer
          :fileUrl="props.fileUrl"
          :visible="showIframeViewer && error && !loading"
        />
        
        <div v-if="!loading && !error">
          <v-alert
            type="info"
            variant="tonal"
            class="mb-4"
            icon="mdi-information"
          >
            Click on any cell to edit its content. Changes will be highlighted and must be saved using the "Save Changes" button.
          </v-alert>
          
          <!-- Use the new CsvDataTable component -->
          <CsvDataTable
            ref="dataTableRef"
            :rows="rows"
            :columns="columns"
            :editable="true"
            @cell-edited="handleCellEdited"
          />
          
          <div class="d-flex justify-end mt-4">
            <v-btn
              v-if="hasUnsavedChanges()"
              color="error"
              variant="outlined"
              @click="discardChanges"
              class="mr-2"
            >
              <v-icon start>mdi-close</v-icon>
              Discard Changes
            </v-btn>
            
            <v-btn
              color="primary"
              :loading="saving"
              :disabled="!hasUnsavedChanges()"
              @click="saveChanges"
            >
              <v-icon start>mdi-content-save</v-icon>
              Save Changes
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.url-code {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
}
</style> 