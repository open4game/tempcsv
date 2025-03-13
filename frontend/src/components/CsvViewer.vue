<script setup>
import { ref, onMounted } from 'vue'
import { VueGoodTable } from 'vue-good-table-next'
import 'vue-good-table-next/dist/vue-good-table-next.css'
import { API_BASE_URL } from '../config'

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
  } catch (err) {
    error.value = err.message
    console.error('Error loading CSV:', err)
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

// Initialize component
onMounted(() => {
  if (props.fileUrl) {
    loadCSVData()
  }
})
</script>

<template>
  <v-card>
    <v-card-title class="text-h5">
      <v-icon start icon="mdi-table-edit" class="mr-2"></v-icon>
      CSV Viewer & Editor
    </v-card-title>
    
    <v-card-text>
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
        
        <div class="csv-table-container">
          <vue-good-table
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
            
            <template #table-actions>
              <div class="table-actions">
                <v-chip
                  v-if="hasUnsavedChanges()"
                  color="warning"
                  class="mr-2"
                >
                  Unsaved Changes
                </v-chip>
              </div>
            </template>
          </vue-good-table>
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
</template>

<style scoped>
.csv-table-container {
  width: 100%;
  overflow-x: auto;
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

/* Custom styles for the table */
:deep(.vgt-table) {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
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
</style> 