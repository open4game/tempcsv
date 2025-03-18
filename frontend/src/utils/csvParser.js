/**
 * CSV Parser Utility using PapaParse
 * 
 * A robust CSV parser implementation that utilizes the PapaParse library.
 * This handles:
 * - Quoted fields (with escaped quotes)
 * - Different delimiters
 * - Headers detection
 * - Empty lines
 * - Windows/Unix line endings
 * - Row index columns detection
 */
import Papa from 'papaparse';

/**
 * Parse CSV text to structured data
 * @param {string} csvText - Raw CSV text to parse
 * @param {Object} options - Parser options
 * @param {string} options.delimiter - CSV delimiter (default: auto-detect)
 * @param {boolean} options.hasHeaders - Whether CSV has headers (default: true)
 * @param {boolean} options.detectRowIndex - Detect if first column is row index (default: true)
 * @param {boolean} options.skipEmptyLines - Skip empty lines (default: true)
 * @param {boolean} options.dynamicTyping - Auto-convert numbers/booleans (default: false)
 * @returns {Object} Parsed data with columns and rows
 */
export function parseCSV(csvText, options = {}) {
  // Default options
  const {
    delimiter = '',
    hasHeaders = true,
    detectRowIndex = true,
    skipEmptyLines = true,
    dynamicTyping = false
  } = options;
  
  // Handle empty input
  if (!csvText || csvText.trim() === '') {
    throw new Error('CSV content is empty');
  }
  
  // Parse with PapaParse
  const parseResult = Papa.parse(csvText, {
    header: hasHeaders,
    skipEmptyLines: skipEmptyLines,
    delimiter: delimiter || undefined, // PapaParse will auto-detect if empty
    dynamicTyping: dynamicTyping, // Convert numbers and booleans if true
    transformHeader: header => header.trim(),
    error: (error) => {
      throw new Error(`CSV parsing error: ${error.message}`);
    }
  });
  
  if (parseResult.errors && parseResult.errors.length > 0) {
    console.warn('CSV parsing warnings:', parseResult.errors);
  }
  
  // If we have no data, throw an error
  if (!parseResult.data || parseResult.data.length === 0) {
    throw new Error('CSV file contains no data');
  }
  
  // Determine if the first column is a row index
  let hasRowIndex = false;
  if (detectRowIndex && parseResult.data.length > 1) {
    const fields = hasHeaders ? Object.keys(parseResult.data[0]) : [];
    if (fields.length > 0) {
      const firstField = fields[0];
      
      // Check if the first column looks like an index
      const firstColumn = parseResult.data.map(row => 
        hasHeaders ? row[firstField] : row[0]
      );
      
      const isNumeric = firstColumn.every(val => 
        val !== undefined && val !== null && /^\d+$/.test(String(val).trim())
      );
      
      const isSequential = isNumeric && 
        firstColumn.every((val, idx) => 
          parseInt(String(val).trim()) === idx + 1
        );
        
      hasRowIndex = isSequential || 
        (isNumeric && firstColumn[0].trim() === '1' && 
         parseInt(String(firstColumn[firstColumn.length - 1]).trim()) === firstColumn.length);
    }
  }
  
  // Create column definitions
  let columnDefs = [];
  
  if (hasHeaders) {
    const fieldNames = Object.keys(parseResult.data[0] || {});
    const startIdx = hasRowIndex ? 1 : 0;
    
    columnDefs = fieldNames.slice(startIdx).map((field, index) => ({
      field: field,
      label: field || `Column ${index + 1}`,
      sortable: true
    }));
  } else {
    // For non-header CSV, create columns based on the first row
    const firstRow = parseResult.data[0] || [];
    const startIdx = hasRowIndex ? 1 : 0;
    
    columnDefs = Array.from({ length: firstRow.length - startIdx }, (_, index) => ({
      field: `Column${index + 1}`,
      label: `Column ${index + 1}`,
      sortable: true
    }));
    
    // Convert array data to objects with column names
    parseResult.data = parseResult.data.map(row => {
      const obj = {};
      for (let i = startIdx; i < row.length; i++) {
        obj[`Column${i - startIdx + 1}`] = row[i];
      }
      return obj;
    });
  }
  
  return {
    columns: columnDefs,
    rows: parseResult.data,
    hasRowIndex,
    meta: parseResult.meta
  };
}

/**
 * Convert data back to CSV format
 * @param {Array} data - Array of data objects
 * @param {Array} columns - Array of column definitions
 * @param {Object} options - Conversion options
 * @param {string} options.delimiter - CSV delimiter (default: ',')
 * @returns {string} CSV formatted string
 */
export function convertToCSV(data, columns, options = {}) {
  if (!data || data.length === 0) return '';
  if (!columns || columns.length === 0) return '';
  
  const { delimiter = ',' } = options;
  
  // Get fields from columns
  const fields = columns.map(col => col.field);
  
  // Convert to CSV using PapaParse
  const csv = Papa.unparse({
    fields: fields,
    data: data.map(row => {
      // Ensure we have values for all fields
      return fields.map(field => row[field] !== undefined ? row[field] : '');
    })
  }, {
    delimiter: delimiter,
    header: true
  });
  
  return csv;
}

/**
 * Detect the most likely delimiter in a CSV string
 * @param {string} csvText - CSV text to analyze
 * @returns {string} Detected delimiter
 */
export function detectDelimiter(csvText) {
  if (!csvText) return ',';
  
  // Use PapaParse's auto-detection
  const parseResult = Papa.parse(csvText, { 
    preview: 1,  // Only parse first line for delimiter detection
    delimitersToGuess: [',', ';', '\t', '|']
  });
  
  // If PapaParse detected a delimiter, use it
  if (parseResult.meta && parseResult.meta.delimiter) {
    return parseResult.meta.delimiter;
  }
  
  // Fallback to comma if detection fails
  return ',';
} 