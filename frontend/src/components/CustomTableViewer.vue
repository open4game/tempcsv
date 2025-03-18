<script setup>
import { ref, watch } from 'vue'
import DirectCsvFetcher from './DirectCsvFetcher.vue'
import CsvIframeViewer from './CsvIframeViewer.vue'
import CsvDirectLink from './CsvDirectLink.vue'
import CsvDataTable from './CsvDataTable.vue'
import { API_BASE_URL } from '../config'
import { saveChangesToCsv } from '../services/api'
import { parseCSV, convertToCSV, detectDelimiter } from '../utils/csvParser'

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
const parserOptions = ref({
  delimiter: '',
  hasHeaders: true,
  detectRowIndex: true,
  skipEmptyLines: true,
  dynamicTyping: true
})

// Table refs
const dataTableRef = ref(null)

// Add a flag to track if we should show the iframe viewer
const showIframeViewer = ref(false)

// Handle CSV data loaded from DirectCsvFetcher
const handleCsvLoaded = (csvText) => {
  try {
    // Auto-detect delimiter
    parserOptions.value.delimiter = detectDelimiter(csvText);
    
    // Parse CSV data using our enhanced parser
    const parsedData = parseCSV(csvText, parserOptions.value);
    
    // Set columns and rows
    columns.value = parsedData.columns;
    rows.value = parsedData.rows;
    
    loading.value = false;
    error.value = null;
  } catch (err) {
    error.value = `Error parsing CSV: ${err.message}`;
    loading.value = false;
    
    // If we couldn't parse the CSV data, show the iframe viewer as a last resort
    showIframeViewer.value = true;
  }
}

// Handle error from DirectCsvFetcher
const handleCsvError = (errorMessage) => {
  error.value = errorMessage
  loading.value = false
  
  // If we couldn't load the CSV data, show the iframe viewer as a last resort
  showIframeViewer.value = true
}

// Handle cell edited event from CsvDataTable
const handleCellEdited = (editInfo) => {
  editedData.value = editInfo.editedData
}

// Handle edit mode changed event from CsvDataTable
const handleEditModeChanged = (isEnabled) => {
  // We could add additional logic here if needed
  console.log('Edit mode changed:', isEnabled)
}

// Enable edit mode function
const enableEditMode = () => {
  if (dataTableRef.value) {
    dataTableRef.value.toggleEditMode()
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
    // Convert data back to CSV using our enhanced parser
    const csvContent = convertToCSV(editedData.value, columns.value, {
      delimiter: parserOptions.value.delimiter
    })
    
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

// Change parser settings
const updateParserSettings = (settings) => {
  // Update parser options
  Object.assign(parserOptions.value, settings)
  
  // Reload data using DirectCsvFetcher
  loading.value = true
  error.value = null
  editedData.value = null
  // The DirectCsvFetcher component will handle reloading the data
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
        
        <!-- Parser settings -->
        <v-expansion-panels class="mb-4" v-if="!loading && !error">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon start color="primary">mdi-cog</v-icon>
              Parser Settings
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="parserOptions.delimiter"
                    label="Delimiter"
                    :items="[
                      { title: 'Auto-detect', value: '' },
                      { title: 'Comma (,)', value: ',' },
                      { title: 'Semicolon (;)', value: ';' },
                      { title: 'Tab', value: '\t' },
                      { title: 'Pipe (|)', value: '|' }
                    ]"
                    variant="outlined"
                    density="comfortable"
                  ></v-select>
                </v-col>
                <v-col cols="12" md="4">
                  <v-switch
                    v-model="parserOptions.hasHeaders"
                    label="Has Headers"
                    color="primary"
                  ></v-switch>
                </v-col>
                <v-col cols="12" md="4">
                  <v-switch
                    v-model="parserOptions.detectRowIndex"
                    label="Detect Row Index"
                    color="primary"
                  ></v-switch>
                </v-col>
                <v-col cols="12" md="4">
                  <v-switch
                    v-model="parserOptions.skipEmptyLines"
                    label="Skip Empty Lines"
                    color="primary"
                  ></v-switch>
                </v-col>
                <v-col cols="12" md="4">
                  <v-switch
                    v-model="parserOptions.dynamicTyping"
                    label="Dynamic Typing"
                    color="primary"
                    hint="Auto-convert numbers and booleans"
                    persistent-hint
                  ></v-switch>
                </v-col>
              </v-row>
              <v-btn
                color="primary"
                variant="outlined"
                @click="updateParserSettings(parserOptions)"
                class="mt-2"
              >
                <v-icon start>mdi-refresh</v-icon>
                Apply Settings
              </v-btn>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
        
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
          
          <!-- Table stats -->
          <div class="d-flex align-center mb-4">
            <v-chip color="primary" size="small" class="mr-2">
              <v-icon start size="x-small">mdi-table-column</v-icon>
              {{ columns.length }} Columns
            </v-chip>
            <v-chip color="primary" size="small" class="mr-2">
              <v-icon start size="x-small">mdi-table-row</v-icon>
              {{ rows.length }} Rows
            </v-chip>
            <v-chip color="info" size="small">
              <v-icon start size="x-small">mdi-format-list-bulleted</v-icon>
              Delimiter: {{ parserOptions.delimiter === '\t' ? 'Tab' : parserOptions.delimiter }}
            </v-chip>
          </div>
          
          <!-- Use the CsvDataTable component -->
          <CsvDataTable
            ref="dataTableRef"
            :rows="rows"
            :columns="columns"
            :editable="true"
            :defaultEditMode="false"
            @cell-edited="handleCellEdited"
            @edit-mode-changed="handleEditModeChanged"
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
              class="mr-2"
            >
              <v-icon start>mdi-content-save</v-icon>
              Save Changes
            </v-btn>
            
            <v-btn
              v-if="!dataTableRef?.isEditModeEnabled?.() && editable"
              color="warning"
              variant="tonal"
              @click="enableEditMode"
            >
              <v-icon start>mdi-pencil</v-icon>
              Enable Edit Mode
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