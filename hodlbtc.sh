#!/bin/sh
ADDR=`node hodl_addr.js`
AMOUNT=$1

echo -e "\e[91mCheck carefilly, sending $AMOUNT BTC to \e[97m [$ADDR] \e[39m"
echo -e "\e[93mCurrent balance: \e[95m"`bitcoin-cli getbalance`"\e[39m BTC "

read -p "Press enter to continue"
# using walletpassphrase to unlock wallet from unlock.js
node unlock.js
TXID=`bitcoin-cli sendtoaddress $ADDR $AMOUNT`
bitcoin-cli walletlock
echo "Rest balance: "`bitcoin-cli getbalance`" BTC "
#echo "TXID: "$TXID
node sethodltx.js $TXID

