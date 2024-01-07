# CLTV HODL scripts pack
#### This text was made via Google Translate w/o editing and correcting. 

Perhaps you sometimes wondered how to keep your bitcoins for a long time? For weeks, months, years, until the next halving or old age? It is not so easy when the price rises and so many temptations to spend coins. However, there is a solution to block the spending of bitcoins until a clearly established date.

For reliable freezing of coins, they need to be sent to the address of the script using the OP_CHECKLOCKTIMEVERIFY operation, which will not allow spending before the specified deadline. There are several implementation options, I chose Pay-To-Witness-Script-Hash using the script from here to adapt: ​​https://github.com/bitcoin-studio/Bitcoin-Programming-with-BitcoinJS/ It was necessary to split the script into several, add a test code and work with configuration files.
However, you can still work with the solution in bash / sh terminals, on a Linux system.

### What you need to install and configure:
 1. Bitcoin client, at least bitcoind and bitcoin-cli version> = 0.16, you need to enable local RPC access and enable `txindex=1` in *~/.bitcoin/bitcoin.conf*, wait for full blockchain sync 
 2. nodejs LTS version> = 8.0, npm
 3. Libraries and modules: `npm install bitcoinjs-lib colors ecpair bip32 bip56 jsonfile`

All operations are preferably carried out in reliable conditions, where various failures such as power loss are excluded. It requires maximum care and caution so as not to lose access to your funds! To get the so-called hodl-address on which coins will be frozen, you will need to save the private key, which will subsequently be used to sign coin return transactions (see step 1). Before starting work, a wallet with addresses to which coins will be returned should already be ready - backups should also be made. For the sake of convenience and speed of work, I had to partly sacrifice security: you will need to send bitcoins from the same system where the scripts will be run. Accordingly, the wallet must be encrypted, and you need to unlock it only at step 1 and 5.

Of course, it’s worth starting the experiment with minimal transactions of up to 100,000 Satoshi, with a blocking time of 1-2 hours. I do not recommend blocking significant funds, without very good reason. At any moment, another air fork can happen, like Bitcoin Gold, with a short-term opportunity to sell at a good price. Blocking for years, with a high probability, will not allow you to spend airdrop coins, even in the future (transaction compatibility is not guaranteed!).

### Guide to action:
 1. Generation of the private key hodlmaster_key.json by running `getprivkey.sh <wallet-name> <bitcoin_addres>` or `node make_privkey.js <wallet-name> <hdseedpath>` (the wallet will need to be unlocked).
 2. Edit hodl_ts with the desired unlock date-time.
 3. Initialize the configuration: `./init.sh`
 4. Create a hodl address by running: `node cltv_hodl.js`
 5. Replenish the hodl address by executing, after the next unlock: `bitcoin-cli sendtoaddress <address> <amount>` (alternatively, you can use `sh hodlbtc.sh <amount>` after setting the wallet password in unlock.js)
 6. Save the transaction ID to the configuration by executing: `node sethodltx.js <TXID>` in case of manual transaction sending
 7. Create a raw unlock and withdrawal transaction: `node cltv_unhodl.js <payee_address>`
 8. Save the raw transaction code as a HEX line `TXRAW = "020000000001018d01 ...."`, making a backup copy as well
 9. Try to send the transaction with the command: `bitcoin-cli sendrawtransaction 020000000001018d01 ....` - the error code non-final (code 64) should be issued
10. After about 1-2 hours, after the expiration of the blocking period, try to resend the transaction. The delay is required because the network compares the average time over the last 11 blocks with the blocking time.
 
Thus, it is possible to receive a personal bank, with a fixed-term deposit, and a tool for withdrawing this deposit to a strictly defined address. It turns out that you can store raw transactions without encryption, because the maximum that can get access to it is to send to the network earlier than you. On the other hand, it is undesirable to give any information to attackers, and the destination address is hidden in the transaction code.

Steps 7 through 10 can be done for different recipient addresses, resulting in different transactions. This, let’s say, will bequeath coins in case of survival: a transaction with the withdrawal of coins to the relative’s address can be printed out and attached to the will. When alternative transactions are ready, in theory you can even get rid of the private key used to create them (hodlmaster_key.json). However, this increases the risk of the inability to use airdrop coins, since raw transactions may be incompatible in format with the new fork. Keeping a wallet with this private key should be encrypted, with several backups it is desirable.

### Usefull links:
 + https://dev.to/eunovo/unlocking-the-power-of-p2wsh-a-step-by-step-guide-to-creating-and-spending-coins-with-bitcoin-scripts-using-bitcoinjs-lib-a7o
 + https://bitcoinjs-guide.bitcoin-studio.com/bitcoinjs-guide/v5/part-three-pay-to-script-hash/timelocks/cltv_p2wsh

### P.S.:
Based on the experience of use: the bitcoin client and the bitcoinlib-js library are updated over time, which can make the presented scripts inoperable. Therefore, in case there is a need to change target wallets, it is recommended to make a full binary backup of the system on which the conservation addresses were generated. This is especially easy if you were using a single board computer like a Raspberry Pi - just clone the MicroSD card.