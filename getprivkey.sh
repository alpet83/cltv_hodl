#!/bin/bash

if [ "$1" == "" ];
then
 echo "Must be specified address!"
 exit
fi

PK=`bitcoin-cli dumpprivkey $1`
echo '["'$PK'"]' > hodlmaster_key.json


