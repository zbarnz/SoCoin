const SHA256 = require("crypto-js/sha256");
const EC = require("elliptic").ec; //used for generating keys
const ec = new EC("secp256k1");

class Transaction {
  constructor(fromAddress, toAddress, amount) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
  }

  calculateHash() {
    return SHA256(this.fromAddress + this.toAddress + this.amount).toString();
  }

  signTransaction(signingKey) {
    if (signingKey.getPublic("hex") !== this.fromAddress) {
      throw new Error("You cant sign transactions for other wallets!");
    }

    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, "base64");
    this.signature = sig.toDER("hex");
  }

  isValid() {
    //mining reward transaction are not signed but shoud still be valid
    if (this.fromAddress === null) return true;

    if (!this.signature || this.signature.length === 0) {
      throw new Error("No signature in this transaction");
    }

    const publicKey = ec.keyFromPublic(this.fromAddress, "hex");
    return publicKey.verify(this.calculateHash(), this.signature);
  }
}

class Block {
  constructor(timestamp, transactions, previousHash = "") {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = this.calculateHash;
    this.nonce = 0; // an incremental number used for proof of work
  }

  calculateHash() {
    return SHA256(
      this.index +
        this.previousHash +
        this.timestamp +
        JSON.stringify(this.data) +
        this.nonce
    ).toString();
  }

  mineBlock(difficulty) {
    /*the difficulty has to do with mining becoming more and more difficult
      over time to compensate for increases in computing power over time */
    while (
      this.hash.toString().substring(0, difficulty) !==
      Array(difficulty + 1).join("0")
    ) {
      this.nonce++; // this value is an arbitrary value that can be changed to stop this while loop from looping forever
      this.hash = this.calculateHash();
    }

    console.log("Block mined: " + this.hash);
  }

  hasValidTransactions() {
    for (const tx of this.transactions) {
      if (!tx.isValid()) {
        return false;
      }
    }
    return true;
  }
}

class Blockchain {
  // The constructor is responsible for initializing the blockchain
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 5;
    this.pendingTransactions = [];
    this.miningReward = 100; //A mining reward is needed to give an incentive to miners to mine new blocks
  }
  // The first block on a blockchain is known as the Genesis block and it needs to be created manually
  createGenesisBlock() {
    return new Block("01/01/2021", "Genesis block", "0");
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  minePendingTransactions(miningRewardAddress) {
    const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
    this.pendingTransactions.push(rewardTx);

    let block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
    /* in practice with larger crypto currencies miners will have to pick the transactions they want to add to their
      mined block because adding all pending transactions to a block is not possible due to block size */

    block.mineBlock(this.difficulty);

    console.log("Block successfully mined!");
    this.chain.push(block);

    this.pendingTransactions = [];
  }

  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error("Transaction must include from and to addresses");
    }

    if (!transaction.isValid()) {
      throw new Error("Cannot add invalid transaction to the chain");
    }

    this.pendingTransactions.push(transaction);
  }

  getBalanceOfAddress(address) {
    /* contrary to popular beleif, a wallet address does not actually have a physical coin balence, rather, in order
      to get the balence of a wallet address you must check all transactions of a wallet address */

    let balance = 0;
    for (const block of this.chain) {
      for (const trans of block.transactions) {
        if (trans.fromAddress === address) {
          balance -= trans.amount;
        }

        if (trans.toAddress === address) {
          balance += trans.amount;
        }
      }
    }
    return balance;
  }

  isChainValid() {
    // verify the integrity of transactions by looping through the chain
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];
      if (!currentBlock.hasValidTransactions()) {
        return false;
      }
      //see hasValidTransactions method

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }
      /*  checks if the hash is consistent with the
        block data, if someone where to change the ammount
        of coins in a transaction this check would return false */

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
      /* checks if the previous hash (of the block before) is
        consistant, if changes were to be made it would break the 
        relationship with the previous block */
    }
    return true;
  }
}

module.exports.Blockchain = Blockchain;
module.exports.Transaction = Transaction;
