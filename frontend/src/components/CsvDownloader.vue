<script setup>
import { ref } from 'vue'
import { API_BASE_URL } from '../config'

const fileUrl = ref('')
const errorMessage = ref('')

const downloadFile = () => {
  if (!fileUrl.value) {
    errorMessage.value = 'Please enter a file URL'
    return
  }
  
  errorMessage.value = ''
  
  // If the URL is a relative path, prepend the API base URL
  let url = fileUrl.value
  if (url.startsWith('/')) {
    url = `${API_BASE_URL}${url}`
  }
  
  window.open(url, '_blank')
}
</script>

<template>
  <v-card>
    <v-card-title class="text-h5">
      <v-icon start icon="mdi-download" class="mr-2"></v-icon>
      Download CSV File
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
    </v-card-text>
    
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        @click="downloadFile"
        prepend-icon="mdi-download"
      >
        Download
      </v-btn>
    </v-card-actions>
  </v-card>
</template> 