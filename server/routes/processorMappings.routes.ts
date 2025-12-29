import { Router } from "express";
import { storage } from "../storage";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import { PROCESSOR_TEMPLATE_FIELDS, insertProcessorColumnMappingSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

router.get("/template-fields", (req, res) => {
  res.json(PROCESSOR_TEMPLATE_FIELDS);
});

router.get("/", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.query.organizationId as string;
    if (!organizationId) {
      return res.status(400).json({ error: "Organization ID is required" });
    }

    const mappings = await storage.getProcessorColumnMappings(organizationId);
    res.json(mappings);
  } catch (error) {
    console.error("Error fetching processor mappings:", error);
    res.status(500).json({ error: "Failed to fetch processor mappings" });
  }
});

router.get("/:processorId", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.query.organizationId as string;
    const processorId = parseInt(req.params.processorId);
    
    if (!organizationId) {
      return res.status(400).json({ error: "Organization ID is required" });
    }
    
    if (isNaN(processorId)) {
      return res.status(400).json({ error: "Invalid processor ID" });
    }

    const mapping = await storage.getProcessorColumnMapping(organizationId, processorId);
    if (!mapping) {
      return res.status(404).json({ error: "Mapping not found" });
    }
    
    res.json(mapping);
  } catch (error) {
    console.error("Error fetching processor mapping:", error);
    res.status(500).json({ error: "Failed to fetch processor mapping" });
  }
});

const createMappingSchema = z.object({
  organizationId: z.string().min(1),
  processorId: z.number(),
  processorName: z.string().min(1),
  mappingName: z.string().optional(),
  columnMappings: z.record(z.string(), z.string()),
  sampleHeaders: z.array(z.string()).optional(),
  isDefault: z.boolean().optional().default(true),
});

router.post("/", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const validationResult = createMappingSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid mapping data", 
        details: validationResult.error.issues 
      });
    }

    const { organizationId, processorId, processorName, mappingName, columnMappings, sampleHeaders, isDefault } = validationResult.data;
    
    const requiredFields = PROCESSOR_TEMPLATE_FIELDS.filter(f => f.required).map(f => f.key);
    const mappedFields = Object.values(columnMappings);
    const missingRequired = requiredFields.filter(f => !mappedFields.includes(f));
    
    if (missingRequired.length > 0) {
      return res.status(400).json({ 
        error: "Missing required field mappings", 
        missingFields: missingRequired 
      });
    }

    const existingMapping = await storage.getProcessorColumnMapping(organizationId, processorId);
    if (existingMapping) {
      if (isDefault) {
        await storage.updateProcessorColumnMapping(existingMapping.id, { isDefault: false });
      }
    }

    const mapping = await storage.createProcessorColumnMapping({
      organizationId,
      processorId,
      processorName,
      mappingName,
      columnMappings,
      sampleHeaders,
      isDefault,
    });

    res.status(201).json(mapping);
  } catch (error) {
    console.error("Error creating processor mapping:", error);
    res.status(500).json({ error: "Failed to create processor mapping" });
  }
});

router.put("/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid mapping ID" });
    }

    const { columnMappings, mappingName, isDefault } = req.body;
    
    const updated = await storage.updateProcessorColumnMapping(id, {
      columnMappings,
      mappingName,
      isDefault,
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating processor mapping:", error);
    res.status(500).json({ error: "Failed to update processor mapping" });
  }
});

router.delete("/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid mapping ID" });
    }

    await storage.deleteProcessorColumnMapping(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting processor mapping:", error);
    res.status(500).json({ error: "Failed to delete processor mapping" });
  }
});

router.post("/parse-headers", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { headers, processorId, organizationId } = req.body;
    
    if (!headers || !Array.isArray(headers)) {
      return res.status(400).json({ error: "Headers array is required" });
    }

    const existingMapping = processorId && organizationId 
      ? await storage.getProcessorColumnMapping(organizationId, processorId)
      : null;

    const suggestions: Record<string, string> = {};
    const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    const fieldMappingHints: Record<string, string[]> = {
      mid: ['mid', 'merchantid', 'merchantnumber', 'merchantnum', 'merchantno', 'merchant_id'],
      merchantName: ['merchantname', 'dba', 'businessname', 'merchant', 'name', 'doingbusinessas'],
      transactions: ['transactions', 'txns', 'transactioncount', 'numtrans', 'count', 'txncount'],
      salesAmount: ['salesamount', 'volume', 'salesvolume', 'totalvolume', 'totalsales', 'sales', 'amount'],
      income: ['income', 'revenue', 'grossrevenue', 'grossincome', 'gross'],
      expenses: ['expenses', 'costs', 'fees', 'processingcosts', 'cost'],
      net: ['net', 'netrevenue', 'netincome', 'profit', 'residual', 'netprofit'],
      bps: ['bps', 'basispoints', 'rate', 'effectiverate', 'margin'],
      repNet: ['repnet', 'agentnet', 'repshare', 'commission', 'agentcommission'],
      approvalDate: ['approvaldate', 'approved', 'dateapproved', 'startdate', 'activationdate'],
      groupCode: ['groupcode', 'branchid', 'branch', 'group', 'office', 'agentcode', 'repcode'],
      status: ['status', 'accountstatus', 'merchantstatus', 'state', 'active'],
    };

    headers.forEach((header, index) => {
      const normalizedHeader = normalizedHeaders[index];
      
      for (const [field, hints] of Object.entries(fieldMappingHints)) {
        if (hints.includes(normalizedHeader)) {
          suggestions[header] = field;
          break;
        }
      }
    });

    if (existingMapping && existingMapping.columnMappings) {
      const existingMappings = existingMapping.columnMappings as Record<string, string>;
      for (const [sourceCol, targetField] of Object.entries(existingMappings)) {
        if (headers.includes(sourceCol) && !suggestions[sourceCol]) {
          suggestions[sourceCol] = targetField;
        }
      }
    }

    res.json({
      headers,
      suggestions,
      templateFields: PROCESSOR_TEMPLATE_FIELDS,
      existingMapping: existingMapping ? {
        id: existingMapping.id,
        processorName: existingMapping.processorName,
        version: existingMapping.version,
      } : null,
    });
  } catch (error) {
    console.error("Error parsing headers:", error);
    res.status(500).json({ error: "Failed to parse headers" });
  }
});

export default router;
