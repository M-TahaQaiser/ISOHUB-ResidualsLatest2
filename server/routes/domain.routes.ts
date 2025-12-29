import express from 'express';
import { DomainEmailService } from '../services/DomainEmailService';

const router = express.Router();

// Get domain setup instructions
router.post('/setup-instructions', async (req, res) => {
  try {
    const { agencyId, domainType, customDomain, subdomainPrefix } = req.body;

    if (!agencyId || !domainType) {
      return res.status(400).json({ error: 'Agency ID and domain type are required' });
    }

    const instructions = DomainEmailService.generateDomainSetupInstructions(
      agencyId,
      domainType,
      customDomain,
      subdomainPrefix
    );

    res.json(instructions);
  } catch (error) {
    console.error('Error generating setup instructions:', error);
    res.status(500).json({ error: 'Failed to generate setup instructions' });
  }
});

// Verify domain ownership
router.post('/verify-ownership', async (req, res) => {
  try {
    const { domain, verificationCode } = req.body;

    if (!domain || !verificationCode) {
      return res.status(400).json({ error: 'Domain and verification code are required' });
    }

    const result = await DomainEmailService.verifyDomainOwnership(domain, verificationCode);
    res.json(result);
  } catch (error) {
    console.error('Error verifying domain ownership:', error);
    res.status(500).json({ error: 'Failed to verify domain ownership' });
  }
});

// Check subdomain availability
router.get('/check-subdomain/:prefix', async (req, res) => {
  try {
    const { prefix } = req.params;

    if (!prefix) {
      return res.status(400).json({ error: 'Subdomain prefix is required' });
    }

    // Validate subdomain format
    const isValidFormat = /^[a-z0-9-]+$/.test(prefix) && prefix.length >= 3 && prefix.length <= 63;
    if (!isValidFormat) {
      return res.json({ 
        isAvailable: false, 
        message: 'Invalid subdomain format. Use only lowercase letters, numbers, and hyphens (3-63 characters)' 
      });
    }

    const isAvailable = await DomainEmailService.checkSubdomainAvailability(prefix);
    
    res.json({
      isAvailable,
      message: isAvailable 
        ? `${prefix}.isohub.io is available` 
        : `${prefix}.isohub.io is already taken`,
      subdomain: `${prefix}.isohub.io`
    });
  } catch (error) {
    console.error('Error checking subdomain availability:', error);
    res.status(500).json({ error: 'Failed to check subdomain availability' });
  }
});

// Update domain configuration
router.put('/configure/:agencyId', async (req, res) => {
  try {
    const { agencyId } = req.params;
    const { domainType, customDomain, subdomainPrefix, dnsProvider } = req.body;

    if (!agencyId) {
      return res.status(400).json({ error: 'Agency ID is required' });
    }

    const updatedAgency = await DomainEmailService.updateDomainConfiguration(
      parseInt(agencyId),
      { domainType, customDomain, subdomainPrefix, dnsProvider }
    );

    res.json(updatedAgency);
  } catch (error) {
    console.error('Error updating domain configuration:', error);
    res.status(500).json({ error: 'Failed to update domain configuration' });
  }
});

// Get domain status
router.get('/status/:agencyId', async (req, res) => {
  try {
    const { agencyId } = req.params;

    if (!agencyId) {
      return res.status(400).json({ error: 'Agency ID is required' });
    }

    const status = await DomainEmailService.getDomainStatus(parseInt(agencyId));
    res.json(status);
  } catch (error) {
    console.error('Error getting domain status:', error);
    res.status(500).json({ error: 'Failed to get domain status' });
  }
});

export default router;