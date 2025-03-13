<script setup>
import { ref, computed } from 'vue'
import { API_BASE_URL } from './config'
import CsvUploader from './components/CsvUploader.vue'
import CsvVerifier from './components/CsvVerifier.vue'
import CsvUpdater from './components/CsvUpdater.vue'
import CsvDownloader from './components/CsvDownloader.vue'
import CustomTableViewer from './components/CustomTableViewer.vue'
import MinimapTest from './views/MinimapTest.vue'

const lastUploadedFile = ref(null)
const lastVerifiedFile = ref(null)
const lastUpdatedFile = ref(null)
const activeTab = ref('upload')
const selectedFileForViewing = ref(null)

const handleFileUploaded = (result) => {
  lastUploadedFile.value = result
  // Don't automatically switch to advanced tab anymore
  // This allows the user to choose whether to view the file or go to advanced tools
}

const handleFileVerified = (result) => {
  lastVerifiedFile.value = result
}

const handleFileUpdated = (result) => {
  lastUpdatedFile.value = result
}

// Helper function to open file URLs
const openFile = (fileUrl) => {
  if (fileUrl) {
    window.open(fileUrl, '_blank')
  }
}

// Open file in viewer
const openFileInViewer = (fileUrl) => {
  if (fileUrl) {
    selectedFileForViewing.value = fileUrl
    activeTab.value = 'viewer'
  }
}

const showAdvancedFeatures = computed(() => {
  return activeTab.value === 'advanced'
})
</script>

<template>
  <v-app>
    <!-- Navigation Bar -->
    <v-app-bar color="primary" elevation="2">
      <v-container class="d-flex align-center py-0 app-container">
        <v-app-bar-title class="text-h5 font-weight-bold">
          CSV Manager
        </v-app-bar-title>
        <v-spacer></v-spacer>
        <v-tabs v-model="activeTab">
          <v-tab value="upload">Home</v-tab>
          <v-tab value="advanced">Advanced Tools</v-tab>
          <v-tab value="viewer" :disabled="!selectedFileForViewing">CSV Viewer</v-tab>
          <v-tab value="minimap-test">Minimap Test</v-tab>
          <v-tab value="about">About</v-tab>
        </v-tabs>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-github" variant="text" href="https://github.com/open4game/tempcsv" target="_blank"></v-btn>
      </v-container>
    </v-app-bar>

    <v-main>
      <!-- Home/Upload Tab -->
      <v-window v-model="activeTab">
        <v-window-item value="upload">
          <v-container class="py-10 app-container">
            <v-row justify="center">
              <v-col cols="12" class="text-center">
                <h1 class="text-h3 font-weight-bold mb-6">CSV File Manager</h1>
                <p class="text-body-1 mb-8 mx-auto" style="max-width: 800px;">
                  Upload, verify, update, and download CSV files stored in Cloudflare R2.
                  Your files are securely stored and easily accessible whenever you need them.
                </p>
                
                <!-- Main Upload Area -->
                <v-sheet 
                  class="pa-8 mb-8 rounded-lg mx-auto csv-uploader-container" 
                  color="primary-lighten-5"
                  border
                >
                  <h2 class="text-h5 mb-4">Upload your CSV file</h2>
                  <CsvUploader 
                    @file-uploaded="handleFileUploaded" 
                    @view-file="openFileInViewer"
                  />
                </v-sheet>
                
                <!-- Features Section -->
                <v-row class="mt-12 justify-center">
                  <v-col cols="12" sm="4" md="4" class="feature-col">
                    <div class="feature-box">
                      <v-icon icon="mdi-shield-check" size="x-large" color="primary" class="mb-4"></v-icon>
                      <h3 class="text-h6 mb-2">Secure Storage</h3>
                      <p>Your CSV files are securely stored in Cloudflare R2 storage.</p>
                    </div>
                  </v-col>
                  <v-col cols="12" sm="4" md="4" class="feature-col">
                    <div class="feature-box">
                      <v-icon icon="mdi-cloud-sync" size="x-large" color="primary" class="mb-4"></v-icon>
                      <h3 class="text-h6 mb-2">Easy Updates</h3>
                      <p>Update your files anytime while keeping the same URL.</p>
                    </div>
                  </v-col>
                  <v-col cols="12" sm="4" md="4" class="feature-col">
                    <div class="feature-box">
                      <v-icon icon="mdi-link-variant" size="x-large" color="primary" class="mb-4"></v-icon>
                      <h3 class="text-h6 mb-2">Shareable Links</h3>
                      <p>Get permanent links to your files for easy sharing.</p>
                    </div>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-container>
        </v-window-item>

        <!-- Advanced Tools Tab -->
        <v-window-item value="advanced">
          <v-container class="py-8 app-container">
            <h2 class="text-h4 mb-6">Advanced Tools</h2>
            
            <div class="tool-section csv-verifier-container">
              <CsvVerifier @file-verified="handleFileVerified" />
            </div>
            
            <div class="tool-section csv-updater-container">
              <CsvUpdater @file-updated="handleFileUpdated" />
            </div>
            
            <div class="tool-section csv-downloader-container">
              <CsvDownloader />
            </div>
            
            <div class="tool-section" v-if="lastUploadedFile || lastVerifiedFile || lastUpdatedFile">
              <v-card>
                <v-card-title class="text-h5">
                  <v-icon start icon="mdi-history" class="mr-2"></v-icon>
                  Recent Activity
                </v-card-title>
                
                <v-card-text>
                  <v-list>
                    <v-list-item v-if="lastUploadedFile">
                      <template v-slot:prepend>
                        <v-icon icon="mdi-file-upload-outline"></v-icon>
                      </template>
                      <v-list-item-title>File Uploaded</v-list-item-title>
                      <v-list-item-subtitle>
                        <code>{{ lastUploadedFile.fileUrl }}</code>
                      </v-list-item-subtitle>
                      <template v-slot:append>
                        <div class="d-flex">
                          <v-btn
                            icon="mdi-table-eye"
                            variant="text"
                            size="small"
                            class="mr-2"
                            @click="openFileInViewer(lastUploadedFile.fileUrl)"
                            title="View in CSV Viewer"
                          ></v-btn>
                          <v-btn
                            icon="mdi-download"
                            variant="text"
                            size="small"
                            @click="openFile(lastUploadedFile.fileUrl)"
                            title="Download"
                          ></v-btn>
                        </div>
                      </template>
                    </v-list-item>
                    
                    <v-list-item v-if="lastVerifiedFile">
                      <template v-slot:prepend>
                        <v-icon icon="mdi-file-check-outline"></v-icon>
                      </template>
                      <v-list-item-title>File Verified</v-list-item-title>
                      <v-list-item-subtitle>
                        <code>{{ lastVerifiedFile.fileUrl }}</code>
                      </v-list-item-subtitle>
                      <template v-slot:append>
                        <div class="d-flex">
                          <v-btn
                            icon="mdi-table-eye"
                            variant="text"
                            size="small"
                            class="mr-2"
                            @click="openFileInViewer(lastVerifiedFile.fileUrl)"
                            title="View in CSV Viewer"
                          ></v-btn>
                          <v-btn
                            icon="mdi-download"
                            variant="text"
                            size="small"
                            @click="openFile(lastVerifiedFile.fileUrl)"
                            title="Download"
                          ></v-btn>
                        </div>
                      </template>
                    </v-list-item>
                    
                    <v-list-item v-if="lastUpdatedFile">
                      <template v-slot:prepend>
                        <v-icon icon="mdi-file-replace-outline"></v-icon>
                      </template>
                      <v-list-item-title>File Updated</v-list-item-title>
                      <v-list-item-subtitle>
                        <code>{{ lastUpdatedFile.fileUrl }}</code>
                      </v-list-item-subtitle>
                      <template v-slot:append>
                        <div class="d-flex">
                          <v-btn
                            icon="mdi-table-eye"
                            variant="text"
                            size="small"
                            class="mr-2"
                            @click="openFileInViewer(lastUpdatedFile.fileUrl)"
                            title="View in CSV Viewer"
                          ></v-btn>
                          <v-btn
                            icon="mdi-download"
                            variant="text"
                            size="small"
                            @click="openFile(lastUpdatedFile.fileUrl)"
                            title="Download"
                          ></v-btn>
                        </div>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </div>
          </v-container>
        </v-window-item>
        
        <!-- CSV Viewer Tab -->
        <v-window-item value="viewer">
          <v-container class="py-8 app-container">
            <h2 class="text-h4 mb-6">CSV Viewer & Editor</h2>
            
            <div v-if="selectedFileForViewing" class="csv-viewer-container">
              <CustomTableViewer 
                :fileUrl="selectedFileForViewing" 
                @file-updated="handleFileUpdated"
              />
            </div>
            
            <div v-else class="text-center py-8">
              <v-icon icon="mdi-file-search" size="x-large" color="grey" class="mb-4"></v-icon>
              <h3 class="text-h6 mb-2">No File Selected</h3>
              <p class="text-body-1">
                Please select a file to view from the Recent Activity section.
              </p>
            </div>
          </v-container>
        </v-window-item>
        
        <!-- Minimap Test Tab -->
        <v-window-item value="minimap-test">
          <v-container class="py-6 app-container">
            <MinimapTest />
          </v-container>
        </v-window-item>
        
        <!-- About Tab -->
        <v-window-item value="about">
          <v-container class="py-8 app-container">
            <h2 class="text-h4 mb-6">About CSV Manager</h2>
            <v-card class="mb-6">
              <v-card-text>
                <p class="text-body-1 mb-4">
                  CSV Manager is a simple, efficient tool for managing CSV files in the cloud. 
                  Built with Cloudflare R2 storage, it provides a reliable way to store, update, 
                  and share your CSV files.
                </p>
                <p class="text-body-1 mb-4">
                  This service is designed to be temporary and anonymous, allowing you to quickly 
                  upload and share CSV files without the need for authentication.
                </p>
                <p class="text-body-1">
                  <strong>API Endpoint:</strong> <code>{{ API_BASE_URL }}</code>
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
                  <v-card-title class="text-h6">Share or Verify the File</v-card-title>
                  <v-card-text>
                    Share the URL with others or use the Verify tool to check if the file exists.
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
                  <v-card-title class="text-h6">Update if Needed</v-card-title>
                  <v-card-text>
                    Use the Update tool to replace the file while keeping the same URL.
                  </v-card-text>
                </v-card>
              </v-timeline-item>
            </v-timeline>
          </v-container>
        </v-window-item>
      </v-window>
    </v-main>

    <v-footer class="bg-grey-lighten-3">
      <v-container class="app-container">
        <v-row>
          <v-col cols="12" md="4">
            <h3 class="text-h6 mb-2">CSV Manager</h3>
            <p class="text-body-2">
              A simple tool for managing CSV files in the cloud.
            </p>
          </v-col>
          <v-col cols="12" md="4" class="text-center">
            <p class="text-body-2">
              &copy; {{ new Date().getFullYear() }} CSV File Manager
            </p>
          </v-col>
          <v-col cols="12" md="4" class="text-md-end">
            <v-btn icon="mdi-github" variant="text" href="https://github.com/open4game/tempcsv" target="_blank"></v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-footer>
  </v-app>
</template>

<style>
.v-application {
  font-family: 'Roboto', sans-serif;
}

code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
  word-break: break-all;
}

.primary-lighten-5 {
  background-color: #E3F2FD !important;
}

.app-container {
  max-width: 1200px !important;
  margin: 0 auto;
  padding-left: 16px;
  padding-right: 16px;
  width: 100%;
}

.tool-section {
  margin-bottom: 24px;
  width: 100%;
}

.feature-col {
  display: flex;
  justify-content: center;
}

.feature-box {
  max-width: 300px;
  width: 100%;
}

/* Override Vuetify's grid system for all breakpoints */
.v-col {
  flex-basis: 100% !important;
  max-width: 100% !important;
}

/* Ensure main components take full width */
.csv-viewer-container,
.csv-uploader-container,
.csv-verifier-container,
.csv-updater-container,
.csv-downloader-container {
  width: 100%;
}

/* Remove max-width constraint from main upload area */
.v-sheet.pa-8.mb-8.rounded-lg.mx-auto {
  max-width: none !important;
  width: 100%;
}

@media (max-width: 600px) {
  .feature-box {
    max-width: 100%;
  }
}
</style>
