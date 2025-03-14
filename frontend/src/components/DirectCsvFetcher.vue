<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  fileUrl: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['csv-loaded', 'error'])

const loading = ref(false)
const error = ref(null)

// Function to fetch CSV data
const loadCsvData = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Use a simple fetch with appropriate configuration
    const response = await fetch(props.fileUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'same-origin',
      headers: { 
        'Accept': 'text/csv,text/plain,*/*' 
      }
    })
    
    if (response.ok) {
      const csvText = await response.text()
      emit('csv-loaded', csvText)
    } else {
      error.value = `Failed to fetch CSV file (Status: ${response.status})`
      emit('error', error.value)
      
      // If fetch fails, try XMLHttpRequest as fallback
      loadCsvWithXhr()
    }
  } catch (err) {
    console.error('Fetch error:', err)
    error.value = `Error loading CSV: ${err.message}`
    emit('error', error.value)
    
    // If fetch fails with an error, try XMLHttpRequest as fallback
    loadCsvWithXhr()
  } finally {
    loading.value = false
  }
}

// Fallback function using XMLHttpRequest
const loadCsvWithXhr = () => {
  loading.value = true
  
  const xhr = new XMLHttpRequest()
  
  xhr.onload = function() {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const csvText = xhr.responseText
        emit('csv-loaded', csvText)
      } catch (err) {
        error.value = `Error parsing CSV: ${err.message}`
        emit('error', error.value)
      }
    } else {
      error.value = `Failed to fetch CSV file (Status: ${xhr.status})`
      emit('error', error.value)
    }
    loading.value = false
  }
  
  xhr.onerror = function() {
    error.value = 'Network error or CORS issue'
    emit('error', error.value)
    loading.value = false
  }
  
  xhr.open('GET', props.fileUrl)
  xhr.setRequestHeader('Accept', 'text/csv,text/plain,*/*')
  xhr.send()
}

// Watch for changes to the fileUrl prop
watch(() => props.fileUrl, (newUrl) => {
  if (newUrl) {
    loadCsvData()
  }
}, { immediate: true })

// Load CSV on mount
onMounted(() => {
  if (props.fileUrl) {
    loadCsvData()
  }
})
</script>

<template>
  <div>
    <div v-if="loading" class="text-center py-2">
      <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
      <span class="ml-2">Loading CSV data...</span>
    </div>
    
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      density="compact"
      class="mt-2"
    >
      {{ error }}
    </v-alert>
  </div>
</template> 