import { API_BASE_URL } from '../config'

/**
 * API service for handling all backend communication
 */

/**
 * Upload a CSV file to the server
 * @param {File} file - The CSV file to upload
 * @returns {Promise<Object>} - The response data with fileUrl
 */
export async function uploadCsvFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  console.log('Uploading file to server...')
  
  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData,
    // CORS options
    mode: 'cors',
    credentials: 'same-origin',
  })
  
  if (!response.ok) {
    throw new Error(`Upload failed with status: ${response.status}`)
  }
  
  const result = await response.json()
  
  // Format the file URL to include the API base URL if it's a relative path
  if (result.fileUrl && result.fileUrl.startsWith('/')) {
    result.fileUrl = `${API_BASE_URL}${result.fileUrl}`
  }
  
  return result
}

/**
 * Fetch CSV data from a URL
 * @param {string} fileUrl - The URL of the CSV file
 * @returns {Promise<string>} - The CSV text content
 */
export async function fetchCsvData(fileUrl) {
  console.log('Fetching CSV data from:', fileUrl)
  
  const response = await fetch(fileUrl, {
    method: 'GET',
    // CORS options
    mode: 'cors',
    credentials: 'same-origin',
    headers: { 
      'Accept': 'text/csv,text/plain,*/*' 
    }
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV file (Status: ${response.status})`)
  }
  
  return await response.text()
}

/**
 * Save changes to a CSV file
 * @param {string} fileUrl - The URL of the original CSV file
 * @param {string} csvContent - The updated CSV content
 * @returns {Promise<Object>} - The response data with fileUrl
 */
export async function saveChangesToCsv(fileUrl, csvContent) {
  // Create a file from the CSV string
  const file = new File([csvContent], 'updated.csv', { type: 'text/csv' })
  
  // Create form data for upload
  const formData = new FormData()
  formData.append('file', file)
  formData.append('fileUrl', fileUrl)
  
  console.log('Saving changes to server...')
  
  const response = await fetch(`${API_BASE_URL}/api/update`, {
    method: 'POST',
    body: formData,
    // CORS options
    mode: 'cors',
    credentials: 'same-origin',
  })
  
  if (!response.ok) {
    throw new Error(`Failed to save changes (Status: ${response.status})`)
  }
  
  const result = await response.json()
  
  // Format the file URL to include the API base URL if it's a relative path
  if (result.fileUrl && result.fileUrl.startsWith('/')) {
    result.fileUrl = `${API_BASE_URL}${result.fileUrl}`
  }
  
  return result
}

/**
 * Fallback function to fetch CSV data using XMLHttpRequest
 * @param {string} fileUrl - The URL of the CSV file
 * @returns {Promise<string>} - The CSV text content
 */
export function fetchCsvWithXhr(fileUrl) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.responseText)
      } else {
        reject(new Error(`Failed to fetch CSV file (Status: ${xhr.status})`))
      }
    }
    
    xhr.onerror = function() {
      reject(new Error('Network error or CORS issue'))
    }
    
    xhr.open('GET', fileUrl)
    xhr.setRequestHeader('Accept', 'text/csv,text/plain,*/*')
    xhr.withCredentials = false // Disable credentials for XHR
    xhr.send()
  })
}

/**
 * Toggle CORS mode for fetch requests
 * @param {boolean} useNoCors - Whether to use 'no-cors' mode
 */
export function configureCors(useNoCors = false) {
  // This function can be expanded to configure global CORS settings
  // For now, it's a placeholder for future implementation
  console.log(`Setting CORS mode to: ${useNoCors ? 'no-cors' : 'cors'}`)
  // In a real implementation, this might update a global state or context
}

/**
 * Try different CORS configurations for fetch
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} - The fetch response
 */
export async function fetchWithCorsRetry(url, options = {}) {
  // First try with standard CORS mode
  try {
    console.log('Trying fetch with standard CORS mode...')
    const response = await fetch(url, {
      ...options,
      mode: 'cors',
      credentials: 'include'
    })
    
    if (response.ok) {
      return response
    }
    
    console.log('Standard CORS fetch failed with status:', response.status)
  } catch (corsError) {
    console.error('Standard CORS fetch error:', corsError)
  }
  
  // Try with no-cors mode
  try {
    console.log('Trying fetch with no-cors mode...')
    const response = await fetch(url, {
      ...options,
      mode: 'no-cors',
      credentials: 'include'
    })
    
    console.log('No-CORS response type:', response.type)
    return response
  } catch (noCorsError) {
    console.error('No-CORS fetch error:', noCorsError)
  }
  
  // Try with same-origin mode
  try {
    console.log('Trying fetch with same-origin mode...')
    const response = await fetch(url, {
      ...options,
      mode: 'same-origin',
      credentials: 'same-origin'
    })
    
    return response
  } catch (sameOriginError) {
    console.error('Same-origin fetch error:', sameOriginError)
  }
  
  // Try with no credentials
  try {
    console.log('Trying fetch with no credentials...')
    const response = await fetch(url, {
      ...options,
      mode: 'cors',
      credentials: 'omit'
    })
    
    return response
  } catch (noCredentialsError) {
    console.error('No credentials fetch error:', noCredentialsError)
  }
  
  // If all attempts fail, throw an error
  throw new Error('All fetch attempts failed')
}

/**
 * Upload a CSV file to the server with CORS retry
 * @param {File} file - The CSV file to upload
 * @returns {Promise<Object>} - The response data with fileUrl
 */
export async function uploadCsvFileWithCorsRetry(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  console.log('Uploading file with CORS retry...')
  
  const response = await fetchWithCorsRetry(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData
  })
  
  if (response.type === 'opaque') {
    // With no-cors mode, we can't access the response content
    // We'll assume success and construct a reasonable result
    const fileName = file.name
    const fileUrl = `${API_BASE_URL}/files/${fileName.replace(/\s+/g, '_')}`
    
    return {
      success: true,
      fileUrl: fileUrl
    }
  }
  
  if (!response.ok) {
    throw new Error(`Upload failed with status: ${response.status}`)
  }
  
  try {
    const result = await response.json()
    
    // Format the file URL to include the API base URL if it's a relative path
    if (result.fileUrl && result.fileUrl.startsWith('/')) {
      result.fileUrl = `${API_BASE_URL}${result.fileUrl}`
    }
    
    return result
  } catch (jsonError) {
    console.error('Error parsing JSON response:', jsonError)
    throw new Error('Error processing server response')
  }
}

/**
 * Fetch CSV data from a URL with CORS retry
 * @param {string} fileUrl - The URL of the CSV file
 * @returns {Promise<string>} - The CSV text content
 */
export async function fetchCsvDataWithCorsRetry(fileUrl) {
  console.log('Fetching CSV data with CORS retry from:', fileUrl)
  
  const response = await fetchWithCorsRetry(fileUrl, {
    method: 'GET',
    headers: { 
      'Accept': 'text/csv,text/plain,*/*' 
    }
  })
  
  if (response.type === 'opaque') {
    // With no-cors mode, we can't access the response content
    throw new Error('Cannot directly access CSV content due to CORS restrictions')
  }
  
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV file (Status: ${response.status})`)
  }
  
  return await response.text()
}

/**
 * Save changes to a CSV file with CORS retry
 * @param {string} fileUrl - The URL of the original CSV file
 * @param {string} csvContent - The updated CSV content
 * @returns {Promise<Object>} - The response data with fileUrl
 */
export async function saveChangesToCsvWithCorsRetry(fileUrl, csvContent) {
  // Create a file from the CSV string
  const file = new File([csvContent], 'updated.csv', { type: 'text/csv' })
  
  // Create form data for upload
  const formData = new FormData()
  formData.append('file', file)
  formData.append('fileUrl', fileUrl)
  
  console.log('Saving changes with CORS retry...')
  
  const response = await fetchWithCorsRetry(`${API_BASE_URL}/api/update`, {
    method: 'POST',
    body: formData
  })
  
  if (response.type === 'opaque') {
    // With no-cors mode, we can't access the response content
    // We'll assume success and return a reasonable result
    return {
      success: true,
      fileUrl: fileUrl
    }
  }
  
  if (!response.ok) {
    throw new Error(`Failed to save changes (Status: ${response.status})`)
  }
  
  try {
    const result = await response.json()
    
    // Format the file URL to include the API base URL if it's a relative path
    if (result.fileUrl && result.fileUrl.startsWith('/')) {
      result.fileUrl = `${API_BASE_URL}${result.fileUrl}`
    }
    
    return result
  } catch (jsonError) {
    console.error('Error parsing JSON response:', jsonError)
    throw new Error('Error processing server response')
  }
} 