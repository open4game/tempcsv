<script setup>
import { ref } from 'vue'
import { API_BASE_URL } from '../config'

const fileUrl = ref('')
const verifying = ref(false)
const verifyResult = ref(null)
const errorMessage = ref('')

const emit = defineEmits(['file-verified'])

const verifyFile = async () => {
  if (!fileUrl.value) {
    errorMessage.value = 'Please enter a file URL'
    return
  }

  verifying.value = true
  errorMessage.value = ''
  
  try {
    const response = await fetch(`${API_BASE_URL}/save`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileUrl: fileUrl.value })
    })
    
    const result = await response.json()
    
    if (response.ok) {
      // Format the file URL to include the API base URL if it's a relative path
      if (result.fileUrl && result.fileUrl.startsWith('/')) {
        result.fileUrl = `${API_BASE_URL}${result.fileUrl}`
      }
      verifyResult.value = result
      emit('file-verified', result)
    } else {
      errorMessage.value = result.error || 'Verification failed'
    }
  } catch (error) {
    errorMessage.value = error.message || 'An error occurred during verification'
  } finally {
    verifying.value = false
  }
}

const downloadFile = () => {
  if (verifyResult.value && verifyResult.value.fileUrl) {
    window.open(verifyResult.value.fileUrl, '_blank')
  }
}
</script>

<template>
  <v-card class="mb-6">
    <v-card-title class="text-h5">
      <v-icon start icon="mdi-file-check-outline" class="mr-2"></v-icon>
      Verify CSV File
    </v-card-title>
    
    <v-card-text>
      <v-text-field
        v-model="fileUrl"
        label="File URL"
        placeholder="Paste file URL here"
        variant="outlined"
        density="comfortable"
        :error-messages="errorMessage"
        prepend-icon="mdi-link-variant"
      ></v-text-field>
      
      <v-alert
        v-if="verifyResult"
        type="success"
        variant="tonal"
        class="mt-4"
      >
        File verified successfully! 
        <div class="mt-2">
          <strong>File URL:</strong> 
          <code>{{ verifyResult.fileUrl }}</code>
        </div>
      </v-alert>
    </v-card-text>
    
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        v-if="verifyResult"
        color="info"
        prepend-icon="mdi-download"
        class="mr-2"
        @click="downloadFile"
      >
        Download
      </v-btn>
      <v-btn
        color="primary"
        :loading="verifying"
        @click="verifyFile"
        prepend-icon="mdi-check-circle"
      >
        Verify
      </v-btn>
    </v-card-actions>
  </v-card>
</template> 