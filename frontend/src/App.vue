<script setup>
import { ref } from 'vue'
import { API_BASE_URL } from './config'
import CsvUploader from './components/CsvUploader.vue'
import CsvVerifier from './components/CsvVerifier.vue'
import CsvUpdater from './components/CsvUpdater.vue'
import CsvDownloader from './components/CsvDownloader.vue'

const lastUploadedFile = ref(null)
const lastVerifiedFile = ref(null)
const lastUpdatedFile = ref(null)

const handleFileUploaded = (result) => {
  lastUploadedFile.value = result
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
</script>

<template>
  <v-app>
    <v-app-bar color="primary" density="compact">
      <v-app-bar-title>CSV File Manager</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-github" variant="text" href="https://github.com/open4game/tempcsv" target="_blank"></v-btn>
    </v-app-bar>

    <v-main>
      <v-container>
        <v-row>
          <v-col cols="12">
            <v-sheet class="pa-4 mb-6" rounded>
              <h1 class="text-h4 mb-2">Cloudflare R2 CSV File Manager</h1>
              <p class="text-body-1">
                Upload, verify, update, and download CSV files stored in Cloudflare R2.
              </p>
              <div class="text-caption mt-2">
                API Endpoint: <code>{{ API_BASE_URL }}</code>
              </div>
            </v-sheet>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" md="6">
            <CsvUploader @file-uploaded="handleFileUploaded" />
            <CsvVerifier @file-verified="handleFileVerified" />
          </v-col>
          
          <v-col cols="12" md="6">
            <CsvUpdater @file-updated="handleFileUpdated" />
            <CsvDownloader />
          </v-col>
        </v-row>

        <v-row v-if="lastUploadedFile || lastVerifiedFile || lastUpdatedFile">
          <v-col cols="12">
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
                      <v-btn
                        icon="mdi-download"
                        variant="text"
                        size="small"
                        @click="openFile(lastUploadedFile.fileUrl)"
                      ></v-btn>
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
                      <v-btn
                        icon="mdi-download"
                        variant="text"
                        size="small"
                        @click="openFile(lastVerifiedFile.fileUrl)"
                      ></v-btn>
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
                      <v-btn
                        icon="mdi-download"
                        variant="text"
                        size="small"
                        @click="openFile(lastUpdatedFile.fileUrl)"
                      ></v-btn>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <v-footer app class="d-flex flex-column">
      <div class="px-4 py-2 text-center w-100">
        <span>&copy; {{ new Date().getFullYear() }} CSV File Manager</span>
      </div>
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
</style>
