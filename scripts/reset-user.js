import { Pool } from 'pg';

const connectionString = "postgresql://postgres.jxwweisfduqlwwvozkjb:foundersedgeproj@aws-1-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const pool = new Pool({ connectionString });

async function resetUser() {
  const email = 'shamil@foundersedge.com';
  console.log('Searching for user:', email);
  
  const users = await pool.query('SELECT id, email, track, role FROM "User"');
  console.log('All Users:', users.rows);
  
  const target = users.rows.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (target) {
    console.log('Target found:', target);
    await pool.query('DELETE FROM "UserRoadmapProgress" WHERE "userId" = $1', [target.id]);
    await pool.query('DELETE FROM "ScorecardSubmission" WHERE "userId" = $1', [target.id]);
    await pool.query('DELETE FROM "ChatMessage" WHERE "sessionId" IN (SELECT id FROM "ChatSession" WHERE "userId" = $1)', [target.id]);
    await pool.query('DELETE FROM "ChatSession" WHERE "userId" = $1', [target.id]);
    await pool.query('UPDATE "User" SET track = NULL, "completedMilestones" = ARRAY[]::text[], "avatarUrl" = NULL WHERE id = $1', [target.id]);
    console.log('SUCCESSFULLY RESET USER ACCOUNT FOR:', target.email);
  } else {
    console.log('User not found by email search.');
  }
  await pool.end();
}

resetUser().catch(console.error);
