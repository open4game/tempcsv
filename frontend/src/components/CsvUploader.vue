<script setup>
import { ref } from 'vue'
import { API_BASE_URL } from '../config'

const file = ref(null)
const uploading = ref(false)
const uploadResult = ref(null)
const errorMessage = ref('')

const emit = defineEmits(['file-uploaded'])

const handleFileChange = (e) => {
  const selectedFile = e.target.files[0]
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
      credentials: 'include',
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
</script>

<template>
  <v-card class="mb-6">
    <v-card-title class="text-h5">
      <v-icon start icon="mdi-file-upload-outline" class="mr-2"></v-icon>
      Upload CSV File
    </v-card-title>
    
    <v-card-text>
      <v-file-input
        v-model="file"
        label="Select CSV file"
        accept=".csv"
        prepend-icon="mdi-table"
        @change="handleFileChange"
        :error-messages="errorMessage"
        variant="outlined"
        density="comfortable"
      ></v-file-input>
      
      <v-alert
        v-if="uploadResult"
        type="success"
        variant="tonal"
        class="mt-4"
      >
        File uploaded successfully! 
        <div class="mt-2">
          <strong>File URL:</strong> 
          <code>{{ uploadResult.fileUrl }}</code>
        </div>
      </v-alert>
    </v-card-text>
    
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        :loading="uploading"
        :disabled="!file"
        @click="uploadFile"
        prepend-icon="mdi-cloud-upload"
      >
        Upload
      </v-btn>
    </v-card-actions>
  </v-card>
</template> 