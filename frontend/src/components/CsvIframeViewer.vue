<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  fileUrl: {
    type: String,
    required: true
  },
  visible: {
    type: Boolean,
    default: false
  }
})

const iframeLoaded = ref(false)
const iframeError = ref(false)

// Reset state when fileUrl changes
watch(() => props.fileUrl, () => {
  iframeLoaded.value = false
  iframeError.value = false
})

// Handle iframe load event
const handleIframeLoad = () => {
  iframeLoaded.value = true
}

// Handle iframe error event
const handleIframeError = () => {
  iframeError.value = true
}
</script>

<template>
  <div v-if="visible" class="csv-iframe-viewer">
    <v-alert
      type="warning"
      variant="tonal"
      class="mb-4"
      icon="mdi-alert-circle"
    >
      <div class="text-subtitle-1 font-weight-bold mb-2">
        Using Fallback Viewer
      </div>
      <p class="text-body-2">
        The CSV file is being displayed in an iframe as a fallback method. This may not work for all files and provides limited functionality.
      </p>
      <p class="text-body-2">
        For better results, try enabling the CORS proxy or downloading the file directly.
      </p>
    </v-alert>
    
    <div class="iframe-container">
      <iframe
        :src="fileUrl"
        @load="handleIframeLoad"
        @error="handleIframeError"
        frameborder="0"
        width="100%"
        height="500"
      ></iframe>
      
      <div v-if="!iframeLoaded && !iframeError" class="iframe-loading">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <div class="mt-2">Loading file in iframe...</div>
      </div>
      
      <v-alert
        v-if="iframeError"
        type="error"
        variant="tonal"
        class="mt-4"
      >
        Failed to load the file in an iframe. This may be due to security restrictions or the file format.
      </v-alert>
    </div>
  </div>
</template>

<style scoped>
.csv-iframe-viewer {
  width: 100%;
}

.iframe-container {
  position: relative;
  width: 100%;
  height: 500px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.iframe-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
}
</style> 