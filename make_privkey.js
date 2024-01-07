let crypto;
try {
  crypto = import('node:crypto');
} catch (err) {
  console.error('crypto support is disabled!');
  return;
} 

const { setTimeout } = require ("timers/promises");
const ecc = require('tiny-secp256k1');
const { BIP32Factory } = require('bip32');
const BIP32 = BIP32Factory(ecc);
const { exec, execSync, spawn, fork } = require('child_process');
const fs   = require('fs');
const args = process.argv.slice(2);
let mpk = 'xprv........';
let path = "m/0'/0'/7'";
let wallet = 'default';
if (args[0])
    wallet = args[0];

if (args[1])
    path = args[1];


const dump_name = __dirname + '/wallet.dump';

async function wait_and_exit() {
  console.log(" script will be terminated in 2 seconds...");
  await setTimeout(2000);
  if (fs.existsSync(dump_name))
      fs.unlinkSync(dump_name); // remove the dump, this is very security likely!
  process.exit();
}

try { 
  console.log("#EXEC: trying dump wallet");
  const cmd = 'bitcoin-cli -rpcwallet=' + wallet + ' dumpwallet ' + dump_name;  
  const dump = execSync(cmd);  
  const res = JSON.parse(dump);
  if (res && res.filename && fs.existsSync(res.filename)) {
    console.log("#OK: parsing " + res.filename);        
    let reader = require('readline').createInterface({
      input: fs.createReadStream(res.filename) 
    });

    reader.on('line', line => {            
          if (!line) return;
          const regex1 = new RegExp('masterkey: (.*)', 'g');
          const m = line.toString().matchAll(regex1);
          if (!m) return;
          const mlist = Array.from(m)[0];           
          if (mlist && mlist[1]) {
              mpk = mlist[1];     
              console.log("#MASTER_PK: " + mpk);    
              hdkey = BIP32.fromBase58(mpk);
              console.log("#PATH: " + path);
              child = hdkey.derivePath(path);
              console.log("WIF: " + child.toWIF());
              let jf = require('jsonfile');
              jf.writeFile('hodlmaster_key.json', [child.toWIF()]);              
              reader.close(); // not need parse any more
          }         
      });
   reader.on("close", () => {               
          process.exit();                
        }); 
   
  }
  else 
    console.log("#ERROR: dump was not created: " + dump);    

} catch (err) {
  console.error("#CRITICAL_FAIL: " + err);
  wait_and_exit();
}  



