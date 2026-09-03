import { query, pool } from '../database/pool.js';

async function inspectDatabase() {
  try {
    const tables = await query<{ table_name: string }>(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('Tables found in database:');
    for (const t of tables.rows) {
      console.log(`\n=== Table: ${t.table_name} ===`);
      const cols = await query<{ column_name: string; data_type: string }>(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [t.table_name]);
      
      for (const col of cols.rows) {
        console.log(`  - "${col.column_name}" (${col.data_type})`);
      }
    }
  } catch (err) {
    console.error('Inspection error:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

inspectDatabase();
