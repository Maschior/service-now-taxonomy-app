import('./src/utils/bootstrap.js').then(() => {
  console.log('✓ Bootstrap imported successfully');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error importing bootstrap:', err);
  process.exit(1);
});
