import { Router } from 'express';
import multer from 'multer';
import csvParser from 'csv-parser';
import * as XLSX from 'xlsx';
import { DataValidationService } from '../services/DataValidationService.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Validate uploaded file before processing
router.post('/validate-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { processor } = req.body;
    if (!processor) {
      return res.status(400).json({ error: 'Processor type is required' });
    }

    let data: any[] = [];
    const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();

    try {
      if (fileExtension === 'csv') {
        // Parse CSV
        const csvContent = req.file.buffer.toString('utf-8');
        const rows = csvContent.split('\n');
        const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        for (let i = 1; i < rows.length; i++) {
          if (rows[i].trim()) {
            const values = rows[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const rowObj: any = {};
            headers.forEach((header, index) => {
              rowObj[header] = values[index] || '';
            });
            data.push(rowObj);
          }
        }
      } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
        // Parse Excel
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
      } else {
        return res.status(400).json({ error: 'Unsupported file format. Please use CSV or Excel files.' });
      }

      // Perform validation
      const validationResult = DataValidationService.validateProcessorData(processor, data);
      
      // Generate detailed report
      const report = DataValidationService.generateValidationReport(validationResult);

      res.json({
        success: true,
        validation: validationResult,
        report,
        preview: data.slice(0, 5), // First 5 rows for preview
        totalRows: data.length
      });

    } catch (parseError) {
      console.error('File parsing error:', parseError);
      res.status(400).json({ 
        error: 'Failed to parse file. Please check file format and structure.',
        details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
      });
    }

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ 
      error: 'Validation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get validation rules for a specific processor
router.get('/validation-rules/:processor', (req, res) => {
  const { processor } = req.params;
  
  const rules = {
    'Payment Advisors': {
      requiredFields: ['Merchant Name', 'MID', 'Amount', 'Date'],
      fieldValidation: {
        'MID': 'Must be numeric',
        'Amount': 'Must be positive number',
        'Date': 'Must be YYYY-MM-DD format'
      },
      businessRules: [
        'Amount should typically be between $1 and $10,000',
        'MID should be at least 6 digits',
        'Date should not be in the future'
      ]
    },
    'Clearent': {
      requiredFields: ['Merchant', 'MID', 'Residual', 'Processing Date'],
      fieldValidation: {
        'MID': 'Must be numeric',
        'Residual': 'Must be positive number',
        'Processing Date': 'Must be MM/DD/YYYY format'
      },
      businessRules: [
        'Residual should typically be between $1 and $10,000',
        'MID should be at least 6 digits',
        'Processing Date should not be in the future'
      ]
    },
    'Global Payments TSYS': {
      requiredFields: ['DBA Name', 'Merchant ID', 'Net Amount', 'Statement Date'],
      fieldValidation: {
        'Merchant ID': 'Must be numeric',
        'Net Amount': 'Must be positive number',
        'Statement Date': 'Must be MM/DD/YYYY format'
      },
      businessRules: [
        'Net Amount should typically be between $1 and $10,000',
        'Merchant ID should be at least 6 digits',
        'Statement Date should not be in the future'
      ]
    }
  };

  const processorRules = rules[processor as keyof typeof rules];
  if (!processorRules) {
    return res.status(404).json({ error: 'Validation rules not found for this processor' });
  }

  res.json({
    processor,
    rules: processorRules
  });
});

export { router as validationRoutes };