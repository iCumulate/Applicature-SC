// /*
//     Tests:
//
//      TokenDateBonusTiersPricingStrategy:
//         - deploy contract, check if the params  are equal
//         - check updateDates
//         - check getTierIndex
//         - check getActualDates
//         - check getTokens
//         - check getWeis
//
//      MintableCrowdsaleOnSuccessAgent:
// */
//
// var
//     ICUToken = artifacts.require("./ICUToken.sol"),
//     ICO = artifacts.require("./tests/TestICO.sol"),
//     MintableTokenAllocator = artifacts.require("./allocator/MintableTokenAllocator.sol"),
//     DistributedDirectContributionForwarder = artifacts.require("./contribution/DistributedDirectContributionForwarder.sol"),
//     TokenDateBonusTiersPricingStrategy = artifacts.require("./pricing/TokenDateBonusTiersPricingStrategy.sol"),
//     MintablePausableCrowdsaleOnSuccessAgent = artifacts.require("./agent/MintablePausableCrowdsaleOnSuccessAgent.sol"),
//
//     Utils = require("./utils"),
//     BigNumber = require('BigNumber.js'),
//
//     precision = new BigNumber("1000000000000000000"),
//     usdPrecision = new BigNumber("100000"),
//     icoSince = parseInt(new Date().getTime() / 1000 - 3600),
//     icoTill = parseInt(new Date().getTime() / 1000) + 3600,
//     signAddress = web3.eth.accounts[0],
//     bountyAddress = web3.eth.accounts[5],
//     compensationAddress = web3.eth.accounts[6],
//     etherHolder = web3.eth.accounts[9],
//     etherHolderApplicature = web3.eth.accounts[8];
//
// var abi = require('ethereumjs-abi'),
//     BN = require('bn.js');
//
// async function deploy() {
//     const token = await ICUToken.new();
//     const allocator = await MintableTokenAllocator.new(token.address);
//     const contributionForwarder = await DistributedDirectContributionForwarder.new(100, [etherHolder, etherHolderApplicature], [99, 1]);
//     const pricingStrategy = await TokenDateBonusTiersPricingStrategy.new([
//         //preICO
//         new BigNumber('25000000000000').valueOf(),//price
//         new BigNumber('10000000').mul(precision).valueOf(),//max
//         30,//bonus
//         new BigNumber('20').mul(precision).valueOf(),//minInvest
//         icoTill + 3600,//start
//         icoTill + 3600 * 2,
//
//         //ICO
//         new BigNumber('25000000000000').valueOf(),//price
//         new BigNumber('4000000').mul(precision).valueOf(),//max
//         15,//bonus
//         new BigNumber('0.2').mul(precision).valueOf(),//minInvest
//         icoTill + 3600,//start
//         icoTill + 3600 * 2,
//
//         new BigNumber('25000000000000').valueOf(),//price
//         new BigNumber('8000000').mul(precision).valueOf(),//max
//         6,//bonus
//         new BigNumber('0.2').mul(precision).valueOf(),//minInvest
//         icoTill + 3600,//start
//         icoTill + 3600 * 2,
//
//         new BigNumber('25000000000000').valueOf(),//price
//         new BigNumber('1500000').mul(precision).valueOf(),//max
//         3,//bonus
//         new BigNumber('0.2').mul(precision).valueOf(),//minInvest
//         icoTill + 3600,//start
//         icoTill + 3600 * 2
//     ], 18);
//
//     const ico = await ICO.new(allocator.address, contributionForwarder.address, pricingStrategy.address);
//
//     const agent = await MintablePausableCrowdsaleOnSuccessAgent.new(ico.address, token.address, token.address);
//
//     return {token, ico, pricingStrategy, allocator, contributionForwarder, agent};
// }
//
// function makeTransactionKYC(instance, sign, address, value) {
//     'use strict';
//     var h = abi.soliditySHA3(['address', 'address'], [new BN(instance.address.substr(2), 16), new BN(address.substr(2), 16)]),
//         sig = web3.eth.sign(sign, h.toString('hex')).slice(2),
//         r = `0x${sig.slice(0, 64)}`,
//         s = `0x${sig.slice(64, 128)}`,
//         v = web3.toDecimal(sig.slice(128, 130)) + 27;
//
//     var data = abi.simpleEncode('contribute(uint8,bytes32,bytes32)', v, r, s);
//
//     return instance.sendTransaction({value: value, from: address, data: data.toString('hex')});
// }
//
// contract('TokenDateBonusTiersPricingStrategy', function (accounts) {
//
//     it("deploy contract, check if the params  are equal", async function () {
//         const {token, ico, pricingStrategy, allocator, contributionForwarder, agent} = await deploy();
//
//         assert.equal(await pricingStrategy.decimals.call(), 18, "decimals doesn't match");
//
//         let tierData = await pricingStrategy.tiers.call(0);
//         assert.equal(tierData[0], new BigNumber('25000000000000').valueOf(), "tokenInWei doesn't match");
//         assert.equal(tierData[1], new BigNumber('10000000').mul(precision).valueOf(), "maxTokensCollected doesn't match");
//         assert.equal(tierData[2], 30, "bonusPercents doesn't match");
//         assert.equal(tierData[3], new BigNumber('20000000000000000000').valueOf(), "minInvestInWei doesn't match");
//         assert.equal(tierData[4], icoTill + 3600, "startDate doesn't match");
//         assert.equal(tierData[5], icoTill + 3600 * 2, "endDate doesn't match");
//
//         tierData = await pricingStrategy.tiers.call(1);
//         assert.equal(tierData[0], new BigNumber('25000000000000').valueOf(), "tokenInWei doesn't match");
//         assert.equal(tierData[1], new BigNumber('4000000').mul(precision).valueOf(), "maxTokensCollected doesn't match");
//         assert.equal(tierData[2], 15, "bonusPercents doesn't match");
//         assert.equal(tierData[3], new BigNumber('200000000000000000').valueOf(), "minInvestInWei doesn't match");
//         assert.equal(tierData[4], icoTill + 3600, "startDate doesn't match");
//         assert.equal(tierData[5], icoTill + 3600 * 2, "endDate doesn't match");
//
//         tierData = await pricingStrategy.tiers.call(2);
//         assert.equal(tierData[0], new BigNumber('25000000000000').valueOf(), "tokenInWei doesn't match");
//         assert.equal(tierData[1], new BigNumber('8000000').mul(precision).valueOf(), "maxTokensCollected doesn't match");
//         assert.equal(tierData[2], 6, "bonusPercents doesn't match");
//         assert.equal(tierData[3], new BigNumber('200000000000000000').valueOf(), "minInvestInWei doesn't match");
//         assert.equal(tierData[4], icoTill + 3600, "startDate doesn't match");
//         assert.equal(tierData[5], icoTill + 3600 * 2, "endDate doesn't match");
//
//         tierData = await pricingStrategy.tiers.call(3);
//         assert.equal(tierData[0], new BigNumber('25000000000000').valueOf(), "tokenInWei doesn't match");
//         assert.equal(tierData[1], new BigNumber('1500000').mul(precision).valueOf(), "maxTokensCollected doesn't match");
//         assert.equal(tierData[2], 3, "bonusPercents doesn't match");
//         assert.equal(tierData[3], new BigNumber('200000000000000000').valueOf(), "minInvestInWei doesn't match");
//         assert.equal(tierData[4], icoTill + 3600, "startDate doesn't match");
//         assert.equal(tierData[5], icoTill + 3600 * 2, "endDate doesn't match");
//     });
//
//     it("check getTierIndex | updateDates | getActualDates", async function () {
//         const {token, ico, pricingStrategy, allocator, contributionForwarder, agent} = await deploy();
//
//         assert.equal(await pricingStrategy.getTierIndex.call(28), 4, "TierIndex doesn't match");
//
//         await pricingStrategy.updateDates(0, icoSince, icoTill, {from: accounts[1]})
//             .then(Utils.receiptShouldFailed)
//             .catch(Utils.catchReceiptShouldFailed);
//
//         await pricingStrategy.updateDates(0, 0, icoTill, {from: accounts[0]});
//         await pricingStrategy.updateDates(0, icoSince, icoSince, {from: accounts[0]});
//         await pricingStrategy.updateDates(4, icoSince, icoSince, {from: accounts[0]});
//         assert.equal(await pricingStrategy.getTierIndex.call(new BigNumber('9999999').mul(precision).valueOf()), 4, "TierIndex doesn't match");
//
//         await pricingStrategy.updateDates(0, icoSince, icoTill, {from: accounts[0]})
//         assert.equal(await pricingStrategy.getTierIndex.call(new BigNumber('9999999').mul(precision).valueOf()), 0, "TierIndex doesn't match");
//         assert.equal(await pricingStrategy.getTierIndex.call(new BigNumber('10000000').mul(precision).valueOf()), 4, "TierIndex doesn't match");
//
//         await pricingStrategy.updateDates(1, icoTill + 3600, icoTill + 3600 * 2, {from: accounts[0]})
//         await pricingStrategy.updateDates(2, icoTill + 3600 * 3, icoTill + 3600 * 4, {from: accounts[0]})
//         await pricingStrategy.updateDates(3, icoTill + 3600 * 5, icoTill + 3600 * 6, {from: accounts[0]})
//
//
//         let actualDates = await pricingStrategy.getActualDates.call(new BigNumber('0').mul(precision).valueOf());
//         assert.equal(actualDates[0], icoSince, "start date doesn't match");
//         assert.equal(actualDates[1], icoTill, "end date doesn't match");
//
//         actualDates = await pricingStrategy.getActualDates.call(new BigNumber('10000000').mul(precision).valueOf());
//         //should be next tier
//         assert.equal(actualDates[0], icoTill + 3600, "start date doesn't match");
//         assert.equal(actualDates[1], icoTill + 3600 * 2, "end date doesn't match");
//
//         await pricingStrategy.updateDates(0, icoSince - 3600 * 4, icoSince - 3600 * 3, {from: accounts[0]})
//         await pricingStrategy.updateDates(1, icoSince - 3600 * 2, icoSince - 3600 * 1, {from: accounts[0]})
//         await pricingStrategy.updateDates(2, icoSince, icoTill + 3600 * 4, {from: accounts[0]})
//         await pricingStrategy.updateDates(3, icoTill + 3600 * 5, icoTill + 3600 * 6, {from: accounts[0]})
//
//
//         actualDates = await pricingStrategy.getActualDates.call(new BigNumber('7999999').mul(precision).valueOf());
//         assert.equal(actualDates[0], icoSince, "start date doesn't match");
//         assert.equal(actualDates[1], icoTill + 3600 * 4, "end date doesn't match");
//
//         actualDates = await pricingStrategy.getActualDates.call(new BigNumber('8000000').mul(precision).valueOf());
//         assert.equal(actualDates[0], icoTill + 3600 * 5, "start date doesn't match");
//         assert.equal(actualDates[1], icoTill + 3600 * 6, "end date doesn't match");
//     });
//
//     it("check getTokens", async function () {
//         const {token, ico, pricingStrategy, allocator, contributionForwarder, agent} = await deploy();
//
//         let tokens = await pricingStrategy.getTokens.call(
//             accounts[6],//_contributor
//             28,//_tokensAvailable
//             new BigNumber('0').mul(precision).valueOf(),//_tokensSold
//             new BigNumber('1').mul(precision).valueOf(),//_weiAmount
//             28//_collectedWei
//         );
//         assert.equal(tokens[0], new BigNumber('0').mul(precision).valueOf(), "tokens doesn't match");
//         assert.equal(tokens[1], new BigNumber('0').mul(precision).valueOf(), "tokensExcludingBonus doesn't match");
//         assert.equal(tokens[2], new BigNumber('0').mul(precision).valueOf(), "bonus doesn't match");
//
//
//         await pricingStrategy.updateDates(0, icoSince, icoTill, {from: accounts[0]});
//         await pricingStrategy.updateDates(1, icoTill + 3600 * 1, icoTill + 3600 * 2, {from: accounts[0]});
//         await pricingStrategy.updateDates(2, icoTill + 3600 * 3, icoTill + 3600 * 4, {from: accounts[0]});
//         await pricingStrategy.updateDates(3, icoTill + 3600 * 5, icoTill + 3600 * 6, {from: accounts[0]});
//
//         //preico-------------------------------------------
//         //check mininvest
//         tokens = await pricingStrategy.getTokens.call(
//             accounts[6],//_contributor
//             28,//_tokensAvailable
//             new BigNumber('0').mul(precision).valueOf(),//_tokensSold
//             new BigNumber('19.9').mul(precision).valueOf(),//_weiAmount
//             28//_collectedWei
//         );
//         //10 ^ 18 * 0.01 / 400 = 25000000000000
//         // 10 ^ 18 * 19.9 / 25000000000000 = 796000
//         // 796000 * 130 / 100 = 1034800
//         assert.equal(tokens[0], new BigNumber('0').mul(precision).valueOf(), "tokens doesn't match");
//         assert.equal(tokens[1], new BigNumber('0').mul(precision).valueOf(), "tokensExcludingBonus doesn't match");
//         assert.equal(tokens[2], new BigNumber('0').mul(precision).valueOf(), "bonus doesn't match");
//
//         tokens = await pricingStrategy.getTokens.call(
//             accounts[6],//_contributor
//             28,//_tokensAvailable
//             new BigNumber('0').mul(precision).valueOf(),//_tokensSold
//             new BigNumber('20').mul(precision).valueOf(),//_weiAmount
//             28//_collectedWei
//         );
//         //10 ^ 18 * 0.01 / 400 = 25000000000000
//         // 10 ^ 18 * 20 / 25000000000000 = 800000
//         // 796000 * 130 / 100 = 1040000
//         assert.equal(tokens[0], new BigNumber('1040000').mul(precision).valueOf(), "tokens doesn't match");
//         assert.equal(tokens[1], new BigNumber('800000').mul(precision).valueOf(), "tokensExcludingBonus doesn't match");
//         assert.equal(tokens[2], new BigNumber('240000').mul(precision).valueOf(), "bonus doesn't match");
//
//         //-----------------------------------------
//
//         tokens = await pricingStrategy.getTokens.call(
//             accounts[6],//_contributor
//             28,//_tokensAvailable
//             new BigNumber('10000000').sub('800000').mul(precision).valueOf(),//_tokensSold
//             new BigNumber('20').mul(precision).valueOf(),//_weiAmount
//             28//_collectedWei
//         );
//         //10,000,000
//         //10 ^ 18 * 0.01 / 400 = 25000000000000
//         // 10 ^ 18 * 20 / 25000000000000 = 800000
//         // 796000 * 130 / 100 = 1040000
//         assert.equal(tokens[0], new BigNumber('1040000').mul(precision).valueOf(), "tokens doesn't match");
//         assert.equal(tokens[1], new BigNumber('800000').mul(precision).valueOf(), "tokensExcludingBonus doesn't match");
//         assert.equal(tokens[2], new BigNumber('240000').mul(precision).valueOf(), "bonus doesn't match");
//
//         tokens = await pricingStrategy.getTokens.call(
//             accounts[6],//_contributor
//             28,//_tokensAvailable
//             new BigNumber('10000000').sub('700000').mul(precision).valueOf(),//_tokensSold
//             new BigNumber('20').mul(precision).valueOf(),//_weiAmount
//             28//_collectedWei
//         );
//         //10,000,000
//         //10 ^ 18 * 0.01 / 400 = 25000000000000
//         // 10 ^ 18 * 20 / 25000000000000 = 800000
//         // 796000 * 130 / 100 = 1040000
//         assert.equal(tokens[0], new BigNumber('0').mul(precision).valueOf(), "tokens doesn't match");
//         assert.equal(tokens[1], new BigNumber('0').mul(precision).valueOf(), "tokensExcludingBonus doesn't match");
//         assert.equal(tokens[2], new BigNumber('0').mul(precision).valueOf(), "bonus doesn't match");
//
//         //preico-----------------------------------------end
//
//         await pricingStrategy.updateDates(0, icoSince - 3600 * 10, icoSince - 3600 * 9, {from: accounts[0]});
//         await pricingStrategy.updateDates(1, icoSince, icoTill + 3600 * 2, {from: accounts[0]});
//         await pricingStrategy.updateDates(2, icoSince, icoTill + 3600 * 2, {from: accounts[0]});
//         await pricingStrategy.updateDates(3, icoSince, icoTill + 3600 * 2, {from: accounts[0]});
//
//         tokens = await pricingStrategy.getTokens.call(
//             accounts[6],//_contributor
//             28,//_tokensAvailable
//             new BigNumber('0').mul(precision).valueOf(),//_tokensSold
//             new BigNumber('0.19').mul(precision).valueOf(),//_weiAmount
//             28//_collectedWei
//         );
//         //10,000,000
//         //10 ^ 18 * 0.01 / 400 = 25000000000000
//         // 10 ^ 18 * 20 / 25000000000000 = 800000
//         // 796000 * 130 / 100 = 1040000
//         assert.equal(tokens[0], new BigNumber('0').mul(precision).valueOf(), "tokens doesn't match");
//         assert.equal(tokens[1], new BigNumber('0').mul(precision).valueOf(), "tokensExcludingBonus doesn't match");
//         assert.equal(tokens[2], new BigNumber('0').mul(precision).valueOf(), "bonus doesn't match");
//
//         tokens = await pricingStrategy.getTokens.call(
//             accounts[6],//_contributor
//             28,//_tokensAvailable
//             new BigNumber('0').mul(precision).valueOf(),//_tokensSold
//             new BigNumber('0.2').mul(precision).valueOf(),//_weiAmount
//             28//_collectedWei
//         );
//         //10 ^ 18 * 0.01 / 400 = 25000000000000
//         // 10 ^ 18 * 0.2 / 25000000000000 = 8000
//         // 8000 * 115 / 100 = 9200
//         assert.equal(tokens[0], new BigNumber('9200').mul(precision).valueOf(), "tokens doesn't match");
//         assert.equal(tokens[1], new BigNumber('8000').mul(precision).valueOf(), "tokensExcludingBonus doesn't match");
//         assert.equal(tokens[2], new BigNumber('1200').mul(precision).valueOf(), "bonus doesn't match");
//
//         tokens = await pricingStrategy.getTokens.call(
//             accounts[6],//_contributor
//             28,//_tokensAvailable
//             new BigNumber('3000000').mul(precision).valueOf(),//_tokensSold
//             new BigNumber('250').mul(precision).valueOf(),//_weiAmount
//             28//_collectedWei
//         );
//         //10 ^ 18 * 0.01 / 400 = 25000000000000
//
//         // 10 ^ 18 * 25 / 25000000000000 = 1000000
//         // 1000000 * 115 / 100 = 1150000
//
//         // 10 ^ 18 * 200 / 25000000000000 = 8000000
//         // 8000000 * 106 / 100 = 8480000
//
//         // 10 ^ 18 * 25 / 25000000000000 = 1000000
//         // 1000000 * 103 / 100 = 1030000
//         assert.equal(tokens[0], new BigNumber('10660000').mul(precision).valueOf(), "tokens doesn't match");
//         assert.equal(tokens[1], new BigNumber('10000000').mul(precision).valueOf(), "tokensExcludingBonus doesn't match");
//         assert.equal(tokens[2], new BigNumber('660000').mul(precision).valueOf(), "bonus doesn't match");
//
//         tokens = await pricingStrategy.getTokens.call(
//             accounts[6],//_contributor
//             28,//_tokensAvailable
//             new BigNumber('3000000').mul(precision).valueOf(),//_tokensSold
//             new BigNumber('262.499975').mul(precision).valueOf(),//_weiAmount
//             28//_collectedWei
//         );
//         //10 ^ 18 * 0.01 / 400 = 25000000000000
//
//         // 10 ^ 18 * 25 / 25000000000000 = 1000000
//         // 1000000 * 115 / 100 = 1150000
//
//         // 10 ^ 18 * 200 / 25000000000000 = 8000000
//         // 8000000 * 106 / 100 = 8480000
//
//         // 10 ^ 18 * 37.499975 / 25000000000000 = 1499999
//         // 1499999 * 103 / 100 = 1544998.97
//         assert.equal(tokens[0], new BigNumber('11174998.97').mul(precision).valueOf(), "tokens doesn't match");
//         assert.equal(tokens[1], new BigNumber('10499999').mul(precision).valueOf(), "tokensExcludingBonus doesn't match");
//         assert.equal(tokens[2], new BigNumber('674999.97').mul(precision).valueOf(), "bonus doesn't match");
//
//         tokens = await pricingStrategy.getTokens.call(
//             accounts[6],//_contributor
//             28,//_tokensAvailable
//             new BigNumber('3000000').mul(precision).valueOf(),//_tokensSold
//             new BigNumber('262.500025').mul(precision).valueOf(),//_weiAmount
//             28//_collectedWei
//         );
//         //10 ^ 18 * 0.01 / 400 = 25000000000000
//
//         // 10 ^ 18 * 25 / 25000000000000 = 1000000
//         // 1000000 * 115 / 100 = 1150000
//
//         // 10 ^ 18 * 200 / 25000000000000 = 8000000
//         // 8000000 * 106 / 100 = 8480000
//
//         // 10 ^ 18 * 37.500025 / 25000000000000 = 1500001
//         // 1500001 * 103 / 100 = 1545001.03
//         assert.equal(tokens[0], new BigNumber('0').mul(precision).valueOf(), "tokens doesn't match");
//         assert.equal(tokens[1], new BigNumber('0').mul(precision).valueOf(), "tokensExcludingBonus doesn't match");
//         assert.equal(tokens[2], new BigNumber('0').mul(precision).valueOf(), "bonus doesn't match");
//     });
//
//     it("check getWeis", async function () {
//         const {token, ico, pricingStrategy, allocator, contributionForwarder, agent} = await deploy();
//
//         let weis = await pricingStrategy.getWeis.call(
//             28,//_collectedWei
//             28,//_tokensSold
//             new BigNumber('800000').mul(precision).valueOf(),//_tokens
//         );
//         assert.equal(weis[0], new BigNumber('0').mul(precision).valueOf(), "totalWeiAmount doesn't match");
//         assert.equal(weis[1], new BigNumber('0').mul(precision).valueOf(), "tokensBonus doesn't match");
//
//         await pricingStrategy.updateDates(0, icoSince, icoTill, {from: accounts[0]});
//         await pricingStrategy.updateDates(1, icoTill + 3600 * 1, icoTill + 3600 * 2, {from: accounts[0]});
//         await pricingStrategy.updateDates(2, icoTill + 3600 * 3, icoTill + 3600 * 4, {from: accounts[0]});
//         await pricingStrategy.updateDates(3, icoTill + 3600 * 5, icoTill + 3600 * 6, {from: accounts[0]});
//
//         weis = await pricingStrategy.getWeis.call(
//             28,//_collectedWei
//             28,//_tokensSold
//             new BigNumber('796000').mul(precision).valueOf(),//_tokens
//         );
//         //10 ^ 18 * 0.01 / 400 = 25000000000000
//         // 10 ^ 18 * 19.9 / 25000000000000 = 796000
//         // 796000 * 130 / 100 = 1034800
//         assert.equal(weis[0], new BigNumber('0').mul(precision).valueOf(), "totalWeiAmount doesn't match");
//         assert.equal(weis[1], new BigNumber('0').mul(precision).valueOf(), "tokensBonus doesn't match");
//
//         weis = await pricingStrategy.getWeis.call(
//             28,//_collectedWei
//             28,//_tokensSold
//             new BigNumber('800000').mul(precision).valueOf(),//_tokens
//         );
//         //10 ^ 18 * 0.01 / 400 = 25000000000000
//         // 10 ^ 18 * 20 / 25000000000000 = 800000
//         // 800000 * 130 / 100 = 1040000
//         assert.equal(weis[0], new BigNumber('20').mul(precision).valueOf(), "totalWeiAmount doesn't match");
//         assert.equal(weis[1], new BigNumber('240000').mul(precision).valueOf(), "tokensBonus doesn't match");
//
//         //-------------------------------
//
//         weis = await pricingStrategy.getWeis.call(
//             28,//_collectedWei
//             new BigNumber('10000000').sub('700000').mul(precision).valueOf(),//_tokensSold
//             new BigNumber('800000').mul(precision).valueOf(),//_tokens
//         );
//         //10 ^ 18 * 0.01 / 400 = 25000000000000
//         // 10 ^ 18 * 20 / 25000000000000 = 800000
//         // 800000 * 130 / 100 = 1040000
//         assert.equal(weis[0], new BigNumber('0').mul(precision).valueOf(), "totalWeiAmount doesn't match");
//         assert.equal(weis[1], new BigNumber('0').mul(precision).valueOf(), "tokensBonus doesn't match");
//
//         //preico-----------------------------------------end
//
//         await pricingStrategy.updateDates(0, icoSince - 3600 * 10, icoSince - 3600 * 9, {from: accounts[0]});
//         await pricingStrategy.updateDates(1, icoSince, icoTill + 3600 * 2, {from: accounts[0]});
//         await pricingStrategy.updateDates(2, icoSince, icoTill + 3600 * 2, {from: accounts[0]});
//         await pricingStrategy.updateDates(3, icoSince, icoTill + 3600 * 2, {from: accounts[0]});
//
//         weis = await pricingStrategy.getWeis.call(
//             28,//_collectedWei
//             new BigNumber('0').sub('0').mul(precision).valueOf(),//_tokensSold
//             new BigNumber('7600').mul(precision).valueOf(),//_tokens
//         );
//         //10 ^ 18 * 0.01 / 400 = 25000000000000
//         // 10 ^ 18 * 0.19 / 25000000000000 = 7600
//         // 7600 * 115 / 100 = 8740
//         assert.equal(weis[0], new BigNumber('0').mul(precision).valueOf(), "totalWeiAmount doesn't match");
//         assert.equal(weis[1], new BigNumber('0').mul(precision).valueOf(), "tokensBonus doesn't match");
//
//         weis = await pricingStrategy.getWeis.call(
//             28,//_collectedWei
//             new BigNumber('0').sub('0').mul(precision).valueOf(),//_tokensSold
//             new BigNumber('8000').mul(precision).valueOf(),//_tokens
//         );
//         //10 ^ 18 * 0.01 / 400 = 25000000000000
//         // 10 ^ 18 * 0.2 / 25000000000000 = 8000
//         // 8000 * 115 / 100 = 9200
//         assert.equal(weis[0], new BigNumber('0.2').mul(precision).valueOf(), "totalWeiAmount doesn't match");
//         assert.equal(weis[1], new BigNumber('1200').mul(precision).valueOf(), "tokensBonus doesn't match");
//
//         weis = await pricingStrategy.getWeis.call(
//             28,//_collectedWei
//             new BigNumber('3000000').mul(precision).valueOf(),//_tokensSold
//             new BigNumber('10000000').mul(precision).valueOf(),//_tokens
//         );
//         //10 ^ 18 * 0.01 / 400 = 25000000000000
//
//         // 10 ^ 18 * 25 / 25000000000000 = 1000000
//         // 1000000 * 115 / 100 = 1150000
//
//         // 10 ^ 18 * 200 / 25000000000000 = 8000000
//         // 8000000 * 106 / 100 = 8480000
//
//         // 10 ^ 18 * 25 / 25000000000000 = 1000000
//         // 1000000 * 103 / 100 = 1030000
//         assert.equal(weis[0], new BigNumber('250').mul(precision).valueOf(), "totalWeiAmount doesn't match");
//         assert.equal(weis[1], new BigNumber('660000').mul(precision).valueOf(), "tokensBonus doesn't match");
//     });
// });