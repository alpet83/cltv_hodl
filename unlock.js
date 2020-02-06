const { execSync } = require('child_process');

const pp = 'wpswd39848';  // put your passphrase constructor here
res = execSync('bitcoin-cli walletpassphrase ' + pp + ' 100');
console.log('result: ' + res.toString()); 
