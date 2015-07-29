# Source Server Stats

## Deploy

Manual for now - deploy directory contains a [pyinfra](https://github.com/Fizzadar/pyinfra) deploy script/inventory but uses numerous features not yet implemented in pyinfra!

## Storage

Two ES indexes:

+ **server** - one document per server-address. Represents the most recent view of a server and includes all information. Used for listing servers and displaying their "current state".
+ **history** - every time we see a server we index a history document containing a subset of the server documents fields. Used to generate historical charts of these stats.
