import { db } from '../../db';
import { aiKnowledgeBase } from '../../../shared/schema';

interface FAQEntry {
  category: string;
  question: string;
  answer: string;
  keywords?: string[];
}

export class KnowledgeBaseSeeder {
  // Comprehensive merchant services FAQ data from ISO-AI
  private static faqEntries: FAQEntry[] = [
    // Commission Structures
    {
      category: 'commission',
      question: 'What is a typical residual split for independent sales agents?',
      answer: 'Independent sales agents typically receive 50-70% of the residual income generated from their merchant accounts. Top producers may negotiate splits up to 80%. The exact percentage depends on factors like volume, experience, and whether you provide your own leads.',
      keywords: ['residual', 'split', 'commission', 'percentage']
    },
    {
      category: 'commission',
      question: 'How are bonuses calculated in merchant services?',
      answer: 'Bonuses are typically calculated based on: 1) Upfront bonuses ($100-$500 per new account), 2) Volume bonuses (tiered based on monthly processing volume), 3) Profitability bonuses (based on basis points over buy rate), 4) Portfolio bonuses (for maintaining account retention above 90%).',
      keywords: ['bonus', 'upfront', 'volume', 'calculation']
    },
    {
      category: 'commission',
      question: 'What is the difference between buy rate and sell rate?',
      answer: 'Buy rate is the wholesale rate you pay to the processor (typically Interchange + 0.05% to 0.10% and $0.05). Sell rate is what you charge the merchant. Your profit margin is the difference. Example: Buy rate = IC + 0.08% + $0.05, Sell rate = IC + 0.35% + $0.10, Your margin = 0.27% + $0.05 per transaction.',
      keywords: ['buy rate', 'sell rate', 'margin', 'profit']
    },
    {
      category: 'commission',
      question: 'How long does it take to receive residual payments?',
      answer: 'Residual payments are typically paid monthly, 30-60 days in arrears. For example, January processing residuals are paid in late February or March. The exact timing depends on your ISO/processor agreement. Some processors offer weekly or bi-weekly advances on residuals.',
      keywords: ['residual', 'payment', 'timing', 'monthly']
    },
    {
      category: 'commission',
      question: 'What happens to my residuals if I leave the industry?',
      answer: 'Most ISO agreements allow you to keep receiving residuals as long as the accounts remain active. However, you may lose the right to add new accounts. Some agreements have vesting schedules (3-5 years typical) or buyout clauses. Always negotiate for "lifetime vested residuals" in your contract.',
      keywords: ['residuals', 'vesting', 'lifetime', 'contract']
    },

    // Underwriting
    {
      category: 'underwriting',
      question: 'What documents are required for merchant account underwriting?',
      answer: 'Standard requirements: 1) Business license or DBA, 2) 3 months of bank statements, 3) 3 months of processing statements (if currently processing), 4) Voided check, 5) Driver\'s license of signer, 6) Business tax ID (EIN). High-risk may require: financial statements, business plan, supplier invoices.',
      keywords: ['documents', 'underwriting', 'requirements', 'application']
    },
    {
      category: 'underwriting',
      question: 'What qualifies as a high-risk merchant?',
      answer: 'High-risk indicators include: 1) Poor credit (below 500), 2) High-risk MCC codes (gambling, adult, CBD, etc.), 3) High ticket amounts (over $5,000), 4) International/MOTO/e-commerce over 50%, 5) Previous TMF listing, 6) High chargeback ratios (over 1%). These require specialized underwriting.',
      keywords: ['high-risk', 'merchant', 'underwriting', 'TMF']
    },
    {
      category: 'underwriting',
      question: 'How long does underwriting typically take?',
      answer: 'Standard retail accounts: 24-48 hours. Restaurant/service: 2-3 days. E-commerce: 3-5 days. High-risk: 5-10 business days. Expedited same-day approval is available for qualified low-risk retail merchants with clean history and good credit (650+).',
      keywords: ['underwriting', 'approval', 'timeline', 'processing']
    },
    {
      category: 'underwriting',
      question: 'What is a merchant cash advance and how does it affect underwriting?',
      answer: 'An MCA is a lump sum payment in exchange for a percentage of future sales. Having an MCA can complicate underwriting as it creates a lien on receivables. Many processors require MCA payoff or subordination agreements. Multiple MCAs often result in decline. Best practice: disclose all MCAs upfront.',
      keywords: ['MCA', 'cash advance', 'underwriting', 'lien']
    },
    {
      category: 'underwriting',
      question: 'What is the MATCH list (TMF)?',
      answer: 'The MATCH (Member Alert to Control High-risk) list, formerly TMF (Terminated Merchant File), is a database of merchants terminated for cause. Reasons include excessive chargebacks, fraud, money laundering, or PCI violations. Being on MATCH makes it nearly impossible to get standard processing for 5 years.',
      keywords: ['MATCH', 'TMF', 'terminated', 'high-risk']
    },

    // Sales Techniques
    {
      category: 'sales',
      question: 'What is the most effective way to prospect for new merchants?',
      answer: 'Top methods: 1) Referral partners (banks, CPAs, business consultants), 2) LinkedIn outreach with value-add content, 3) Local business networking (Chamber of Commerce, BNI), 4) Vertical-specific trade shows, 5) Strategic partnerships with POS/software vendors. Cold calling has <2% success rate vs 15-20% for warm referrals.',
      keywords: ['prospecting', 'leads', 'referral', 'networking']
    },
    {
      category: 'sales',
      question: 'How do I compete against Square and Stripe?',
      answer: 'Focus on: 1) Relationship and local support vs faceless corporation, 2) Next-day funding vs 2-3 day holds, 3) Stable rates vs sudden account freezes, 4) PCI compliance assistance, 5) Integration with existing POS/software, 6) Chargeback support and representation. Never compete solely on rate - sell value and security.',
      keywords: ['Square', 'Stripe', 'competition', 'aggregator']
    },
    {
      category: 'sales',
      question: 'What questions should I ask during merchant discovery?',
      answer: 'Key discovery questions: 1) Current processor and why considering change? 2) Monthly volume and average ticket? 3) Card-present vs card-not-present percentage? 4) Peak season patterns? 5) Current effective rate? 6) Any chargebacks or disputes? 7) Future growth plans? 8) Integration needs? 9) Pain points with current provider?',
      keywords: ['discovery', 'questions', 'qualifying', 'needs analysis']
    },
    {
      category: 'sales',
      question: 'How do I calculate and present effective rate?',
      answer: 'Effective rate = Total fees ÷ Total volume × 100. Example: $50,000 volume, $1,875 in fees = 3.75% effective rate. Present savings by showing: Current 3.75% on $50k = $1,875/mo, Proposed 3.25% = $1,625/mo, Monthly savings = $250, Annual savings = $3,000. Always use their actual statements.',
      keywords: ['effective rate', 'calculation', 'savings', 'analysis']
    },
    {
      category: 'sales',
      question: 'What are the best practices for following up with prospects?',
      answer: 'Follow-up sequence: Day 1: Thank you email with proposal summary. Day 3: Call to address questions. Day 7: Email with case study/testimonial. Day 10: Call with deadline/incentive. Day 14: Final email with "special approval" offer. Then monthly check-ins. 80% of sales happen after 5th follow-up, but 90% of reps stop after 2nd attempt.',
      keywords: ['follow-up', 'sequence', 'persistence', 'closing']
    },

    // Compliance
    {
      category: 'compliance',
      question: 'What are the current PCI DSS requirements?',
      answer: 'PCI DSS 4.0 requirements: 1) Level 1: >6M transactions/year - annual onsite audit, 2) Level 2: 1-6M - annual SAQ + quarterly scans, 3) Level 3: 20k-1M - annual SAQ + quarterly scans, 4) Level 4: <20k - annual SAQ. All require: firewall, encryption, access control, regular testing, security policy.',
      keywords: ['PCI', 'DSS', 'compliance', 'security']
    },
    {
      category: 'compliance',
      question: 'What are the rules around surcharging vs cash discount?',
      answer: 'Surcharging: Adding fee to card transactions (illegal in CO, CT, KS, MA, ME, OK). Max 4%, must notify card brands 30 days prior, clear signage required. Cash Discount: Posting credit price and offering discount for cash - legal everywhere. Dual pricing and non-cash adjustment programs operate in gray area.',
      keywords: ['surcharging', 'cash discount', 'dual pricing', 'compliance']
    },
    {
      category: 'compliance',
      question: 'What is Regulation E and how does it affect merchants?',
      answer: 'Reg E covers electronic fund transfers including debit cards and ACH. Key points: 1) Error resolution within 10 business days, 2) Provisional credit required during investigation, 3) Limited merchant recourse for authorized transactions, 4) Strict documentation requirements. Impacts recurring billing and ACH processing significantly.',
      keywords: ['Regulation E', 'debit', 'ACH', 'disputes']
    },
    {
      category: 'compliance',
      question: 'What are the AML/KYC requirements for payment processing?',
      answer: 'Anti-Money Laundering/Know Your Customer requires: 1) Customer Identification Program (CIP), 2) Ongoing monitoring for suspicious activity, 3) Currency Transaction Reports (CTR) for >$10k cash, 4) Suspicious Activity Reports (SAR) when warranted, 5) OFAC sanctions screening. Enhanced due diligence for high-risk merchants.',
      keywords: ['AML', 'KYC', 'compliance', 'OFAC']
    },
    {
      category: 'compliance',
      question: 'What is SCA/3D Secure 2.0?',
      answer: 'Strong Customer Authentication (SCA) mandated in Europe requires two-factor authentication for online transactions. 3D Secure 2.0 (EMV 3DS) is the protocol. US adoption is voluntary but reduces liability shift. Implementation can reduce chargebacks by 50% but may decrease conversion 10-15% if not optimized.',
      keywords: ['SCA', '3D Secure', 'authentication', 'Europe']
    },

    // Equipment & Technology
    {
      category: 'equipment',
      question: 'What are the best POS systems for restaurants?',
      answer: 'Top restaurant POS: 1) Toast - built for restaurants, integrated payments, 2) Square for Restaurants - affordable, user-friendly, 3) Clover Dining - flexible, good apps, 4) TouchBistro - iPad-based, strong features, 5) Lightspeed Restaurant - enterprise features. Consider: menu management, table layout, kitchen display, integration needs.',
      keywords: ['POS', 'restaurant', 'Toast', 'Square', 'Clover']
    },
    {
      category: 'equipment',
      question: 'What is the difference between a gateway and a processor?',
      answer: 'Gateway: Front-end technology that encrypts and routes transactions to processors. Examples: Authorize.net, NMI, USAePay. Processor: Back-end financial institution that settles funds. Examples: First Data, TSYS, Elavon. Merchants need both for e-commerce. Some companies (Stripe, Square) combine both functions.',
      keywords: ['gateway', 'processor', 'difference', 'ecommerce']
    },
    {
      category: 'equipment',
      question: 'What are the pros and cons of integrated vs standalone terminals?',
      answer: 'Integrated: Pros - Seamless with POS, single vendor support, automatic reconciliation. Cons - Vendor lock-in, higher cost, complex setup. Standalone: Pros - Portable, cheaper, processor flexibility. Cons - Manual reconciliation, separate support, double entry. Best practice: Integrated for high-volume, standalone for backup.',
      keywords: ['integrated', 'standalone', 'terminal', 'POS']
    },
    {
      category: 'equipment',
      question: 'What is EMV and why is it important?',
      answer: 'EMV (Europay, Mastercard, Visa) chip technology reduces counterfeit fraud by 87%. Liability shift since 2015 means non-EMV merchants bear fraud losses. EMV transactions take 2-3 seconds longer but significantly reduce chargebacks. Quick chip and contactless EMV help reduce transaction time. All new terminals must be EMV-capable.',
      keywords: ['EMV', 'chip', 'liability shift', 'fraud']
    },
    {
      category: 'equipment',
      question: 'What is tokenization and how does it improve security?',
      answer: 'Tokenization replaces sensitive card data with unique tokens that have no exploitable value. Benefits: 1) Reduces PCI scope, 2) Enables secure recurring billing, 3) Protects against data breaches, 4) Allows omnichannel commerce. Different from encryption - tokens cant be reverse-engineered. Industry standard for card-on-file.',
      keywords: ['tokenization', 'security', 'PCI', 'card-on-file']
    },

    // Pricing Models
    {
      category: 'pricing',
      question: 'What is Interchange Plus pricing?',
      answer: 'Interchange Plus (Cost Plus) pricing = Interchange rates + fixed markup. Most transparent model. Example: IC + 0.30% + $0.10. Pros: See true costs, benefits from downgrades, fair for all card types. Cons: Statements complex, rates fluctuate. Best for: >$10k/month processing, B2B, sophisticated merchants.',
      keywords: ['interchange plus', 'cost plus', 'pricing', 'transparent']
    },
    {
      category: 'pricing',
      question: 'How does tiered pricing work?',
      answer: 'Tiered (bundled) pricing groups cards into Qualified (1.79%), Mid-Qualified (2.49%), Non-Qualified (3.49%) rates. Processor controls categorization. Pros: Simple statements, predictable for qualified. Cons: No transparency, expensive downgrades, processor manipulation. Avoid for sophisticated merchants - downgrades can cost fortune.',
      keywords: ['tiered', 'bundled', 'qualified', 'pricing']
    },
    {
      category: 'pricing',
      question: 'What is flat rate pricing and when is it appropriate?',
      answer: 'Flat rate charges same percentage for all cards (e.g., 2.9% + $0.30). Examples: Square, Stripe, PayPal. Pros: Simplicity, no monthly fees, predictable. Cons: Expensive for debit/regulated cards, no volume discounts. Best for: <$5k/month, seasonal businesses, card-not-present heavy, startups needing simplicity.',
      keywords: ['flat rate', 'Square', 'simple', 'pricing']
    },
    {
      category: 'pricing',
      question: 'What are the current interchange rates for common cards?',
      answer: 'Key 2024 rates: Debit regulated: 0.05% + $0.22, Debit unreg: 0.80% + $0.15, Credit consumer: 1.80% + $0.10, Credit rewards: 2.40% + $0.10, Credit business: 2.50% + $0.10, AMEX OptBlue: 2.89% + $0.00. Rates vary by industry, transaction type. Card-not-present adds 0.20-0.30%.',
      keywords: ['interchange', 'rates', 'Visa', 'Mastercard']
    },
    {
      category: 'pricing',
      question: 'How do I price competitively while maintaining margin?',
      answer: 'Target margins: IC + 0.35-0.50% for standard retail, IC + 0.50-0.75% for restaurants, IC + 0.75-1.00% for e-commerce/high-risk. Bundle value-adds to justify: Next-day funding (+0.10%), Chargeback protection (+0.15%), PCI program (+$19.95/mo). Never lead with price - sell value first, then price becomes secondary.',
      keywords: ['pricing', 'margin', 'competitive', 'value']
    },

    // Fraud & Risk
    {
      category: 'fraud',
      question: 'What are the most common types of merchant services fraud?',
      answer: 'Common frauds: 1) Friendly fraud - legitimate customer falsely disputes, 2) Transaction laundering - processing for undisclosed business, 3) Bust-out - max processing then disappear, 4) Identity theft - fake merchant accounts, 5) Employee theft - skimming, refund fraud. Red flags: sudden volume spikes, high ticket changes, multiple MIDs.',
      keywords: ['fraud', 'types', 'risk', 'red flags']
    },
    {
      category: 'fraud',
      question: 'How can merchants reduce chargebacks?',
      answer: 'Chargeback prevention: 1) Clear descriptor and contact info, 2) Prompt customer service response, 3) Detailed invoices/receipts, 4) Delivery confirmation and signatures, 5) CVV and AVS verification, 6) Fraud detection tools, 7) Clear return/refund policy, 8) Recurring billing notifications. Target <0.9% ratio to avoid programs.',
      keywords: ['chargeback', 'prevention', 'dispute', 'ratio']
    },
    {
      category: 'fraud',
      question: 'What is a reserve account and when is it required?',
      answer: 'Reserve is funds held to cover potential losses. Types: 1) Rolling - percentage of daily volume (5-10%), 2) Fixed - set amount ($10k-50k), 3) Upfront - initial deposit. Required for: high-risk merchants, poor credit, high ticket, future delivery, previous losses. Typically 6-month hold, released after clean processing.',
      keywords: ['reserve', 'holdback', 'risk', 'collateral']
    },
    {
      category: 'fraud',
      question: 'What are the dispute reason codes I should know?',
      answer: 'Critical codes: 10.4 - Fraud/no cardholder auth, 13.1 - Services not provided, 13.3 - Not as described, 10.5 - Fraud monitoring program, 11.1 - Card recovery bulletin, 12.6 - Duplicate processing, 13.7 - Cancelled services. Each has specific evidence requirements. Quick response (5-7 days) crucial for winning.',
      keywords: ['dispute', 'reason codes', 'chargeback', 'evidence']
    },
    {
      category: 'fraud',
      question: 'What is the Excessive Chargeback Program (ECP)?',
      answer: 'Visa/MC programs for high chargeback merchants. Visa: Standard >0.9% and 100 CBs = monitoring, >1.8% and 1000 = excessive. Mastercard: >1.5% and 100 = excessive. Penalties: $50-100 per chargeback, monthly fines $25k-200k, potential termination and MATCH listing. Recovery requires 3 consecutive months below thresholds.',
      keywords: ['ECP', 'excessive', 'chargeback', 'program']
    },

    // Industry Verticals
    {
      category: 'verticals',
      question: 'What are the unique needs of e-commerce merchants?',
      answer: 'E-commerce needs: 1) Multiple gateway integrations, 2) International/multi-currency support, 3) Recurring billing capabilities, 4) Advanced fraud tools (3DS, velocity checks), 5) Mobile-optimized checkout, 6) Alternative payment methods, 7) Subscription management. Higher risk = higher rates but more features needed. Focus on conversion optimization.',
      keywords: ['ecommerce', 'online', 'gateway', 'fraud']
    },
    {
      category: 'verticals',
      question: 'How do I sell to B2B merchants?',
      answer: 'B2B focus areas: 1) Level 2/3 processing for lower interchange, 2) Virtual terminal for MOTO, 3) ACH/eCheck capabilities, 4) Invoice/QuickBooks integration, 5) Higher transaction limits, 6) Net terms options. Emphasize cost savings from commercial card optimization. Average ticket $3k+ means basis points matter more than transaction fees.',
      keywords: ['B2B', 'level 2', 'commercial', 'invoice']
    },
    {
      category: 'verticals',
      question: 'What special considerations apply to healthcare providers?',
      answer: 'Healthcare requirements: 1) HIPAA compliance for payment data, 2) HSA/FSA card acceptance, 3) Patient payment plans, 4) Integration with practice management, 5) Contactless for safety, 6) Text-to-pay for collections. Focus on patient experience and staff efficiency. Recurring billing for treatment plans increasingly important.',
      keywords: ['healthcare', 'HIPAA', 'medical', 'HSA']
    },
    {
      category: 'verticals',
      question: 'What do CBD/Cannabis merchants need to know?',
      answer: 'CBD/Cannabis challenges: 1) Limited processor options, 2) Higher rates (5-15%), 3) Reserve requirements (10-15%), 4) No major bank processing, 5) Cash-heavy requiring smart safes, 6) State-specific compliance. Solutions: Specialized high-risk processors, compliant banking partners, seed-to-sale integration. Legitimate with 2018 Farm Bill but still complex.',
      keywords: ['CBD', 'cannabis', 'high-risk', 'marijuana']
    },
    {
      category: 'verticals',
      question: 'How do I approach nonprofit organizations?',
      answer: 'Nonprofit considerations: 1) Discounted rates (many processors offer), 2) Donation optimization tools, 3) Recurring giving capabilities, 4) Event/auction processing, 5) Donor management integration, 6) Mobile fundraising options. Emphasize: increasing donations, reducing fees, donor experience. Grant reporting and transparency crucial.',
      keywords: ['nonprofit', 'charity', 'donation', '501c3']
    },

    // Emerging Trends
    {
      category: 'trends',
      question: 'What is Pay by Bank and how will it impact the industry?',
      answer: 'Pay by Bank (Open Banking/FedNow) enables direct bank transfers bypassing cards. Benefits: Lower fees (0.5-1% vs 2-3%), instant settlement, reduced fraud. Challenges: Consumer adoption, integration complexity, dispute process. Expected to capture 20% of e-commerce by 2027. Prepare by partnering with ACH/bank transfer providers.',
      keywords: ['pay by bank', 'FedNow', 'open banking', 'ACH']
    },
    {
      category: 'trends',
      question: 'How are AI and machine learning changing payment processing?',
      answer: 'AI applications: 1) Fraud detection with 50% false positive reduction, 2) Dynamic routing for approval optimization, 3) Predictive analytics for churn prevention, 4) Automated underwriting decisions, 5) Personalized pricing models, 6) Customer service chatbots. Merchants using AI see 15-30% reduction in processing costs.',
      keywords: ['AI', 'machine learning', 'fraud', 'automation']
    },
    {
      category: 'trends',
      question: 'What is embedded finance and how does it affect ISOs?',
      answer: 'Embedded finance integrates payment processing directly into software platforms (Shopify Payments, Toast Capital). Impact: 1) Increased competition from SaaS companies, 2) Need for specialized vertical expertise, 3) Focus on integration over standalone processing, 4) Partnership opportunities with software vendors. Adapt by becoming integration specialists.',
      keywords: ['embedded', 'finance', 'SaaS', 'integration']
    },
    {
      category: 'trends',
      question: 'How will cryptocurrency payments evolve?',
      answer: 'Crypto adoption: Currently <2% of transactions but growing 25% annually. Stablecoins (USDC, USDT) gaining merchant traction. Benefits: Lower fees, no chargebacks, global reach. Challenges: Volatility, regulation uncertainty, technical complexity. Major processors adding crypto rails. Position as future-ready option for tech-savvy merchants.',
      keywords: ['cryptocurrency', 'Bitcoin', 'blockchain', 'stablecoin']
    },
    {
      category: 'trends',
      question: 'What is the impact of Buy Now Pay Later (BNPL)?',
      answer: 'BNPL (Affirm, Klarna, Afterpay) impacts: 1) Increases average order 30-50%, 2) Attracts younger consumers, 3) Merchant pays 2-8% vs customer pays interest, 4) Reduces cart abandonment 20-30%, 5) Competes with traditional credit. Integration becoming table stakes for e-commerce. Partner with BNPL providers for complete solution.',
      keywords: ['BNPL', 'Affirm', 'Klarna', 'installments']
    },

    // Technical Support
    {
      category: 'support',
      question: 'How do I troubleshoot a declined transaction?',
      answer: 'Troubleshooting steps: 1) Check decline code (insufficient funds, invalid card, etc.), 2) Verify terminal connectivity, 3) Confirm merchant account active, 4) Check velocity limits, 5) Review fraud filters, 6) Verify card not expired/stolen, 7) Try different card or amount. Common fixes: reset terminal, check internet, call processor authorization.',
      keywords: ['decline', 'troubleshoot', 'transaction', 'error']
    },
    {
      category: 'support',
      question: 'What causes batch settlement failures?',
      answer: 'Common causes: 1) Network timeout - retry batch, 2) Invalid transaction - void and reprocess, 3) Settlement cutoff missed - settles next day, 4) Processor maintenance - wait and retry, 5) Account hold - contact risk department. Best practice: Auto-close batch daily at consistent time, monitor settlement reports.',
      keywords: ['batch', 'settlement', 'failure', 'close']
    },
    {
      category: 'support',
      question: 'How do I handle duplicate transactions?',
      answer: 'Duplicate handling: 1) Immediately void second transaction if not batched, 2) Issue refund if already settled, 3) Document with transaction IDs, 4) Notify customer proactively, 5) Enable duplicate checking on terminal/gateway. Prevention: Set velocity filters, enable duplicate prevention, train staff on single-tap/click processing.',
      keywords: ['duplicate', 'transaction', 'void', 'refund']
    },
    {
      category: 'support',
      question: 'What is downgrade and how do I minimize it?',
      answer: 'Downgrade occurs when transactions dont qualify for target interchange due to: Missing data (AVS, CVV), Late settlement (>24-48hrs), Wrong MCC code, International cards. Fix by: Settling daily, Capturing all card data, Using correct business type, Sending Level 2/3 data for B2B. Can save 0.50-1.00% on effective rate.',
      keywords: ['downgrade', 'interchange', 'qualification', 'optimization']
    },
    {
      category: 'support',
      question: 'How do I read a merchant statement?',
      answer: 'Statement analysis: 1) Volume and transaction count, 2) Effective rate calculation, 3) Discount rate vs qualified rate, 4) Downgrade transactions, 5) Monthly vs daily fees, 6) PCI and other hidden fees. Red flags: Effective rate >4%, high non-qualified percentage, excessive fees. Focus on total cost not advertised rate.',
      keywords: ['statement', 'analysis', 'effective rate', 'fees']
    }
  ];

  // Seed knowledge base for a specific organization
  static async seedForOrganization(organizationId: string) {
    console.log(`Seeding ${this.faqEntries.length} FAQ entries for organization: ${organizationId}`);
    
    try {
      // Insert all FAQ entries with tenant isolation
      const entries = this.faqEntries.map(entry => ({
        organizationId,
        category: entry.category,
        question: entry.question,
        answer: entry.answer,
        keywords: entry.keywords || [],
        source: 'imported',
        isActive: true,
        embeddings: null, // Will be populated by vector service
        usageCount: 0,
        isCorrected: false,
        metadata: { sourceSystem: 'ISO-AI', importDate: new Date().toISOString() }
      }));

      await db.insert(aiKnowledgeBase).values(entries);
      
      console.log(`Successfully seeded ${entries.length} FAQ entries`);
      return entries.length;
    } catch (error) {
      console.error('Error seeding knowledge base:', error);
      throw error;
    }
  }

  // Seed for all existing organizations
  static async seedAllOrganizations() {
    // For now, seed for the default organization
    const defaultOrgId = 'org-86f76df1'; // Tracer organization
    return await this.seedForOrganization(defaultOrgId);
  }

  // Get categories with counts
  static getCategorySummary(): { category: string; count: number }[] {
    const summary = new Map<string, number>();
    
    this.faqEntries.forEach(entry => {
      const count = summary.get(entry.category) || 0;
      summary.set(entry.category, count + 1);
    });
    
    return Array.from(summary.entries()).map(([category, count]) => ({
      category,
      count
    })).sort((a, b) => b.count - a.count);
  }
}