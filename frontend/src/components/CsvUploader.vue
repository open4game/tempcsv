<script setup>
import { ref } from 'vue'
import { API_BASE_URL } from '../config'

const file = ref(null)
const uploading = ref(false)
const uploadResult = ref(null)
const errorMessage = ref('')
const dragActive = ref(false)

const emit = defineEmits(['file-uploaded'])

const handleFileChange = (e) => {
  const selectedFile = e.target.files[0]
  processFile(selectedFile)
}

const processFile = (selectedFile) => {
  if (selectedFile && selectedFile.type === 'text/csv') {
    file.value = selectedFile
    errorMessage.value = ''
  } else {
    file.value = null
    errorMessage.value = 'Please select a valid CSV file'
  }
}

const uploadFile = async () => {
  if (!file.value) {
    errorMessage.value = 'Please select a file first'
    return
  }

  uploading.value = true
  errorMessage.value = ''
  
  try {
    const formData = new FormData()
    formData.append('file', file.value)
    
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    
    if (response.ok) {
      // Format the file URL to include the API base URL if it's a relative path
      if (result.fileUrl && result.fileUrl.startsWith('/')) {
        result.fileUrl = `${API_BASE_URL}${result.fileUrl}`
      }
      uploadResult.value = result
      emit('file-uploaded', result)
      file.value = null
    } else {
      errorMessage.value = result.error || 'Upload failed'
    }
  } catch (error) {
    errorMessage.value = error.message || 'An error occurred during upload'
  } finally {
    uploading.value = false
  }
}

// Drag and drop handlers
const onDragEnter = (e) => {
  e.preventDefault()
  dragActive.value = true
}

const onDragLeave = (e) => {
  e.preventDefault()
  dragActive.value = false
}

const onDragOver = (e) => {
  e.preventDefault()
}

const onDrop = (e) => {
  e.preventDefault()
  dragActive.value = false
  
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    processFile(e.dataTransfer.files[0])
  }
}
</script>

<template>
  <div 
    class="upload-container"
    :class="{ 'drag-active': dragActive }"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @dragover="onDragOver"
    @drop="onDrop"
  >
    <div v-if="!uploadResult" class="upload-area">
      <v-icon icon="mdi-file-upload-outline" size="x-large" color="primary" class="mb-4"></v-icon>
      
      <h3 class="text-h6 mb-4">Drop your CSV file here</h3>
      
      <p class="text-body-2 mb-4">or</p>
      
      <v-file-input
        v-model="file"
        label="Select CSV file"
        accept=".csv"
        hide-details
        variant="outlined"
        density="comfortable"
        class="mb-4 file-input"
        @change="handleFileChange"
      ></v-file-input>
      
      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mt-4"
        density="compact"
      >
        {{ errorMessage }}
      </v-alert>
      
      <v-btn
        color="primary"
        size="large"
        block
        :loading="uploading"
        :disabled="!file"
        @click="uploadFile"
        class="mt-4"
      >
        <v-icon start icon="mdi-cloud-upload"></v-icon>
        Upload Now
      </v-btn>
    </div>
    
    <div v-else class="success-area">
      <v-icon icon="mdi-check-circle" size="x-large" color="success" class="mb-4"></v-icon>
      
      <h3 class="text-h6 mb-4">Upload Successful!</h3>
      
      <v-card variant="outlined" class="mb-4 pa-2">
        <div class="d-flex align-center">
          <v-icon icon="mdi-link-variant" color="primary" class="mr-2"></v-icon>
          <code class="flex-grow-1 url-code">{{ uploadResult.fileUrl }}</code>
          <v-btn
            icon="mdi-content-copy"
            variant="text"
            size="small"
            @click="navigator.clipboard.writeText(uploadResult.fileUrl)"
          ></v-btn>
        </div>
      </v-card>
      
      <div class="d-flex gap-2">
        <v-btn
          color="primary"
          variant="outlined"
          @click="uploadResult = null"
          class="flex-grow-1"
        >
          Upload Another
        </v-btn>
        
        <v-btn
          color="primary"
          @click="window.open(uploadResult.fileUrl, '_blank')"
          class="flex-grow-1"
        >
          <v-icon start icon="mdi-download"></v-icon>
          Download
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-container {
  border: 2px dashed rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  max-width: 100%;
}

.drag-active {
  border-color: var(--v-primary-base);
  background-color: rgba(var(--v-primary-base), 0.05);
}

.upload-area, .success-area {
  max-width: 500px;
  margin: 0 auto;
}

.file-input {
  max-width: 100%;
}

.url-code {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 600px) {
  .upload-container {
    padding: 1.5rem;
  }
  
  .upload-area, .success-area {
    max-width: 100%;
  }
}
</style> 