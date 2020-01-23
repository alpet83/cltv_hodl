/**
 * You have to run this script twice!
 * After first run: take note the lockTime value and send coins to the P2SH address
 * Before second run: replace TX_ID, TX_VOUT and locktime
 * Generate 20 blocks
 * Send transaction
 * */

//
const { execSync } = require('child_process');
const bitcoin = require('bitcoinjs-lib');
const colors = require('colors');
// const network = bitcoin.networks.regtest
const network = bitcoin.networks.bitcoin
const hashType = bitcoin.Transaction.SIGHASH_ALL
const bip65 = require('bip65')
const fs = require('fs')

// Witness script, should allow spending after now() >= lockTime if actual signature
function cltvCheckSigOutput (aQ, lockTime) {
  return bitcoin.script.compile([
    aQ.publicKey,				// push pubkey from transaction signer
    bitcoin.opcodes.OP_CHECKSIGVERIFY,
    bitcoin.script.number.encode(lockTime),
    bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY, 
    bitcoin.opcodes.OP_DROP,      		// pop lockTime from stack
    bitcoin.opcodes.OP_TRUE
  ])
}

if (!fs.existsSync('./hodlmaster_key.json')) {
  console.log('#FATAL: Not found private key file!');
  return;
}
// Transaction signer
const privKey = require('./hodlmaster_key.json').toString();
const keyPair = bitcoin.ECPair.fromWIF(privKey, network);

init_tx = 1;

// Replace the lockTime value on second run here!
buff = ''

cfname = './config.json';
var config = { lockTime: 0, hodl_addr: "", witness_script: "", txid: "", vout: 0 };


if (fs.existsSync(cfname)) {
  config = require(cfname);
  if (config.txid != "" || !init_tx) {   
     console.log("#WARN: Init stage supressed, using configuration values. TXID = " + config.txid);
     init_tx = 0;
     lockTime = config.lockTime;
  }
}
  
if (init_tx) {
  const hodl_ts = fs.readFileSync('hodl_ts').toString().trim();
  // console.log('Loaded hold timestamp: ' + hodl_dt.toUTCString());  
  seconds = Math.floor(Date.parse(hodl_ts) / 1000);

  console.log("UNIX Timestamp: " + seconds);
  if (isNaN (seconds)) return;

  lockTime = bip65.encode({utc: seconds}) // 
  config.lockTime = lockTime;
}

dt = new Date(lockTime * 1000);
console.log('CHECK CAREFULLY: Timelock in UNIX timestamp for '.brightYellow + dt.toUTCString().brightGreen + ' = '.brightWhite + config.lockTime.toString().brightMagenta);

// Generate witness script and P2WSH address
const witnessScript = cltvCheckSigOutput(keyPair, lockTime)
config.witness_script = witnessScript.toString('hex');
const wsDump = execSync('bitcoin-cli decodescript ' + config.witness_script);
console.log('Witness script: ' + wsDump.toString().yellow);


const p2wsh = bitcoin.payments.p2wsh({redeem: {output: witnessScript, network}, network})
// there coins can be hodl over years...
console.log('P2WSH hodl_addr="' + p2wsh.address.brightWhite + '"');
config.hodl_addr = p2wsh.address;

if (init_tx) {
  const now = new Date();
  config.ts = now.toString();
  cfg =  JSON.stringify(config); 
  console.log(cfg.brightCyan);
  fs.writeFileSync(cfname, cfg);
  return;
}
