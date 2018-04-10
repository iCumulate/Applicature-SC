var BigNumber = require('bignumber.js');

var gasToUse = 0x47E7C4;

function receiptShouldSucceed(result) {
    return new Promise(function(resolve, reject) {
        var receipt = web3.eth.getTransaction(result.tx);

        if(result.receipt.gasUsed == gasToUse) {
            try {
               console.log(result.receipt.gasUsed, gasToUse);
                assert.notEqual(result.receipt.gasUsed, gasToUse, "tx failed, used all gas");
            }
            catch(err) {
                reject(err);
            }
        }
        else {
            resolve();
        }
    });
}

function receiptShouldFailed(result) {
    return new Promise(function(resolve, reject) {
        var receipt = web3.eth.getTransaction(result.tx);

        if(result.receipt.gasUsed == gasToUse) {
            resolve();
        }
        else {
            try {
                assert.equal(result.receipt.gasUsed, gasToUse, "tx succeed, used not all gas");
            }
            catch(err) {
                reject(err);
            }
        }
    });
}

function catchReceiptShouldFailed(err) {
    if (err.message.indexOf("invalid opcode") == -1 && err.message.indexOf("revert") == -1) {
        throw err;
    }
}

module.exports = {
    receiptShouldSucceed: receiptShouldSucceed,
    receiptShouldFailed: receiptShouldFailed,
    catchReceiptShouldFailed: catchReceiptShouldFailed
};
