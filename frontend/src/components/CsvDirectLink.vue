<script setup>
import { ref } from 'vue'

const props = defineProps({
  fileUrl: {
    type: String,
    required: true
  },
  visible: {
    type: Boolean,
    default: true
  }
})

const openInNewTab = () => {
  window.open(props.fileUrl, '_blank')
}
</script>

<template>
  <div v-if="visible" class="csv-direct-link">
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1">
        <v-icon start icon="mdi-open-in-new" class="mr-2" color="primary"></v-icon>
        Direct Access Options
      </v-card-title>
      
      <v-card-text>
        <p class="text-body-2 mb-4">
          If you're experiencing issues viewing the CSV file in the application, you can try these alternative methods:
        </p>
        
        <div class="d-flex flex-wrap gap-2">
          <v-btn
            color="primary"
            variant="outlined"
            @click="openInNewTab"
            class="mb-2 mr-2"
          >
            <v-icon start>mdi-open-in-new</v-icon>
            Open in New Tab
          </v-btn>
          
          <v-btn
            color="primary"
            variant="outlined"
            :href="fileUrl"
            download
            class="mb-2 mr-2"
          >
            <v-icon start>mdi-download</v-icon>
            Download File
          </v-btn>
          
          <v-btn
            color="primary"
            variant="outlined"
            :href="`data:text/csv;charset=utf-8,${encodeURIComponent('ID,Name\n1,Test')}`"
            download="sample.csv"
            class="mb-2"
          >
            <v-icon start>mdi-file-download</v-icon>
            Download Sample
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.csv-direct-link {
  width: 100%;
}

.gap-2 {
  gap: 8px;
}
</style> 