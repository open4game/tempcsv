<script setup>
import { ref, computed } from 'vue'
import CsvUploader from './components/CsvUploader.vue'
import CustomTableViewer from './components/CustomTableViewer.vue'
import AboutSection from './components/AboutSection.vue'

const lastUploadedFile = ref(null)
const lastUpdatedFile = ref(null)
const activeTab = ref('upload')
const selectedFileForViewing = ref(null)
const fileUrlInput = ref('')
const viewedFiles = ref([]) // History of viewed files
const showShareDialog = ref(false)
const shareUrl = ref('')
const shareSnackbar = ref(false)

const handleFileUploaded = (result) => {
  lastUploadedFile.value = result
  // Don't automatically switch to advanced tab anymore
  // This allows the user to choose whether to view the file or go to advanced tools
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
    addToViewHistory(fileUrl)
    selectedFileForViewing.value = fileUrl
    activeTab.value = 'viewer'
  }
}

// Load file from URL input
const loadFileFromUrl = () => {
  if (fileUrlInput.value) {
    addToViewHistory(fileUrlInput.value)
    selectedFileForViewing.value = fileUrlInput.value
    fileUrlInput.value = '' // Clear the input after loading
  }
}

// Clear current file
const clearCurrentFile = () => {
  selectedFileForViewing.value = null
}

// Add file to view history
const addToViewHistory = (fileUrl) => {
  // Don't add duplicates
  if (!viewedFiles.value.includes(fileUrl)) {
    // Limit history to 5 most recent files
    if (viewedFiles.value.length >= 5) {
      viewedFiles.value.pop()
    }
    viewedFiles.value.unshift(fileUrl)
  } else {
    // Move to top if already exists
    const index = viewedFiles.value.indexOf(fileUrl)
    if (index > 0) {
      viewedFiles.value.splice(index, 1)
      viewedFiles.value.unshift(fileUrl)
    }
  }
}

// We'll keep this computed property but modify it to always return false
// since we've removed the advanced tab
const showAdvancedFeatures = computed(() => {
  return false
})

// Share file functionality
const shareFile = (fileUrl) => {
  if (fileUrl) {
    // Create the full URL including the base URL of the application
    const fullUrl = new URL(window.location.href)
    fullUrl.pathname = '/'
    fullUrl.hash = '#/viewer'
    fullUrl.searchParams.set('file', fileUrl)
    
    shareUrl.value = fullUrl.toString()
    
    // Try to use the Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: 'View CSV File',
        text: 'Check out this CSV file',
        url: shareUrl.value
      }).catch(() => {
        // Fallback to copy to clipboard if share fails
        copyToClipboard()
      })
    } else {
      // If Web Share API is not available, show dialog or copy to clipboard
      copyToClipboard()
    }
  }
}

// Copy URL to clipboard
const copyToClipboard = () => {
  navigator.clipboard.writeText(shareUrl.value).then(() => {
    // Show success message
    shareSnackbar.value = true
  }).catch(err => {
    console.error('Could not copy text: ', err)
  })
}
</script>

<template>
  <v-app>
    <!-- Navigation Bar -->
    <v-app-bar color="primary" elevation="2">
      <v-container class="d-flex align-center py-0 app-container">
        <v-app-bar-title class="text-h5 font-weight-bold">
          Temp CSV
        </v-app-bar-title>
        <v-spacer></v-spacer>
        <v-tabs v-model="activeTab">
          <v-tab value="upload">Home</v-tab>
          <v-tab value="viewer">CSV Viewer</v-tab>
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
                <h1 class="text-h3 font-weight-bold mb-6">Temp CSV Online</h1>
                <p class="text-body-1 mb-8 mx-auto" style="max-width: 800px;">
                  Upload, view, update, and share CSV files online without registration.
                  Your files are securely stored and easily accessible whenever you need them. 
                  No login required!
                </p>
                
                <!-- Main Upload Area -->
                <v-sheet 
                  class="pa-8 mb-8 rounded-lg mx-auto csv-uploader-container" 
                  color="primary-lighten-5"
                  border
                  width="100%"
                >
                  <h2 class="text-h5 mb-4">Upload your CSV file</h2>
                  <CsvUploader 
                    @file-uploaded="handleFileUploaded" 
                    @view-file="openFileInViewer"
                  />
                </v-sheet>
                
                <!-- Recent Activity Section (Moved from Advanced Tools) -->
                <div class="tool-section" v-if="lastUploadedFile || lastUpdatedFile">
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
                                color="primary"
                                variant="tonal"
                                size="small"
                                class="mr-2"
                                @click="shareFile(lastUploadedFile.fileUrl)"
                                title="Share File"
                              >
                                <v-icon start>mdi-share-variant</v-icon>
                                Share
                              </v-btn>
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
                                color="primary"
                                variant="tonal"
                                size="small"
                                class="mr-2"
                                @click="shareFile(lastUpdatedFile.fileUrl)"
                                title="Share File"
                              >
                                <v-icon start>mdi-share-variant</v-icon>
                                Share
                              </v-btn>
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
                
                <!-- Features Section -->
                <v-row class="mt-12 justify-center">
                  <v-col cols="12" sm="4" md="4" class="feature-col">
                    <div class="feature-box">
                      <v-icon icon="mdi-shield-check" size="x-large" color="primary" class="mb-4"></v-icon>
                      <h3 class="text-h6 mb-2">One click upload</h3>
                      <p>Upload your CSV files with one click, no login required.</p>
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
                  <v-col cols="12" sm="4" md="4" class="feature-col">
                    <div class="feature-box">
                      <v-icon icon="mdi-delete-clock" size="x-large" color="primary" class="mb-4"></v-icon>
                      <h3 class="text-h6 mb-2">Auto Delete</h3>
                      <p>Files are automatically deleted after 7 days for your privacy.</p>
                    </div>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-container>
        </v-window-item>

        <!-- CSV Viewer Tab -->
        <v-window-item value="viewer">
          <v-container class="py-8 app-container">
            <h2 class="text-h4 mb-6">CSV Viewer & Editor</h2>            
            <!-- File URL Input -->
            <v-card class="mb-6">
              <v-card-title>
                <v-icon start icon="mdi-link-variant" class="mr-2"></v-icon>
                Enter CSV File URL
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="9">
                    <v-text-field
                      v-model="fileUrlInput"
                      label="Enter the URL of the CSV file you want to view"
                      placeholder="https://example.com/files/your-file.csv"
                      variant="outlined"
                      hide-details
                      @keyup.enter="loadFileFromUrl"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="3" class="d-flex align-center">
                    <v-btn 
                      color="primary" 
                      block
                      @click="loadFileFromUrl"
                      :disabled="!fileUrlInput"
                    >
                      <v-icon start>mdi-eye</v-icon>
                      View File
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
            
            <!-- Recently Viewed Files with Share Buttons -->
            <v-card v-if="viewedFiles.length > 0" class="mb-6">
              <v-card-title>
                <v-icon start icon="mdi-history" class="mr-2"></v-icon>
                Recently Viewed Files
              </v-card-title>
              <v-card-text>
                <v-chip-group>
                  <v-chip
                    v-for="(file, index) in viewedFiles"
                    :key="index"
                    color="primary"
                    variant="outlined"
                    class="mr-2 mb-2"
                  >
                    <v-icon start size="small">mdi-file-document-outline</v-icon>
                    {{ file.split('/').pop() }}
                    
                    <div class="d-flex align-center ml-2">
                      <v-btn
                        icon="mdi-eye"
                        variant="text"
                        size="x-small"
                        class="mr-1"
                        @click="openFileInViewer(file)"
                        title="View"
                      ></v-btn>
                      <v-btn
                        icon="mdi-share-variant"
                        variant="text"
                        size="x-small"
                        @click="shareFile(file)"
                        title="Share"
                      ></v-btn>
                    </div>
                  </v-chip>
                </v-chip-group>
              </v-card-text>
            </v-card>
            
            <div v-if="selectedFileForViewing" class="csv-viewer-container">
              <div class="d-flex justify-end mb-2">
                <v-btn 
                  color="error" 
                  variant="text" 
                  size="small"
                  @click="clearCurrentFile"
                >
                  <v-icon start>mdi-close</v-icon>
                  Close File
                </v-btn>
              </div>
              <CustomTableViewer 
                :fileUrl="selectedFileForViewing" 
                @file-updated="handleFileUpdated"
              />
            </div>
            
            <div v-else class="text-center py-8">
              <v-icon icon="mdi-file-search" size="x-large" color="grey" class="mb-4"></v-icon>
              <h3 class="text-h6 mb-2">No File Selected</h3>
              <p class="text-body-1">
                Please enter a CSV file URL above or select a file from the Recent Activity section.
              </p>
    </div>
          </v-container>
        </v-window-item>
        
        <!-- About Tab -->
        <v-window-item value="about">
          <AboutSection />
        </v-window-item>
      </v-window>
    </v-main>

    <v-footer class="bg-grey-lighten-3">
      <v-container class="app-container">
        <v-row>
          <v-col cols="12" md="4">
            <h3 class="text-h6 mb-2">Temp CSV</h3>
            <p class="text-body-2">
              Upload, view, update, and share CSV files online.
            </p>
          </v-col>
          <v-col cols="12" md="4" class="text-center">
            <p class="text-body-2">
              &copy; {{ new Date().getFullYear() }} Temp CSV
            </p>
          </v-col>
          <v-col cols="12" md="4" class="text-md-end">
            <v-btn icon="mdi-github" variant="text" href="https://github.com/open4game/tempcsv" target="_blank"></v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-footer>

    <!-- Share Snackbar -->
    <v-snackbar
      v-model="shareSnackbar"
      timeout="3000"
      color="success"
    >
      Link copied to clipboard!
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="shareSnackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
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
  max-width: 100% !important;
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
