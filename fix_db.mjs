import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SHOW COLUMNS FROM user_profiles');
console.log('Current columns:', rows.map(r => r.Field).join(', '));
const cols = rows.map(r => r.Field);
if (!cols.includes('spectreHidden')) {
  await conn.execute('ALTER TABLE user_profiles ADD COLUMN spectreHidden TINYINT(1) NOT NULL DEFAULT 0');
  console.log('Added spectreHidden');
} else {
  console.log('spectreHidden already exists');
}
if (!cols.includes('spectreChatbotEnabled')) {
  await conn.execute('ALTER TABLE user_profiles ADD COLUMN spectreChatbotEnabled TINYINT(1) NOT NULL DEFAULT 1');
  console.log('Added spectreChatbotEnabled');
} else {
  console.log('spectreChatbotEnabled already exists');
}
const [rows2] = await conn.execute('SHOW COLUMNS FROM user_profiles');
console.log('Final columns:', rows2.map(r => r.Field).join(', '));
await conn.end();
