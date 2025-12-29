import { describe, it, expect, beforeAll } from 'vitest';
import { ToolRegistry, AVAILABLE_TOOLS, ToolContext } from '../ai/ToolRegistry';

describe('ToolRegistry', () => {
  beforeAll(() => {
    ToolRegistry.initialize();
  });

  describe('Initialization', () => {
    it('should initialize with all available tools', () => {
      const tools = ToolRegistry.getAllTools();
      expect(tools.length).toBe(AVAILABLE_TOOLS.length);
    });

    it('should have at least 8 core tools', () => {
      const tools = ToolRegistry.getAllTools();
      expect(tools.length).toBeGreaterThanOrEqual(8);
    });

    it('should include merchant lookup tool', () => {
      const tool = ToolRegistry.getTool('lookup_merchant');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('lookup_merchant');
    });

    it('should include ISO-Sign tools', () => {
      const envelopeTool = ToolRegistry.getTool('get_envelope_status');
      const signatureTool = ToolRegistry.getTool('list_pending_signatures');
      expect(envelopeTool).toBeDefined();
      expect(signatureTool).toBeDefined();
    });

    it('should include onboarding tools', () => {
      const progressTool = ToolRegistry.getTool('get_onboarding_progress');
      const nextStepTool = ToolRegistry.getTool('get_next_onboarding_step');
      expect(progressTool).toBeDefined();
      expect(nextStepTool).toBeDefined();
    });
  });

  describe('Tool Definitions', () => {
    it('should have valid tool definitions with required fields', () => {
      const tools = ToolRegistry.getAllTools();
      for (const tool of tools) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(typeof tool.execute).toBe('function');
      }
    });

    it('should generate Anthropic-compatible tool schemas', () => {
      const anthropicTools = ToolRegistry.getToolsForAnthropic();
      expect(anthropicTools.length).toBeGreaterThan(0);
      
      for (const tool of anthropicTools) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.input_schema).toBeDefined();
        expect(tool.input_schema.type).toBe('object');
      }
    });
  });

  describe('Tool Parameter Validation', () => {
    it('lookup_merchant should require query parameter', () => {
      const tool = ToolRegistry.getTool('lookup_merchant');
      expect(tool?.parameters.query.required).toBe(true);
    });

    it('get_merchant_revenue should require mid parameter', () => {
      const tool = ToolRegistry.getTool('get_merchant_revenue');
      expect(tool?.parameters.mid.required).toBe(true);
    });

    it('calculate_commission should require all financial parameters', () => {
      const tool = ToolRegistry.getTool('calculate_commission');
      expect(tool?.parameters.revenue.required).toBe(true);
      expect(tool?.parameters.netPercentage.required).toBe(true);
      expect(tool?.parameters.rolePercentage.required).toBe(true);
    });
  });

  describe('Commission Calculator Tool', () => {
    it('should calculate commission correctly', async () => {
      const tool = ToolRegistry.getTool('calculate_commission');
      const context: ToolContext = { organizationId: 'test-org' };
      
      const result = await tool?.execute({
        revenue: 10000,
        netPercentage: 2.5,
        rolePercentage: 50
      }, context);

      expect(result?.success).toBe(true);
      expect(result?.data.revenue).toBe(10000);
      expect(result?.data.netAmount).toBe(250);
      expect(result?.data.commission).toBe(125);
      expect(result?.confidence).toBe(1.0);
    });

    it('should handle zero revenue', async () => {
      const tool = ToolRegistry.getTool('calculate_commission');
      const context: ToolContext = { organizationId: 'test-org' };
      
      const result = await tool?.execute({
        revenue: 0,
        netPercentage: 2.5,
        rolePercentage: 50
      }, context);

      expect(result?.success).toBe(true);
      expect(result?.data.commission).toBe(0);
    });
  });
});
