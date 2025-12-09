const ngrok = require('ngrok');
const fs = require('fs');
const path = require('path');

(async function() {
  try {
    console.log('Starting ngrok tunnel on port 3000...');

    const url = await ngrok.connect({
      addr: 3000,
      proto: 'http'
    });

    console.log('\n✅ Ngrok tunnel started!');
    console.log('📡 Public URL:', url);
    console.log('\n📝 Copy this URL and update .env file:');
    console.log(`   WEBAPP_URL=${url}`);

    // Save URL to file
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Replace WEBAPP_URL
    if (envContent.includes('WEBAPP_URL=')) {
      envContent = envContent.replace(/WEBAPP_URL=.*/g, `WEBAPP_URL=${url}`);
    } else {
      envContent += `\nWEBAPP_URL=${url}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file updated automatically!');
    console.log('\n🔄 Restart the bot to apply changes:');
    console.log('   Press Ctrl+C in the bot terminal and run: npm run dev');

    console.log('\n⏸️  Press Ctrl+C to stop ngrok tunnel');

    // Keep running
    process.on('SIGINT', async () => {
      console.log('\n🛑 Stopping ngrok...');
      await ngrok.disconnect();
      await ngrok.kill();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error starting ngrok:', error);
    process.exit(1);
  }
})();
