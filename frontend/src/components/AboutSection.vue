<script setup>
import { API_BASE_URL } from '../config'
</script>

<template>
  <v-container class="py-8 app-container">
    <h2 class="text-h4 mb-6">About Temp CSV</h2>
    <v-card class="mb-6">
      <v-card-text>
        <p class="text-body-1 mb-4">
          Temp CSV is a simple, efficient tool for share and view CSV files in the cloud. 
        </p>
        <p class="text-body-1 mb-4">
          This service is designed to be temporary and anonymous, allowing you to quickly 
          upload and share CSV files without the need for authentication.
        </p>
        <p class="text-body-1 mb-4">
          Your file is stored online temporarily and will be automatically deleted after 7 days. Please note: ALL FILES ARE DELETED AFTER 7 DAYS with no exceptions.
        </p>
      </v-card-text>
    </v-card>
    
    <h3 class="text-h5 mb-4">How to Use</h3>
    <v-timeline>
      <v-timeline-item dot-color="primary">
        <template v-slot:opposite>
          <span class="text-caption">Step 1</span>
        </template>
        <v-card>
          <v-card-title class="text-h6">Upload a CSV File</v-card-title>
          <v-card-text>
            Use the uploader on the home page to upload your CSV file. You'll receive a unique URL.
          </v-card-text>
        </v-card>
      </v-timeline-item>
      
      <v-timeline-item dot-color="primary">
        <template v-slot:opposite>
          <span class="text-caption">Step 2</span>
        </template>
        <v-card>
          <v-card-title class="text-h6">Share the File</v-card-title>
          <v-card-text>
            Share the URL with others to view the file.
          </v-card-text>
        </v-card>
      </v-timeline-item>
      
      <v-timeline-item dot-color="primary">
        <template v-slot:opposite>
          <span class="text-caption">Step 3</span>
        </template>
        <v-card>
          <v-card-title class="text-h6">View and Edit</v-card-title>
          <v-card-text>
            Use the CSV Viewer to view and edit your CSV files directly in the browser.
          </v-card-text>
        </v-card>
      </v-timeline-item>
      
      <v-timeline-item dot-color="primary">
        <template v-slot:opposite>
          <span class="text-caption">Step 4</span>
        </template>
        <v-card>
          <v-card-title class="text-h6">Deleted After 7 Days</v-card-title>
          <v-card-text>
            Your file will be deleted after 7 days automatically. So you don't need to worry about deleting it.
          </v-card-text>
        </v-card>
      </v-timeline-item>
    </v-timeline>
  </v-container>
</template>

<style scoped>
.app-container {
  max-width: 1200px !important;
  margin: 0 auto;
  padding-left: 16px;
  padding-right: 16px;
  width: 100%;
}
</style> 