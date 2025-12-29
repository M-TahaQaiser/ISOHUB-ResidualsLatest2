// Database Audit System for Enterprise Data Integrity
class DatabaseAuditSystem {
  
  // Create audit tables for tracking data changes
  static createAuditTables() {
    return `
    -- Raw data audit table
    CREATE TABLE IF NOT EXISTS raw_data_audit (
      id SERIAL PRIMARY KEY,
      file_name VARCHAR(255) NOT NULL,
      processor VARCHAR(100) NOT NULL,
      upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      total_records INTEGER,
      valid_records INTEGER,
      validation_errors JSONB,
      raw_data JSONB,
      processed_by VARCHAR(100),
      status VARCHAR(50) DEFAULT 'pending'
    );
    
    -- Data transformation audit
    CREATE TABLE IF NOT EXISTS transformation_audit (
      id SERIAL PRIMARY KEY,
      raw_audit_id INTEGER REFERENCES raw_data_audit(id),
      transformation_type VARCHAR(100),
      field_mapping JSONB,
      before_value TEXT,
      after_value TEXT,
      confidence_score DECIMAL(5,2),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Validation errors tracking
    CREATE TABLE IF NOT EXISTS validation_errors (
      id SERIAL PRIMARY KEY,
      merchant_mid VARCHAR(100),
      processor VARCHAR(100),
      error_type VARCHAR(100),
      error_message TEXT,
      severity VARCHAR(20),
      month VARCHAR(7),
      detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resolved BOOLEAN DEFAULT FALSE
    );
    
    -- Monthly data integrity checks
    CREATE TABLE IF NOT EXISTS data_integrity_checks (
      id SERIAL PRIMARY KEY,
      check_date DATE DEFAULT CURRENT_DATE,
      processor VARCHAR(100),
      month VARCHAR(7),
      total_merchants INTEGER,
      total_revenue DECIMAL(15,2),
      avg_revenue DECIMAL(10,2),
      anomalies_detected INTEGER,
      status VARCHAR(50),
      check_details JSONB
    );
    `;
  }
  
  // Insert comprehensive audit record
  static insertAuditRecord(fileName, processor, results) {
    const auditSQL = `
    INSERT INTO raw_data_audit (
      file_name, processor, total_records, valid_records, 
      validation_errors, status
    ) VALUES (
      '${fileName}',
      '${processor}',
      ${results.total_records},
      ${results.valid_merchants},
      '${JSON.stringify(results.validation_errors)}',
      'processed'
    ) RETURNING id;
    `;
    
    return auditSQL;
  }
  
  // Check data integrity across processors
  static generateIntegrityCheck(month = '2025-03') {
    return `
    WITH processor_stats AS (
      SELECT 
        p.name as processor,
        COUNT(md.id) as merchants,
        COALESCE(SUM(md.net), 0) as total_revenue,
        COALESCE(AVG(md.net), 0) as avg_revenue,
        COALESCE(MAX(md.net), 0) as max_revenue,
        COALESCE(MIN(md.net), 0) as min_revenue
      FROM processors p
      LEFT JOIN monthly_data md ON p.id = md.processor_id AND md.month = '${month}'
      GROUP BY p.name
    ),
    anomaly_detection AS (
      SELECT 
        processor,
        merchants,
        total_revenue,
        avg_revenue,
        max_revenue,
        CASE 
          WHEN max_revenue > avg_revenue * 10 THEN 1 
          ELSE 0 
        END as has_revenue_anomaly,
        CASE 
          WHEN merchants = 0 AND processor IN ('Clearent', 'TRX', 'Shift4') THEN 1
          ELSE 0
        END as missing_data_flag
      FROM processor_stats
    )
    SELECT 
      processor,
      merchants,
      ROUND(total_revenue::numeric, 2) as total_revenue,
      ROUND(avg_revenue::numeric, 2) as avg_revenue,
      ROUND(max_revenue::numeric, 2) as max_revenue,
      has_revenue_anomaly,
      missing_data_flag,
      CASE 
        WHEN has_revenue_anomaly = 1 OR missing_data_flag = 1 THEN 'NEEDS_REVIEW'
        ELSE 'OK'
      END as status
    FROM anomaly_detection
    ORDER BY total_revenue DESC;
    `;
  }
}

console.log('🔍 DATABASE AUDIT SYSTEM INITIALIZED');
console.log('Enterprise-level data integrity tracking ready');

export { DatabaseAuditSystem };