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
    const ECPairFactory  = require('ecpair');
    const ecc = require('tiny-secp256k1');
    // const network = bitcoin.networks.regtest
    const network = bitcoin.networks.bitcoin
    const hashType = bitcoin.Transaction.SIGHASH_ALL
    const fs = require('fs')
    const args = process.argv.slice(2);
    const Buffer = require('safe-buffer').Buffer;
    const psbtutils = require('bitcoinjs-lib/src/psbt/psbtutils');
    const util = require('util');

    // WARNING: need receiver privkey & pubkey pair!
    if (!fs.existsSync('./hodlmaster_key.json')) {
      console.log('#FATAL: Not found private key file!');
      return;
    }

    const ECPair = ECPairFactory.ECPairFactory(ecc);  
    // Transaction signer
    const privKey = require('./hodlmaster_key.json').toString();
    const keyPair = ECPair.fromWIF(privKey, network)

    // Replace the lockTime value on second run here!
    buff = ''

    cfname = './config.json';
    const config = require(cfname);
      
    if (0 == config.lockTime || "" == config.txid) {
        console.log("#ERROR: ".brightRed + ' config.json not ready for tx generation'.brightWhite);  
        return;
    }

    dt = new Date(config.lockTime * 1000);
    const hodl_ts = dt.toUTCString();

    console.log('CHECK CAREFULLY: Timelock in UNIX timestamp for '.brightYellow + hodl_ts.brightGreen + ' = '.brightWhite + config.lockTime.toString().brightMagenta);

    // Generate witness script and P2WSH address
    if (!config.witness_script) {
        console.log("#ERROR: not specified witness script in config");
        return; 
    }
    const ws_buff = Buffer.from(config.witness_script, 'hex');
    const p2wsh = bitcoin.payments.p2wsh({redeem: {output: ws_buff, network}, network})
    const redeemScript = p2wsh.redeem.output;

    // there coins can be hodl over years...
    if (config.hodl_addr != p2wsh.address) {
        console.log('#ERROR: mistmatch hold_addr, generated ['.brightRed + p2wsh.address + '] vs saved ['.brightRed + config.hodl_addr + ']'.brightRed);
        return;
    }


    const psbt = new bitcoin.Psbt( { network:network } );
    psbt.setLocktime(config.lockTime);

    psbt.addInput( { 
        hash:config.txid, 
        index:config.vout,   // 0 for first hodl tx, 1 for second... 
        sequence:0xfffffffe,
        witnessScript: ws_buff,
        nonWitnessUtxo: Buffer.from(config.tx_hex, 'hex'),
        redeemScript
    });


    var receiver = 'bc1qa5judde8fftgu92rv29vlelw0dpr66nh0wdnut'; // alpet donation addr
    if (args[0])
      receiver = args[0]; // override receiver
    else
      console.log("#WARN: using embedded receiver address ".brightRed + receiver.brightWhite);

    var totalInput = config.total_hodl; // 1BTC

    if (args[1])
      totalInput = parseFloat(args[1]);

    totalInput = Math.floor(totalInput * 100000000); // convert to Satoshis
    var totalOutput = totalInput - 27000; // WARN: specify yours fee here

    console.log ("#WARN: totalInput used ".red + totalInput.toString().brightMagenta + " sat.!".red);

    psbt.addOutput({address:receiver, value:totalOutput}) // to whom and how much money to send?

    const wsDump = execSync('bitcoin-cli decodescript ' + config.witness_script);
    const pubkey = Buffer.from(keyPair.publicKey);  
    const pubkey_hex = pubkey.toString('hex');
    console.log("#WITNESS_SCRIPT: ".brightYellow + wsDump);    
    if (wsDump.includes(pubkey_hex))
        console.log("#OK: publicKey used in script".brightWhite);
    else {
        console.log("#FATAL: publicKey not used in script ".brightRed + pubkey_hex.brightWhite);
        console.log(keyPair);
        return;
    }
      
    const signer = {
        network: network,
        publicKey: pubkey,      
        sign: ($hash) => {   
          return Buffer.from(keyPair.sign($hash)); 
        },
    };

    psbt.signInput(0, signer);

    const finalizeInput = (_inputIndex, input ) => {
      const signature = Buffer.from(input.partialSig[0].signature);
      console.log("#SIGNATURE: ".brightYellow + signature.toString('hex').brightGreen);

      const redeemPayment = bitcoin.payments.p2wsh({
          redeem: {
            input: bitcoin.script.compile([signature]),
            output: input.witnessScript
          }
        });

        const result = psbtutils.witnessStackToScriptWitness (redeemPayment.witness ?? []);
        return { finalScriptSig: Buffer.from(""), 
                finalScriptWitness:result }
    }

    psbt.finalizeInput(0, finalizeInput);

    const txraw = psbt.extractTransaction().toHex();
    console.log('TXRAW="' + txraw.brightWhite + '"');

    const opts = { encoding: "utf8", mode: 0o600, flag: "a" };

    const msg = 'hodl at [' + config.hodl_addr + '] until [' + hodl_ts + '] return to [' + receiver + '], TXRAW=[' + txraw + "]\n";

    fs.writeFileSync("txlist.txt", msg, opts);
