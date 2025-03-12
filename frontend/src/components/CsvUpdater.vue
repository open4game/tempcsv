<script setup>
import { ref } from 'vue'
import { API_BASE_URL } from '../config'

const fileUrl = ref('')
const file = ref(null)
const updating = ref(false)
const updateResult = ref(null)
const errorMessage = ref('')

const emit = defineEmits(['file-updated'])

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

const updateFile = async () => {
  if (!fileUrl.value) {
    errorMessage.value = 'Please enter a file URL'
    return
  }

  if (!file.value) {
    errorMessage.value = 'Please select a file'
    return
  }

  updating.value = true
  errorMessage.value = ''
  
  try {
    const formData = new FormData()
    formData.append('file', file.value)
    formData.append('fileUrl', fileUrl.value)
    
    const response = await fetch(`${API_BASE_URL}/update`, {
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
      updateResult.value = result
      emit('file-updated', result)
      file.value = null
    } else {
      errorMessage.value = result.error || 'Update failed'
    }
  } catch (error) {
    errorMessage.value = error.message || 'An error occurred during update'
  } finally {
    updating.value = false
  }
}
</script>

<template>
  <v-card class="mb-6">
    <v-card-title class="text-h5">
      <v-icon start icon="mdi-file-replace-outline" class="mr-2"></v-icon>
      Update CSV File
    </v-card-title>
    
    <v-card-text>
      <v-text-field
        v-model="fileUrl"
        label="File URL to update"
        placeholder="Paste file URL here"
        variant="outlined"
        density="comfortable"
        class="mb-4"
        prepend-icon="mdi-link-variant"
      ></v-text-field>
      
      <v-file-input
        v-model="file"
        label="Select new CSV file"
        accept=".csv"
        prepend-icon="mdi-table"
        @change="handleFileChange"
        :error-messages="errorMessage"
        variant="outlined"
        density="comfortable"
      ></v-file-input>
      
      <v-alert
        v-if="updateResult"
        type="success"
        variant="tonal"
        class="mt-4"
      >
        File updated successfully! 
        <div class="mt-2">
          <strong>File URL:</strong> 
          <code>{{ updateResult.fileUrl }}</code>
        </div>
      </v-alert>
    </v-card-text>
    
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        :loading="updating"
        :disabled="!file || !fileUrl"
        @click="updateFile"
        prepend-icon="mdi-update"
      >
        Update
      </v-btn>
    </v-card-actions>
  </v-card>
</template> 