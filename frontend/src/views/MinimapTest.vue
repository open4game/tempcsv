<script setup>
import { ref, onMounted, nextTick } from 'vue'
import TableMinimap from '../components/TableMinimap.vue'

// Table data
const rows = ref([])
const columns = ref([])
const scrollableElement = ref(null)
const showMinimap = ref(false)
const tableHeight = ref(400)
const tableWidth = ref('100%')
const rowCount = ref(100)
const colCount = ref(20)

// Generate test data
const generateData = () => {
  // Generate columns
  const cols = []
  for (let i = 0; i < colCount.value; i++) {
    cols.push({
      label: `Column ${i + 1}`,
      field: `col${i}`,
      sortable: true
    })
  }
  columns.value = cols
  
  // Generate rows
  const data = []
  for (let i = 0; i < rowCount.value; i++) {
    const row = {}
    for (let j = 0; j < colCount.value; j++) {
      row[`col${j}`] = `Row ${i + 1}, Cell ${j + 1}`
    }
    data.push(row)
  }
  rows.value = data
}

// Update table dimensions
const updateTableDimensions = () => {
  if (scrollableElement.value) {
    scrollableElement.value.style.height = `${tableHeight.value}px`
    scrollableElement.value.style.width = tableWidth.value
  }
}

// Regenerate data with new dimensions
const regenerateData = () => {
  generateData()
  nextTick(() => {
    updateTableDimensions()
    // Update minimap if visible
    if (showMinimap.value && minimapRef.value) {
      minimapRef.value.updateMinimapViewport()
    }
  })
}

// Handle scroll events
const handleScroll = (event) => {
  if (minimapRef.value) {
    minimapRef.value.handleTableScroll()
  }
}

// Reference to the minimap component
const minimapRef = ref(null)

// Initialize
onMounted(() => {
  generateData()
  nextTick(() => {
    updateTableDimensions()
    
    // Add scroll event listener
    if (scrollableElement.value) {
      scrollableElement.value.addEventListener('scroll', handleScroll)
    }
  })
})
</script>

<template>
  <div class="minimap-test-container">
    <h1>Table Minimap Test</h1>
    
    <v-card class="mb-4">
      <v-card-title>Test Controls</v-card-title>
      <v-card-text>
        <div class="d-flex flex-wrap gap-4">
          <v-text-field
            v-model="rowCount"
            label="Number of Rows"
            type="number"
            min="10"
            max="1000"
            @change="regenerateData"
          ></v-text-field>
          
          <v-text-field
            v-model="colCount"
            label="Number of Columns"
            type="number"
            min="5"
            max="50"
            @change="regenerateData"
          ></v-text-field>
          
          <v-text-field
            v-model="tableHeight"
            label="Table Height (px)"
            type="number"
            min="200"
            max="800"
            @change="updateTableDimensions"
          ></v-text-field>
          
          <v-select
            v-model="tableWidth"
            label="Table Width"
            :items="['100%', '120%', '150%', '200%', '300%']"
            @change="updateTableDimensions"
          ></v-select>
        </div>
        
        <v-switch
          v-model="showMinimap"
          label="Show Minimap"
          color="primary"
        ></v-switch>
        
        <div class="d-flex gap-2">
          <v-btn color="primary" @click="regenerateData">
            Regenerate Data
          </v-btn>
          
          <v-btn 
            color="secondary" 
            @click="minimapRef?.scrollToTop()"
            :disabled="!showMinimap"
          >
            Scroll to Top
          </v-btn>
          
          <v-btn 
            color="secondary" 
            @click="minimapRef?.scrollToBottom()"
            :disabled="!showMinimap"
          >
            Scroll to Bottom
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
    
    <v-card>
      <v-card-title>Test Table</v-card-title>
      <v-card-text>
        <div class="table-container">
          <div 
            ref="scrollableElement" 
            class="scrollable-table"
          >
            <table>
              <thead>
                <tr>
                  <th v-for="(col, index) in columns" :key="index">
                    {{ col.label }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rowIndex) in rows" :key="rowIndex">
                  <td v-for="(col, colIndex) in columns" :key="colIndex">
                    {{ row[col.field] }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Table Minimap Component -->
    <TableMinimap
      ref="minimapRef"
      :scrollable-element="scrollableElement"
      :rows="rows"
      :columns="columns"
      :visible="showMinimap"
      @update:visible="showMinimap = $event"
    />
  </div>
</template>

<style scoped>
.minimap-test-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.table-container {
  position: relative;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.scrollable-table {
  overflow: auto;
  height: 400px;
  width: 100%;
}

table {
  border-collapse: collapse;
  width: 100%;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f5f5f5;
  position: sticky;
  top: 0;
  z-index: 1;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}

.gap-4 {
  gap: 16px;
}

.gap-2 {
  gap: 8px;
}
</style> 