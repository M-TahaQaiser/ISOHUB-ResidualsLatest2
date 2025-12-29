const bcrypt = require('bcrypt');
const { Pool } = require('pg');

async function updateAdmin() {
  const pool = new Pool({ 
    connectionString: 'postgresql://postgres:ugmxPdIyfvQPDSpepzkGlsnsChLxnLrx@yamabiko.proxy.rlwy.net:12918/railway'
  });
  
  const hashedPassword = await bcrypt.hash('admin123', 12);
  console.log('New hash generated');
  
  const result = await pool.query(
    'UPDATE users SET password = $1 WHERE username = $2 RETURNING id, username',
    [hashedPassword, 'admin']
  );
  console.log('Password updated for:', result.rows[0]);
  
  await pool.end();
}

updateAdmin();
