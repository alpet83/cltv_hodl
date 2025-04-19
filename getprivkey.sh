#!/bin/bash

if [ "$1" == "" ];
then
 echo "Must be specified address!"
 exit
fi

PK=`bitcoin-cli --rpcwallet=$1 dumpprivkey $2`
echo '["'$PK'"]' > hodlmaster_key.json


