/**
 * You have to run this script twice!
 * After first run: take note the lockTime value and send coins to the P2SH address
 * Before second run: replace TX_ID, TX_VOUT and locktime
 * Generate 20 blocks
 * Send transaction
 * */

//
const bitcoin = require('bitcoinjs-lib');
const colors = require('colors');
// const network = bitcoin.networks.regtest
const network = bitcoin.networks.bitcoin
const hashType = bitcoin.Transaction.SIGHASH_ALL
const bip65 = require('bip65')
const fs = require('fs')
const args = process.argv.slice(2);
const Buffer = require('safe-buffer').Buffer;

// WARNING: need receiver privkey & pubkey pair!
if (!fs.existsSync('./hodlmaster_key.json')) {
  console.log('#FATAL: Not found private key file!');
  return;
}
// Transaction signer
const privKey = require('./hodlmaster_key.json').toString();
const keyPair = bitcoin.ECPair.fromWIF(privKey, network)

// Replace the lockTime value on second run here!
buff = ''

cfname = './config.json';
const config = require(cfname);
  
if (0 == config.lockTime || "" == config.txid) {
  console.log('#ERROR: config.json not ready for tx generation');  
  return;
}

dt = new Date(config.lockTime * 1000);
console.log('CHECK CAREFULLY: Timelock in UNIX timestamp for '.brightYellow + dt.toUTCString().brightGreen + ' = '.brightWhite + config.lockTime.toString().brightMagenta);

// Generate witness script and P2WSH address
const ws_buff = Buffer.from(config.witness_script, 'hex');
const p2wsh = bitcoin.payments.p2wsh({redeem: {output: ws_buff, network}, network})
// there coins can be hodl over years...
if (config.hodl_addr != p2wsh.address) {
  console.log('#ERROR: mistmatch hold_addr, generated ['.brightRed + p2wsh.address + '] vs saved ['.brightRed + config.hodl_addr + ']'.brightRed);
  return;
}

// Build transaction
const txb = new bitcoin.TransactionBuilder(network)
txb.setLockTime(config.lockTime)

// txb.addInput(prevTx, input.vout, input.sequence, prevTxScript)
txb.addInput(config.txid, config.vout, 0xfffffffe)


var receiver = 'bc1qa5judde8fftgu92rv29vlelw0dpr66nh0wdnut'; // alpet donation addr

if (args[0])
   receiver = args[0]; // override receiver
else
  console.log("#WARN: using embedded receiver address ".brightRed + receiver.brightWhite);

// WARN:  be carefull with payment values, or you can overpay fee!!!
var totalInput = config.total_hodl; // 1BTC

if (args[1])
   totalInput = parseFloat(args[1]);

totalInput = Math.floor(totalInput * 100000000); // convert to Satoshis
var totalOutput = totalInput - 5000;

console.log ("#WARN: totalInput used ".red + totalInput.toString().brightMagenta + " sat.!".red);

txb.addOutput(receiver, totalOutput) // to whom and how much money to send?

const tx = txb.buildIncomplete()

// hashForWitnessV0(inIndex, prevOutScript, value, hashType)
const signatureHash = tx.hashForWitnessV0(0, ws_buff, totalInput, hashType)
console.log('signature hash: ', signatureHash.toString('hex'))

// payback script, only Alice can spend funds for anybody!
// + it can be generated any time!
const witnessStack = bitcoin.payments.p2wsh({
  redeem: {
    input: bitcoin.script.compile([
      bitcoin.script.signature.encode(keyPair.sign(signatureHash), hashType)
    ]),
    output: ws_buff  // funds source - script!
  }
}).witness

console.log('Unhodl witness stack:')
console.log(witnessStack.map(x => x.toString('hex')))

// Choose a scenario and set the witness stack
tx.setWitness(0, witnessStack);

// Print
console.log('TXRAW="' + tx.toHex().brightWhite + '"');
