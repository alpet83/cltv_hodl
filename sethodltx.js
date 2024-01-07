const colors = require('colors');
const fs = require('fs');
config = require('./config.json');
const { execSync } = require('child_process');


const args = process.argv.slice(2);
const txid = args[0];
const wallet = args[1];
if (!txid) {
  console.log("must be specified TXID!");
  return;
}
let txinfo = '';
if (wallet)
try  {
 txinfo = execSync('bitcoin-cli -rpcwallet=' + wallet + ' gettransaction ' + txid).toString(); 
 console.log(txinfo.yellow);
 txinfo = JSON.parse(txinfo);
 if (txinfo.details) {
    const det = txinfo.details[0];
    if (det.address != config.hodl_addr) {
      console.log("#ERROR: address in transaction [".brightRed + det.address.brightWhite + "] != hodl address".brightRed);
      return;
    }
    config.txid = txid.trim();
    config.tx_hex = det.hex;
    config.vout = det.vout;
    config.total_hodl = Math.abs(det.amount);
    str = JSON.stringify(config);
    console.log("Updated config: " + str.brightCyan);
    fs.writeFileSync('./config.json', str);
  }
} 
catch (err) {   
  console.log("#EXCEPTION: " + err);
}  
else
try {
  // using raw TX required txindex=1 in bitcoin.conf 
  txraw = execSync('bitcoin-cli getrawtransaction ' + txid).toString();
  console.log("#TXRAW: " + txraw.length);
  if (txraw.length < 400) 
    throw new Error("getrawtransaction failed/small " + txraw);

  txinfo = execSync("bitcoin-cli decoderawtransaction " + txraw);
  txinfo = JSON.parse(txinfo);

  if (txinfo.vin)
   txinfo.vin.forEach(vin => { 
      if (vin.txid == txid && vin.txinwitness) {
        config.witness_script = vin.txinwitness[1];
      }
    });
   
  if (txinfo.vout)  
   txinfo.vout.forEach(vout => { 
   
     console.log('#' + vout.n + ' addr: ' + vout.scriptPubKey.address);
     if (vout.scriptPubKey.address == config.hodl_addr) {
       config.vout  = vout.n;
       config.tx_hex = txraw.replace(/^\s+|\s+$/g, ''); // remove \n
       config.total_hold = vout.value;
       str = JSON.stringify(config);
       console.log("Updated config: " + str.brightCyan);
       fs.writeFileSync('./config.json', str);
     }
    
  });
  

}
catch (err) { 
  console.log("#EXCEPTION: " + err);
}  

console.log("Hodl address used: " + config.hodl_addr.brightWhite);


