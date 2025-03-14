<script setup>
import { ref } from 'vue'
import { API_BASE_URL } from '../config'

const file = ref(null)
const uploading = ref(false)
const uploadResult = ref(null)
const errorMessage = ref('')
const dragActive = ref(false)
const copySuccess = ref(false)
const shareSuccess = ref(false)

const emit = defineEmits(['file-uploaded', 'view-file'])

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

// Copy URL to clipboard
const copyToClipboard = async () => {
  try {
    if (uploadResult.value && uploadResult.value.fileUrl) {
      await navigator.clipboard.writeText(uploadResult.value.fileUrl)
      copySuccess.value = true
      setTimeout(() => {
        copySuccess.value = false
      }, 2000)
    }
  } catch (err) {
    console.error('Failed to copy URL to clipboard:', err)
    // Fallback method for browsers that don't support clipboard API
    const textArea = document.createElement('textarea')
    textArea.value = uploadResult.value.fileUrl
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

// Open file in new window
const openFileInNewWindow = () => {
  if (uploadResult.value && uploadResult.value.fileUrl) {
    const newWindow = window.open()
    if (newWindow) {
      newWindow.location.href = uploadResult.value.fileUrl
    } else {
      alert('Pop-up blocked. Please allow pop-ups for this site to download the file.')
    }
  }
}

// View file in CSV Viewer
const viewFile = () => {
  if (uploadResult.value && uploadResult.value.fileUrl) {
    emit('view-file', uploadResult.value.fileUrl)
  }
}

// Reset uploader to upload another file
const resetUploader = () => {
  uploadResult.value = null
  file.value = null
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

// Share file functionality
const shareFile = async () => {
  if (uploadResult.value && uploadResult.value.fileUrl) {
    // Create the full URL including the base URL of the application
    const fullUrl = new URL(window.location.href)
    fullUrl.pathname = '/'
    fullUrl.hash = '#/viewer'
    fullUrl.searchParams.set('file', uploadResult.value.fileUrl)
    
    const shareUrl = fullUrl.toString()
    
    // Try to use the Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'View CSV File',
          text: 'Check out this CSV file',
          url: shareUrl
        })
      } catch (err) {
        // Fallback to copy to clipboard if share fails
        await copyShareUrlToClipboard(shareUrl)
      }
    } else {
      // If Web Share API is not available, copy to clipboard
      await copyShareUrlToClipboard(shareUrl)
    }
  }
}

// Copy share URL to clipboard
const copyShareUrlToClipboard = async (url) => {
  try {
    await navigator.clipboard.writeText(url)
    shareSuccess.value = true
    setTimeout(() => {
      shareSuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy share URL to clipboard:', err)
    // Fallback method for browsers that don't support clipboard API
    const textArea = document.createElement('textarea')
    textArea.value = url
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    shareSuccess.value = true
    setTimeout(() => {
      shareSuccess.value = false
    }, 2000)
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
      <v-icon icon="mdi-file-upload-outline" size="xx-large" color="primary" class="mb-5"></v-icon>
      
      <h3 class="text-h5 mb-4">Drop your CSV file here</h3>
      
      <p class="text-body-1 mb-4">or</p>
      
      <v-file-input
        v-model="file"
        label="Select CSV file"
        accept=".csv"
        hide-details
        variant="outlined"
        density="comfortable"
        class="mb-6 file-input"
        @change="handleFileChange"
        prepend-icon="mdi-file-document-outline"
      ></v-file-input>
      
      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mt-4 mb-4"
        density="comfortable"
        width="100%"
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
        class="mt-4 py-3 text-subtitle-1"
        elevation="2"
      >
        <v-icon start icon="mdi-cloud-upload" class="mr-2"></v-icon>
        Upload Now
      </v-btn>
    </div>
    
    <div v-else class="success-area">
      <v-icon icon="mdi-check-circle" size="xx-large" color="success" class="mb-5"></v-icon>
      
      <h3 class="text-h5 mb-4">Upload Successful!</h3>
      
      <v-card variant="outlined" class="mb-5 pa-4">
        <div class="d-flex align-center">
          <v-icon icon="mdi-link-variant" color="primary" class="mr-2"></v-icon>
          <code class="flex-grow-1 url-code text-body-1">{{ uploadResult.fileUrl }}</code>
          <v-btn
            icon="mdi-content-copy"
            variant="text"
            size="small"
            @click="copyToClipboard"
            :color="copySuccess ? 'success' : ''"
          >
            <v-icon>{{ copySuccess ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
          </v-btn>
        </div>
      </v-card>
      
      <!-- Share Button (Prominent) -->
      <v-btn
        :color="shareSuccess ? 'success' : 'primary'"
        block
        class="mb-5 py-3 text-subtitle-1"
        @click="shareFile"
        elevation="2"
        size="large"
      >
        <v-icon start class="mr-2">{{ shareSuccess ? 'mdi-check' : 'mdi-share-variant' }}</v-icon>
        {{ shareSuccess ? 'Link Copied!' : 'Share This File' }}
      </v-btn>
      
      <div class="action-buttons">
        <v-btn
          color="primary"
          variant="outlined"
          @click="resetUploader"
          class="action-button py-2"
          size="large"
        >
          <v-icon start icon="mdi-upload" class="mr-1"></v-icon>
          Upload Another
        </v-btn>
        
        <v-btn
          color="info"
          variant="outlined"
          @click="viewFile"
          class="action-button py-2"
          size="large"
        >
          <v-icon start icon="mdi-table-eye" class="mr-1"></v-icon>
          View
        </v-btn>
        
        <v-btn
          color="primary"
          @click="openFileInNewWindow"
          class="action-button py-2"
          size="large"
        >
          <v-icon start icon="mdi-download" class="mr-1"></v-icon>
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
  padding: 3rem;
  text-align: center;
  transition: all 0.3s ease;
  max-width: 100%;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.drag-active {
  border-color: var(--v-primary-base);
  background-color: rgba(var(--v-primary-base), 0.05);
}

.upload-area, .success-area {
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.file-input {
  max-width: 100%;
}

.url-code {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1.1rem;
  padding: 0.5rem 0;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  margin-top: 1.5rem;
}

.action-button {
  flex: 1;
  min-width: 160px;
}

@media (max-width: 600px) {
  .upload-container {
    padding: 2rem;
    min-height: 350px;
  }
  
  .upload-area, .success-area {
    max-width: 100%;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 12px;
  }
  
  .action-button {
    width: 100%;
  }
}
</style> 