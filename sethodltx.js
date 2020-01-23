const colors = require('colors');
const fs = require('fs');
config = require('./config.json');
const { execSync } = require('child_process');


const args = process.argv.slice(2);
const txid = args[0];
if (!txid) {
  console.log("must be specified TXID!");
  return;
}
var txinfo = execSync('bitcoin-cli gettransaction ' + txid).toString();
console.log(txinfo.yellow);
txinfo = JSON.parse(txinfo);

console.log("Hodl address used: " + config.hodl_addr.brightWhite);

if (txinfo.details) {
  const det = txinfo.details[0];
  if (det.address != config.hodl_addr) {
    console.log("#ERROR: address in transaction [".brightRed + det.address.brightWhite + "] != hodl address".brightRed);
    return;
  }
  config.txid = txid.trim();
  config.vout = det.vout;
  config.total_hodl = Math.abs(det.amount);
  str = JSON.stringify(config);
  console.log("Updated config: " + str.brightCyan);
  fs.writeFileSync('./config.json', str);
}


// 8b85e3800191a1a3a17a8bda4561aea90ae91f15984c9f2f9a492571f09db071
