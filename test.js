const {Blockchain, Transaction} = require('./blockchain')
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

const myKey = ec.keyFromPrivate('4f9a18724eafbd2a18f744880753b97a65e688ae6dd1e651110c26beedfdc578')
const myWalletAddress = myKey.getPublic('hex');

let SoCoin = new Blockchain();

const tx1 = new Transaction(myWalletAddress, 'public key of payee', 10);
tx1.signTransaction(myKey);
SoCoin.addTransaction(tx1);

console.log('\n starting miner')

SoCoin.minePendingTransactions(myWalletAddress);

console.log('\nbalance of zach is ', SoCoin.getBalanceOfAddress(myWalletAddress));
console.log('is chain valid?', SoCoin.isChainValid());
console.log('\ntampering with transactions...')
console.log('SoCoin.chain[1].transactions[0].amount = 1;')

SoCoin.chain[1].transactions[0].amount = 1;

console.log('\nis chain valid?', SoCoin.isChainValid());