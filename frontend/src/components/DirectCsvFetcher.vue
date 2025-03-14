<script setup>
import { ref, onMounted, watch } from 'vue'
import { fetchCsvData, fetchCsvWithXhr } from '../services/api'

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
    // Use the direct API service to fetch CSV data
    const csvText = await fetchCsvData(props.fileUrl)
    emit('csv-loaded', csvText)
  } catch (err) {
    console.error('Fetch error:', err)
    error.value = `Error loading CSV: ${err.message}`
    emit('error', error.value)
    
    // If fetch fails with an error, try XMLHttpRequest as fallback
    try {
      console.log('Trying XHR fallback...')
      const csvText = await fetchCsvWithXhr(props.fileUrl)
      emit('csv-loaded', csvText)
      // Clear error if XHR succeeds
      error.value = null
    } catch (xhrErr) {
      console.error('XHR fallback error:', xhrErr)
      error.value = `Error loading CSV: ${xhrErr.message}`
      emit('error', error.value)
    }
  } finally {
    loading.value = false
  }
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