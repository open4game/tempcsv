<script setup>
import { ref } from 'vue'

const showDetails = ref(false)

// Function to toggle details visibility
const toggleDetails = () => {
  showDetails.value = !showDetails.value
}
</script>

<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-shield-link-variant" class="mr-2" color="info"></v-icon>
      CORS Information
      <v-spacer></v-spacer>
      <v-btn
        icon="mdi-information-outline"
        variant="text"
        size="small"
        @click="toggleDetails"
        color="info"
      ></v-btn>
    </v-card-title>
    
    <v-expand-transition>
      <div v-if="showDetails">
        <v-divider></v-divider>
        <v-card-text>
          <p class="text-body-2 mb-2">
            <strong>CORS (Cross-Origin Resource Sharing)</strong> controls how web browsers allow websites to access resources from different domains.
          </p>
          <p class="text-body-2 mb-2">
            This application is configured to access CSV files directly from their source URLs. The server must have proper CORS headers configured to allow access from this origin.
          </p>
          <p class="text-body-2">
            <strong>Note:</strong> If you're experiencing issues loading CSV files, ensure the server hosting the files has CORS properly configured.
          </p>
        </v-card-text>
      </div>
    </v-expand-transition>
  </v-card>
</template> 