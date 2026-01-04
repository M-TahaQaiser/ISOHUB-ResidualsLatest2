import { Router } from 'express';
import multer from 'multer';
import { BulkDataImportService } from '../services/BulkDataImportService';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'bulk-imports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

/**
 * POST /api/bulk-import/processor
 * Upload and import a single processor CSV file
 */
router.post('/processor', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { processorName, month, agencyId } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    if (!processorName || !month) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: processorName, month'
      });
    }

    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid month format. Expected YYYY-MM'
      });
    }

    console.log(`Processing bulk import: ${processorName} - ${month}`);

    const result = await BulkDataImportService.importProcessorData(
      file.path,
      processorName,
      month,
      agencyId ? parseInt(agencyId) : 1
    );

    // Clean up uploaded file
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      console.error('Failed to delete temp file:', err);
    }

    res.json({
      success: result.success,
      recordsImported: result.recordsImported,
      errors: result.errors,
      message: `Successfully imported ${result.recordsImported} records for ${processorName} - ${month}`
    });

  } catch (error: any) {
    console.error('Bulk import error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Import failed'
    });
  }
});

/**
 * POST /api/bulk-import/multiple
 * Upload and import multiple processor CSV files at once
 */
router.post('/multiple', upload.array('files', 50), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const { imports } = req.body; // JSON string of import configs

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    let importConfigs: Array<{
      fileName: string;
      processorName: string;
      month: string;
      agencyId?: number;
    }> = [];

    try {
      importConfigs = JSON.parse(imports);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid import configuration'
      });
    }

    // Match files with configs
    const importJobs = files.map(file => {
      const config = importConfigs.find(c => c.fileName === file.originalname);
      if (!config) {
        throw new Error(`No configuration found for file: ${file.originalname}`);
      }
      return {
        filePath: file.path,
        processorName: config.processorName,
        month: config.month,
        agencyId: config.agencyId || 1
      };
    });

    console.log(`Processing ${importJobs.length} bulk imports...`);

    const result = await BulkDataImportService.bulkImport(importJobs);

    // Clean up uploaded files
    files.forEach(file => {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Failed to delete temp file:', err);
      }
    });

    res.json({
      success: true,
      totalImported: result.totalImported,
      results: result.results,
      message: `Successfully imported ${result.totalImported} total records from ${files.length} files`
    });

  } catch (error: any) {
    console.error('Multiple bulk import error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Import failed'
    });
  }
});

/**
 * GET /api/bulk-import/processors
 * Get list of available processors for import
 */
router.get('/processors', async (req, res) => {
  try {
    const { db } = await import('../db');
    const { processors } = await import('../../shared/schema');
    
    const processorList = await db.select({
      id: processors.id,
      name: processors.name
    }).from(processors).orderBy(processors.name);

    res.json({
      success: true,
      processors: processorList
    });
  } catch (error: any) {
    console.error('Failed to fetch processors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch processors'
    });
  }
});

export default router;
