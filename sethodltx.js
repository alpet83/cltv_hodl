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
                console.log("#OK: Updated config: " + str.brightCyan);
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
            console.log("#TXRAW: length = " + txraw.length.toString().brightMagenta);
            if (txraw.length < 400) 
                throw new Error("getrawtransaction failed/small " + txraw);

            txinfo = execSync("bitcoin-cli decoderawtransaction " + txraw);
            txinfo = JSON.parse(txinfo);

            if (txinfo.vin)
                txinfo.vin.forEach(vin => { 
                    console.log("#CHECK_TX: ".brightYellow + vin.txid.brightGreen); //
                    if (vin.txid == txid && vin.txinwitness) { // possible never exec
                        config.witness_script = vin.txinwitness[1];
                        console.log("#OK: Witness script found ".brightWhite);
                    }
                    });
            
            assigned = false;
            if (txinfo.vout)  
                txinfo.vout.forEach(vout => {         
                    if (assigned) return;
                    const n = vout.n;
                    console.log('#CHECK: vout #'.brightYellow + n.toString().brightMagenta + ' addr: ' + vout.scriptPubKey.address);                    
                    if (vout.scriptPubKey.address == config.hodl_addr) {
                        config.vout  = n;
                        config.txid = txid.trim(); 
                        config.tx_hex = txraw.replace(/^\s+|\s+$/g, ''); // remove \n
                        config.total_hodl = vout.value;
                        str = JSON.stringify(config);
                        console.log("#OK: Updated config: ".brightWhite + str.brightCyan);
                        fs.writeFileSync('./config.json', str);       
                        assigned = true;
                        return;
                    } 
                    else                        
                        console.log("#REJECTED: ".brightRed + " due  " + vout.scriptPubKey.address.brightWhite + " mismatch with hold_addr ");            
            });
        

        }
        catch (err) { 
            console.log("#EXCEPTION: " + err);
        }  

    console.log( "#SUCCESS: ".brightGreen + "HODL address used ".brightYellow + config.hodl_addr.brightWhite + ", accepted TXID: ".brightYellow + txid.brightWhite);


