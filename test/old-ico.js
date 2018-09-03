// /*
//     Tests:
//     - deploy contract & set crowdsaleAgent, check if the params  are equal
//     - check isSucceed
//         - returns true if state == succeed
//         - returns false otherwise
//     - check updateState
//         - updates state and start and end dates
//     - check internalContribution
//         - multivest and whitelist are allowed
//         - zero weis should fail
//         - outdated should fail
//         - before sale period should fail
//         - success for each  tier (updates  total suply, tokens available, collectedEthers...)
//     - check updateBonusesAmount
//         - should be called only once automaticly
//         - bonus amount should be increased
//     - check claimBonuses
//         - only for contributors
//         - only if softcap met
//     - check refund
//     - check ether receiving
//     - check getTierSoldTokens
//     - check updateTierSoldTokens
// */
// var
//     ICUToken = artifacts.require("./ICUToken.sol"),
//     ICO = artifacts.require("./tests/TestICO.sol"),
//     MintableTokenAllocator = artifacts.require("./allocator/MintableTokenAllocator.sol"),
//     DistributedDirectContributionForwarder = artifacts.require("./contribution/DistributedDirectContributionForwarder.sol"),
//     TokenDateBonusTiersPricingStrategy = artifacts.require("./pricing/TokenDateBonusTiersPricingStrategy.sol"),
//     MintablePausableCrowdsaleOnSuccessAgent = artifacts.require("./agent/MintablePausableCrowdsaleOnSuccessAgent.sol"),
//     StatsContract = artifacts.require("./StatsContract.sol"),
//
//     Utils = require("./utils"),
//     BigNumber = require('BigNumber.js'),
//
//     precision = new BigNumber("1000000000000000000"),
//     usdPrecision = new BigNumber("100000"),
//     icoSince = parseInt(new Date().getTime() / 1000 - 3600),
//     icoTill = parseInt(new Date().getTime() / 1000) + 3600,
//     signAddress = web3.eth.accounts[4],
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
//         new BigNumber('0.2').mul(precision).valueOf(),//minInvest
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
// contract('ICO', function (accounts) {
//
//     it("deploy contract & set crowdsaleAgent, check if the params  are equal | isSucceed", async function () {
//         const {token, ico, pricingStrategy, allocator, contributionForwarder, agent} = await deploy();
//
//         await Utils.checkState({ico}, {
//             ico: {
//                 pricingStrategyImpl: pricingStrategy.address,
//                 availableBonusAmount: new BigNumber('547500000').mul(precision).valueOf(),
//                 isBonusIncreased: false,
//                 contributorBonuses: [
//                     {[accounts[0]]: 0},
//                     {[accounts[1]]: 0},
//                 ],
//                 tierCollectedTokens: [
//                     {[0]: 0},
//                     {[1]: 0},
//                     {[2]: 0},
//                     {[3]: 0},
//                 ],
//                 softCap: new BigNumber('5000000').mul(precision).valueOf(),
//                 contributorsWei: [
//                     {[accounts[0]]: 0},
//                     {[accounts[1]]: 0},
//                 ],
//                 // contributors: [
//                 //     {[0]: 0},
//                 //     {[1]: 0},
//                 // ],
//                 hardCap: new BigNumber('23500000').mul(precision).valueOf(),
//                 currentState: 0,
//                 allocator: allocator.address,
//                 contributionForwarder: contributionForwarder.address,
//                 pricingStrategy: pricingStrategy.address,
//                 crowdsaleAgent: 0x0,
//                 finalized: false,
//                 startDate: 1525996800,
//                 endDate: 1526601600,
//                 allowWhitelisted: true,
//                 allowSigned: true,
//                 allowAnonymous: false,
//                 tokensSold: new BigNumber('0').mul(precision).valueOf(),
//                 whitelisted: [
//                     {[accounts[0]]: false},
//                     {[accounts[1]]: false},
//                 ],
//                 signers: [
//                     {[accounts[0]]: false},
//                     {[accounts[1]]: false},
//                 ],
//                 externalContributionAgents: [
//                     {[accounts[0]]: false},
//                     {[accounts[1]]: false},
//                 ],
//                 owner: accounts[0],
//                 newOwner: 0x0,
//             }
//         });
//
//         await ico.setCrowdsaleAgent(agent.address, {from: accounts[1]})
//             .then(Utils.receiptShouldFailed)
//             .catch(Utils.catchReceiptShouldFailed);
//         await ico.setCrowdsaleAgent(agent.address, {from: accounts[0]});
//
//         await Utils.checkState({ico}, {
//             ico: {
//                 pricingStrategyImpl: pricingStrategy.address,
//                 availableBonusAmount: new BigNumber('547500000').mul(precision).valueOf(),
//                 isBonusIncreased: false,
//                 contributorBonuses: [
//                     {[accounts[0]]: 0},
//                     {[accounts[1]]: 0},
//                 ],
//                 tierCollectedTokens: [
//                     {[0]: 0},
//                     {[1]: 0},
//                     {[2]: 0},
//                     {[3]: 0},
//                 ],
//                 softCap: new BigNumber('5000000').mul(precision).valueOf(),
//                 contributorsWei: [
//                     {[accounts[0]]: 0},
//                     {[accounts[1]]: 0},
//                 ],
//                 // contributors: [
//                 //     {[0]: 0},
//                 //     {[1]: 0},
//                 // ],
//                 hardCap: new BigNumber('23500000').mul(precision).valueOf(),
//                 currentState: 0,
//                 allocator: allocator.address,
//                 contributionForwarder: contributionForwarder.address,
//                 pricingStrategy: pricingStrategy.address,
//                 crowdsaleAgent: agent.address,
//                 finalized: false,
//                 startDate: 1525996800,
//                 endDate: 1526601600,
//                 allowWhitelisted: true,
//                 allowSigned: true,
//                 allowAnonymous: false,
//                 tokensSold: new BigNumber('0').mul(precision).valueOf(),
//                 whitelisted: [
//                     {[accounts[0]]: false},
//                     {[accounts[1]]: false},
//                 ],
//                 signers: [
//                     {[accounts[0]]: false},
//                     {[accounts[1]]: false},
//                 ],
//                 externalContributionAgents: [
//                     {[accounts[0]]: false},
//                     {[accounts[1]]: false},
//                 ],
//                 owner: accounts[0],
//                 newOwner: 0x0,
//             }
//         });
//
//         assert.equal(await ico.isSucceed(), false, "isSucceed doesn't match");
//
//         await ico.testChangeState(2);
//
//         assert.equal(await ico.isSucceed(), false, "isSucceed doesn't match");
//
//         await ico.testChangeState(4);
//
//         assert.equal(await ico.isSucceed(), true, "isSucceed doesn't match");
//     });
//
//     it("initital check | updateState | updateBonusesAmount | refund | internalContribution | updateTierSoldTokens", async function () {
//         const {token, ico, pricingStrategy, allocator, contributionForwarder, agent} = await deploy();
//
//         await Utils.checkState({ico}, {
//             ico: {
//                 pricingStrategyImpl: pricingStrategy.address,
//                 availableBonusAmount: new BigNumber('547500000').mul(precision).valueOf(),
//                 isBonusIncreased: false,
//                 contributorBonuses: [
//                     {[accounts[0]]: 0},
//                     {[accounts[1]]: 0},
//                 ],
//                 tierCollectedTokens: [
//                     {[0]: 0},
//                     {[1]: 0},
//                     {[2]: 0},
//                     {[3]: 0},
//                 ],
//                 softCap: new BigNumber('5000000').mul(precision).valueOf(),
//                 contributorsWei: [
//                     {[accounts[0]]: 0},
//                     {[accounts[1]]: 0},
//                 ],
//                 // contributors: [
//                 //     {[0]: 0},
//                 //     {[1]: 0},
//                 // ],
//                 hardCap: new BigNumber('23500000').mul(precision).valueOf(),
//                 currentState: 0,
//                 allocator: allocator.address,
//                 contributionForwarder: contributionForwarder.address,
//                 pricingStrategy: pricingStrategy.address,
//                 crowdsaleAgent: 0x0,
//                 finalized: false,
//                 startDate: 1525996800,
//                 endDate: 1526601600,
//                 allowWhitelisted: true,
//                 allowSigned: true,
//                 allowAnonymous: false,
//                 tokensSold: new BigNumber('0').mul(precision).valueOf(),
//                 whitelisted: [
//                     {[accounts[0]]: false},
//                     {[accounts[1]]: false},
//                 ],
//                 signers: [
//                     {[accounts[0]]: false},
//                     {[accounts[1]]: false},
//                 ],
//                 externalContributionAgents: [
//                     {[accounts[0]]: false},
//                     {[accounts[1]]: false},
//                 ],
//                 owner: accounts[0],
//                 newOwner: 0x0,
//             }
//         });
//
//         let currentState = await ico.getState()//Initializing
//         assert.equal(currentState, 1, "state doesn't match");
//
//         let isBonusIncreased = await ico.isBonusIncreased.call()
//         assert.equal(isBonusIncreased, false, "isBonusIncreased doesn't match");
//
//         let ethHolderBalance = await Utils.getEtherBalance(etherHolder).valueOf();
//         let acc1Balance = await Utils.getEtherBalance(accounts[1]).valueOf();
//         let acc2Balance = await Utils.getEtherBalance(accounts[2]).valueOf();
//
//         await token.updateMintingAgent(allocator.address, true);
//         await ico.updateWhitelist(accounts[1], true);
//         await ico.setCrowdsaleAgent(agent.address);
//         await allocator.addCrowdsales(ico.address);
//
//         await ico.sendTransaction({value: new BigNumber('1').mul(precision).valueOf(), from: accounts[1]})
//             .then(Utils.receiptShouldFailed)
//             .catch(Utils.catchReceiptShouldFailed);
//
//         currentState = await ico.getState()//BeforeCrowdsale
//         assert.equal(currentState, 2, "state doesn't match");
//
//         await pricingStrategy.updateDates(0, icoSince, icoTill);
//         await ico.updateState();
//
//         currentState = await ico.getState()//InCrowdsale
//         assert.equal(currentState, 3, "state doesn't match");
//
//         isBonusIncreased = await ico.isBonusIncreased.call()
//         assert.equal(isBonusIncreased, false, "isBonusIncreased doesn't match");
//
//         await ico.sendTransaction({value: new BigNumber('1').mul(precision).valueOf(), from: accounts[1]})
//             .then(Utils.receiptShouldSucceed);
//
//         await makeTransactionKYC(ico, bountyAddress, accounts[2], new BigNumber('2').mul(precision))
//             .then(Utils.receiptShouldFailed)
//             .catch(Utils.catchReceiptShouldFailed);
//
//         await ico.addSigner(signAddress);
//
//         await makeTransactionKYC(ico, signAddress, accounts[2], new BigNumber('2').mul(precision))
//             .then(Utils.receiptShouldSucceed);
//
//         await makeTransactionKYC(ico, signAddress, accounts[2], new BigNumber('0').mul(precision))
//             .then(Utils.receiptShouldFailed)
//             .catch(Utils.catchReceiptShouldFailed);
//
//         isBonusIncreased = await ico.isBonusIncreased.call()
//         assert.equal(isBonusIncreased, false, "isBonusIncreased doesn't match");
//
//         await pricingStrategy.updateDates(0, icoSince - 3600 * 2, icoSince - 3600);
//         await ico.updateState();
//
//         await Utils.checkState({ico}, {
//             ico: {
//                 pricingStrategyImpl: pricingStrategy.address,
//                 availableBonusAmount: new BigNumber('547500000').sub('36000').mul(precision).valueOf(),
//                 isBonusIncreased: false,
//                 contributorBonuses: [
//                     {[accounts[1]]: new BigNumber('12000').mul(precision).valueOf()},
//                     {[accounts[2]]: new BigNumber('12000').mul(2).mul(precision).valueOf()},
//                 ],
//                 tierCollectedTokens: [
//                     {[0]: new BigNumber('40000').mul(3).mul(precision).valueOf()},
//                     {[1]: 0},
//                     {[2]: 0},
//                     {[3]: 0},
//                 ],
//                 softCap: new BigNumber('5000000').mul(precision).valueOf(),
//                 contributorsWei: [
//                     {[accounts[1]]: new BigNumber('1').mul(precision).valueOf()},
//                     {[accounts[2]]: new BigNumber('2').mul(precision).valueOf()},
//                 ],
//                 // contributors: [
//                 //     {[0]: 0},
//                 //     {[1]: 0},
//                 // ],
//                 hardCap: new BigNumber('23500000').mul(precision).valueOf(),
//                 currentState: 2,
//                 allocator: allocator.address,
//                 contributionForwarder: contributionForwarder.address,
//                 pricingStrategy: pricingStrategy.address,
//                 crowdsaleAgent: agent.address,
//                 finalized: false,
//                 // startDate: 1525996800,
//                 // endDate: 1526601600,
//                 allowWhitelisted: true,
//                 allowSigned: true,
//                 allowAnonymous: false,
//                 tokensSold: new BigNumber('40000').mul(3).mul(precision).valueOf(),
//                 whitelisted: [
//                     {[accounts[2]]: false},
//                     {[accounts[1]]: true},
//                 ],
//                 signers: [
//                     {[accounts[0]]: false},
//                     {[accounts[1]]: false},
//                     {[signAddress]: true},
//                 ],
//                 externalContributionAgents: [
//                     {[accounts[0]]: false},
//                     {[accounts[1]]: false},
//                 ],
//                 owner: accounts[0],
//                 newOwner: 0x0,
//             }
//         });
//
//         currentState = await ico.getState()//BeforeCrowdsale
//         assert.equal(currentState, 2, "state doesn't match");
//
//         await pricingStrategy.updateDates(1, icoSince, icoTill);
//         await ico.updateState();
//
//         currentState = await ico.getState()//InCrowdsale
//         assert.equal(currentState, 3, "state doesn't match");
//
//         let bonuses = await ico.availableBonusAmount.call()
//         assert.equal(bonuses, new BigNumber('547500000').sub('12000').sub('24000').mul(precision).valueOf(), "bonuses doesn't match");
//
//         await ico.sendTransaction({value: new BigNumber('0.19').mul(precision).valueOf(), from: accounts[1]})
//             .then(Utils.receiptShouldFailed)
//             .catch(Utils.catchReceiptShouldFailed);
//
//         await ico.sendTransaction({value: new BigNumber('0.2').mul(precision).valueOf(), from: accounts[1]})
//             .then(Utils.receiptShouldSucceed);
//
//         bonuses = await ico.availableBonusAmount.call()
//         //preico hard cap - 10000000
//         //sold - 40000 + 80000 = 120000
//         //bonuses 12000 + 24000 + 1200
//         assert.equal(bonuses, new BigNumber('547500000').sub('12000').sub('1200').sub('24000').add('10000000').sub('120000').mul(precision).valueOf(), "bonuses doesn't match");
//
//         await pricingStrategy.updateDates(1, icoSince - 3600 * 2, icoSince - 3600);
//         await pricingStrategy.updateDates(2, icoSince - 3600 * 2, icoSince - 3600);
//         await pricingStrategy.updateDates(3, icoSince - 3600 * 2, icoSince - 3600);
//         await ico.updateState();
//
//         currentState = await ico.getState()//Refunding
//         assert.equal(currentState, 6, "state doesn't match");
//
//         await Utils.balanceShouldEqualTo(token, accounts[1], new BigNumber("48000").mul(precision).valueOf());
//         await Utils.balanceShouldEqualTo(token, accounts[2], new BigNumber("80000").mul(precision).valueOf());
//
//         await ico.claimBonuses({from:accounts[1]});
//         await ico.claimBonuses({from:accounts[2]});
//
//         await Utils.balanceShouldEqualTo(token, accounts[1], new BigNumber("48000").mul(precision).valueOf());
//         await Utils.balanceShouldEqualTo(token, accounts[2], new BigNumber("80000").mul(precision).valueOf());
//
//
//         let acc10Balance = await Utils.getEtherBalance(accounts[1]).valueOf();
//         let acc20Balance = await Utils.getEtherBalance(accounts[2]).valueOf();
//
//         await token.updateBurnAgent(agent.address, true);
//
//         await ico.refund({from:accounts[1]});
//         await ico.refund({from:accounts[2]});
//
//         console.log('acc1 balance before transactions -', new BigNumber(acc1Balance).valueOf());
//         console.log('              after transactions -', new BigNumber(acc10Balance).valueOf());
//         console.log('              after refunddddddd -', new BigNumber(await Utils.getEtherBalance(accounts[1])).valueOf());
//         console.log('                     differencee -', new BigNumber(new BigNumber(await Utils.getEtherBalance(accounts[1]))).sub(acc10Balance).div(precision).valueOf());
//         console.log('                     should be   -', new BigNumber('1').add('0.2').valueOf());
//
//         console.log('acc2 balance before transactions -', new BigNumber(acc2Balance).valueOf());
//         console.log('              after transactions -', new BigNumber(acc20Balance).valueOf());
//         console.log('              after refunddddddd -', new BigNumber(await Utils.getEtherBalance(accounts[2])).valueOf());
//         console.log('                     differencee -', new BigNumber(new BigNumber(await Utils.getEtherBalance(accounts[2]))).sub(acc20Balance).div(precision).valueOf());
//         console.log('                     should be   -', new BigNumber('2').valueOf());
//
//         await Utils.balanceShouldEqualTo(token, accounts[1], new BigNumber("0").mul(precision).valueOf());
//         await Utils.balanceShouldEqualTo(token, accounts[2], new BigNumber("0").mul(precision).valueOf());
//
//         await Utils.checkState({ico}, {
//             ico: {
//                 pricingStrategyImpl: pricingStrategy.address,
//                 availableBonusAmount: new BigNumber('547500000').sub('12000').sub('1200').sub('24000').add('10000000').sub('120000').mul(precision).valueOf(),
//                 isBonusIncreased: true,
//                 contributorBonuses: [
//                     {[accounts[1]]: new BigNumber('12000').add('1200').mul(precision).valueOf()},
//                     {[accounts[2]]: new BigNumber('12000').mul(2).mul(precision).valueOf()},
//                 ],
//                 tierCollectedTokens: [
//                     {[0]: new BigNumber('40000').mul(3).mul(precision).valueOf()},
//                     {[1]: new BigNumber('8000').mul(precision).valueOf()},
//                     {[2]: 0},
//                     {[3]: 0},
//                 ],
//                 softCap: new BigNumber('5000000').mul(precision).valueOf(),
//                 contributorsWei: [
//                     {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
//                     {[accounts[2]]: new BigNumber('0').mul(precision).valueOf()},
//                 ],
//                 // contributors: [
//                 //     {[0]: 0},
//                 //     {[1]: 0},
//                 // ],
//                 hardCap: new BigNumber('23500000').mul(precision).valueOf(),
//                 currentState: 6,
//                 allocator: allocator.address,
//                 contributionForwarder: contributionForwarder.address,
//                 pricingStrategy: pricingStrategy.address,
//                 crowdsaleAgent: agent.address,
//                 finalized: false,
//                 // startDate: 1525996800,
//                 // endDate: 1526601600,
//                 allowWhitelisted: true,
//                 allowSigned: true,
//                 allowAnonymous: false,
//                 tokensSold: new BigNumber('40000').mul(3).add('8000').mul(precision).valueOf(),
//                 whitelisted: [
//                     {[accounts[2]]: false},
//                     {[accounts[1]]: true},
//                 ],
//                 signers: [
//                     {[accounts[0]]: false},
//                     {[accounts[1]]: false},
//                     {[signAddress]: true},
//                 ],
//                 externalContributionAgents: [
//                     {[accounts[0]]: false},
//                     {[accounts[1]]: false},
//                 ],
//                 owner: accounts[0],
//                 newOwner: 0x0,
//             }
//         });
//
//     });
//
//     it("ether receiving | updateTierSoldTokens | claimBonuses", async function () {
//         const {token, ico, pricingStrategy, allocator, contributionForwarder, agent} = await deploy();
//
//         const statsContract = await StatsContract.new(token.address, ico.address, pricingStrategy.address);
//
//         let stats = await statsContract.getStats();
//         assert.equal(stats[0], 1525996800, "startDate doesn't match");
//         assert.equal(stats[1], 1526601600, "endDate doesn't match");
//         assert.equal(stats[2], 0, "tokensSold doesn't match");
//         assert.equal(stats[3], new BigNumber('23500000').mul(precision).valueOf(), "hardCap doesn't match");
//         assert.equal(stats[4], new BigNumber('5000000').mul(precision).valueOf(), "softCap doesn't match");
//         assert.equal(stats[5], new BigNumber('547500000').mul(precision).valueOf(), "availableBonusAmount doesn't match");
//
//         assert.equal(stats[6][0], new BigNumber('25000000000000').valueOf(), "tokenInWei doesn't match");
//         assert.equal(stats[6][1], new BigNumber('10000000').mul(precision).valueOf(), "maxTokensCollected doesn't match");
//         assert.equal(stats[6][2], 30, "bonusPercents doesn't match");
//         assert.equal(stats[6][3], new BigNumber('0.2').mul(precision).valueOf(), "minInvestInWei doesn't match");
//         assert.equal(stats[6][4], icoTill + 3600, "startDate doesn't match");
//         assert.equal(stats[6][5], icoTill + 3600 * 2, "endDate doesn't match");
//
//         assert.equal(stats[6][6], new BigNumber('25000000000000').valueOf(), "tokenInWei doesn't match");
//         assert.equal(stats[6][7], new BigNumber('4000000').mul(precision).valueOf(), "maxTokensCollected doesn't match");
//         assert.equal(stats[6][8], 15, "bonusPercents doesn't match");
//         assert.equal(stats[6][9], new BigNumber('0.2').mul(precision).valueOf(), "minInvestInWei doesn't match");
//         assert.equal(stats[6][10], icoTill + 3600, "startDate doesn't match");
//         assert.equal(stats[6][11], icoTill + 3600 * 2, "endDate doesn't match");
//
//         assert.equal(stats[6][12], new BigNumber('25000000000000').valueOf(),"tokenInWei doesn't match");
//         assert.equal(stats[6][13], new BigNumber('8000000').mul(precision).valueOf(), "maxTokensCollected doesn't match");
//         assert.equal(stats[6][14], 6, "bonusPercents doesn't match");
//         assert.equal(stats[6][15], new BigNumber('0.2').mul(precision).valueOf(), "minInvestInWei doesn't match");
//         assert.equal(stats[6][16], icoTill + 3600, "startDate doesn't match");
//         assert.equal(stats[6][17], icoTill + 3600 * 2, "endDate doesn't match");
//
//         assert.equal(stats[6][18], new BigNumber('25000000000000').valueOf(),"tokenInWei doesn't match");
//         assert.equal(stats[6][19], new BigNumber('1500000').mul(precision).valueOf(), "maxTokensCollected doesn't match");
//         assert.equal(stats[6][20], 3, "bonusPercents doesn't match");
//         assert.equal(stats[6][21], new BigNumber('0.2').mul(precision).valueOf(), "minInvestInWei doesn't match");
//         assert.equal(stats[6][22], icoTill + 3600, "startDate doesn't match");
//         assert.equal(stats[6][23], icoTill + 3600 * 2, "endDate doesn't match");
//
//         await Utils.checkState({ico}, {
//             ico: {
//                 pricingStrategyImpl: pricingStrategy.address,
//                 availableBonusAmount: new BigNumber('547500000').mul(precision).valueOf(),
//                 isBonusIncreased: false,
//                 contributorBonuses: [
//                     {[accounts[0]]: 0},
//                     {[accounts[1]]: 0},
//                 ],
//                 tierCollectedTokens: [
//                     {[0]: 0},
//                     {[1]: 0},
//                     {[2]: 0},
//                     {[3]: 0},
//                 ],
//                 softCap: new BigNumber('5000000').mul(precision).valueOf(),
//                 contributorsWei: [
//                     {[accounts[0]]: 0},
//                     {[accounts[1]]: 0},
//                 ],
//                 // contributors: [
//                 //     {[0]: 0},
//                 //     {[1]: 0},
//                 // ],
//                 hardCap: new BigNumber('23500000').mul(precision).valueOf(),
//                 currentState: 0,
//                 allocator: allocator.address,
//                 contributionForwarder: contributionForwarder.address,
//                 pricingStrategy: pricingStrategy.address,
//                 crowdsaleAgent: 0x0,
//                 finalized: false,
//                 startDate: 1525996800,
//                 endDate: 1526601600,
//                 allowWhitelisted: true,
//                 allowSigned: true,
//                 allowAnonymous: false,
//                 tokensSold: new BigNumber('0').mul(precision).valueOf(),
//                 whitelisted: [
//                     {[accounts[0]]: false},
//                     {[accounts[1]]: false},
//                 ],
//                 signers: [
//                     {[accounts[0]]: false},
//                     {[accounts[1]]: false},
//                 ],
//                 externalContributionAgents: [
//                     {[accounts[0]]: false},
//                     {[accounts[1]]: false},
//                 ],
//                 owner: accounts[0],
//                 newOwner: 0x0,
//             }
//         });
//
//         let ethHolderBalance = await Utils.getEtherBalance(etherHolder).valueOf();
//         let ethHolderApplicatureBalance = await Utils.getEtherBalance(etherHolderApplicature).valueOf();
//
//         let currentState = await ico.getState()//Initializing
//         assert.equal(currentState, 1, "state doesn't match");
//
//         await token.updateMintingAgent(allocator.address, true);
//         await ico.updateWhitelist(accounts[1], true);
//         await ico.updateWhitelist(accounts[2], true);
//         await ico.updateWhitelist(accounts[3], true);
//         await ico.setCrowdsaleAgent(agent.address);
//         await token.updateStateChangeAgent(agent.address, true);
//         await token.addPauseAgent(agent.address);
//         await allocator.addCrowdsales(ico.address);
//
//         await pricingStrategy.updateDates(0, icoSince, icoTill);
//         await ico.updateState();
//
//         currentState = await ico.getState()//InCrowdsale
//         assert.equal(currentState, 3, "state doesn't match");
//
//         await ico.sendTransaction({value: new BigNumber('20').mul(precision).valueOf(), from: accounts[1]})
//             .then(Utils.receiptShouldSucceed);
//
//         await pricingStrategy.updateDates(0, icoSince - 3600 * 2, icoSince - 3600);
//         await ico.updateState();
//
//         currentState = await ico.getState()//BeforeCrowdsale
//         assert.equal(currentState, 2, "state doesn't match");
//
//         await pricingStrategy.updateDates(1, icoSince, icoTill);
//         await ico.updateState();
//
//         await ico.sendTransaction({value: new BigNumber('1').mul(precision).valueOf(), from: accounts[2]})
//             .then(Utils.receiptShouldSucceed);
//
//         await Utils.balanceShouldEqualTo(token, accounts[2], new BigNumber("40000").mul(precision).valueOf());
//         await ico.claimBonuses({from: accounts[2]});
//         await Utils.balanceShouldEqualTo(token, accounts[2], new BigNumber("40000").mul(precision).valueOf());
//
//         await pricingStrategy.updateDates(1, icoSince - 3600 * 2, icoSince - 3600);
//         await pricingStrategy.updateDates(2, icoSince, icoTill);
//         await pricingStrategy.updateDates(3, icoSince, icoTill);
//         await ico.updateState();
//
//         //acc1 - 800000
//         //acc2 - 40000
//         await ico.testChangeSoldTokens(new BigNumber('7000000').add('800000').add('40000').mul(precision).valueOf());
//
//         await ico.testUpdateTierSoldTokens(new BigNumber('7000000').mul(precision).valueOf());
//
//         await Utils.checkState({ico}, {
//             ico: {
//                 pricingStrategyImpl: pricingStrategy.address,
//                 availableBonusAmount: new BigNumber('547500000').sub('240000').sub('6000').add('10000000').sub('800000').mul(precision).valueOf(),
//                 isBonusIncreased: true,
//                 contributorBonuses: [
//                     {[accounts[1]]: new BigNumber('240000').mul(precision).valueOf()},
//                     {[accounts[2]]: new BigNumber('6000').mul(precision).valueOf()},
//                 ],
//                 tierCollectedTokens: [
//                     {[0]: new BigNumber('800000').mul(precision).valueOf()},
//                     {[1]: new BigNumber('40000').mul(precision).valueOf()},
//                     {[2]: new BigNumber('7000000').mul(precision).valueOf()},
//                     {[3]: 0},
//                 ],
//                 softCap: new BigNumber('5000000').mul(precision).valueOf(),
//                 contributorsWei: [
//                     {[accounts[1]]: new BigNumber('20').mul(precision).valueOf()},
//                     {[accounts[2]]: new BigNumber('1').mul(precision).valueOf()},
//                 ],
//                 // contributors: [
//                 //     {[0]: 0},
//                 //     {[1]: 0},
//                 // ],
//                 hardCap: new BigNumber('23500000').mul(precision).valueOf(),
//                 currentState: 3,
//                 allocator: allocator.address,
//                 contributionForwarder: contributionForwarder.address,
//                 pricingStrategy: pricingStrategy.address,
//                 crowdsaleAgent: agent.address,
//                 finalized: false,
//                 // startDate: 1525996800,
//                 // endDate: 1526601600,
//                 allowWhitelisted: true,
//                 allowSigned: true,
//                 allowAnonymous: false,
//                 tokensSold: new BigNumber('7000000').add('800000').add('40000').mul(precision).valueOf(),
//                 whitelisted: [
//                     {[accounts[2]]: true},
//                     {[accounts[1]]: true},
//                 ],
//                 signers: [
//                     {[accounts[0]]: false},
//                     {[accounts[1]]: false},
//                 ],
//                 externalContributionAgents: [
//                     {[accounts[0]]: false},
//                     {[accounts[1]]: false},
//                 ],
//                 owner: accounts[0],
//                 newOwner: 0x0,
//             }
//         });
//
//         //acc3 - 1200000
//         //8000000 - 7000000 = 1000000
//         //1000000 * 6 / 100 = 60000
//         //(1200000 - 1000000) * 3 / 100 = 6000
//         await ico.sendTransaction({value: new BigNumber('30').mul(precision).valueOf(), from: accounts[3]})
//             .then(Utils.receiptShouldSucceed);
//
//         console.log('etherholder balance after transaction is       :', new BigNumber(await Utils.getEtherBalance(etherHolder)).valueOf());
//         console.log('etherholder balance after transaction should be:', new BigNumber('29.7').mul(precision).add(ethHolderBalance).valueOf());
//
//         console.log('etherHolderApplicature balance after transaction is       :', new BigNumber(await Utils.getEtherBalance(etherHolderApplicature)).valueOf());
//         console.log('etherHolderApplicature balance after transaction should be:', new BigNumber('0.3').mul(precision).add(ethHolderApplicatureBalance).valueOf());
//
//         await Utils.checkState({ico}, {
//             ico: {
//                 pricingStrategyImpl: pricingStrategy.address,
//                 availableBonusAmount: new BigNumber('547500000').sub('240000').sub('6000').add('10000000').sub('800000').sub('60000').sub('6000').mul(precision).valueOf(),
//                 isBonusIncreased: true,
//                 contributorBonuses: [
//                     {[accounts[1]]: new BigNumber('240000').mul(precision).valueOf()},
//                     {[accounts[2]]: new BigNumber('6000').mul(precision).valueOf()},
//                     {[accounts[3]]: new BigNumber('60000').add('6000').mul(precision).valueOf()},
//                 ],
//                 tierCollectedTokens: [
//                     {[0]: new BigNumber('800000').mul(precision).valueOf()},
//                     {[1]: new BigNumber('40000').mul(precision).valueOf()},
//                     {[2]: new BigNumber('8000000').mul(precision).valueOf()},
//                     {[3]: new BigNumber('200000').mul(precision).valueOf()},
//                 ],
//                 softCap: new BigNumber('5000000').mul(precision).valueOf(),
//                 contributorsWei: [
//                     {[accounts[1]]: new BigNumber('20').mul(precision).valueOf()},
//                     {[accounts[2]]: new BigNumber('1').mul(precision).valueOf()},
//                     {[accounts[3]]: new BigNumber('0').mul(precision).valueOf()},
//                 ],
//                 // contributors: [
//                 //     {[0]: 0},
//                 //     {[1]: 0},
//                 // ],
//                 hardCap: new BigNumber('23500000').mul(precision).valueOf(),
//                 currentState: 3,
//                 allocator: allocator.address,
//                 contributionForwarder: contributionForwarder.address,
//                 pricingStrategy: pricingStrategy.address,
//                 crowdsaleAgent: agent.address,
//                 finalized: false,
//                 // startDate: 1525996800,
//                 // endDate: 1526601600,
//                 allowWhitelisted: true,
//                 allowSigned: true,
//                 allowAnonymous: false,
//                 tokensSold: new BigNumber('7000000').add('800000').add('40000').add('1200000').mul(precision).valueOf(),
//                 whitelisted: [
//                     {[accounts[2]]: true},
//                     {[accounts[1]]: true},
//                 ],
//                 signers: [
//                     {[accounts[0]]: false},
//                     {[accounts[1]]: false},
//                 ],
//                 externalContributionAgents: [
//                     {[accounts[0]]: false},
//                     {[accounts[1]]: false},
//                 ],
//                 owner: accounts[0],
//                 newOwner: 0x0,
//             }
//         });
//
//         await ico.updateState();
//         stats = await statsContract.getStats();
//         assert.equal(stats[0], icoSince, "startDate doesn't match");
//         assert.equal(stats[1], icoTill, "endDate doesn't match");
//         assert.equal(stats[2], new BigNumber('7000000').add('800000').add('40000').add('1200000').mul(precision).valueOf(), "tokensSold doesn't match");
//         assert.equal(stats[3], new BigNumber('23500000').mul(precision).valueOf(), "hardCap doesn't match");
//         assert.equal(stats[4], new BigNumber('5000000').mul(precision).valueOf(), "softCap doesn't match");
//         assert.equal(stats[5], new BigNumber('547500000').sub('240000').sub('6000').add('10000000').sub('800000').sub('60000').sub('6000').mul(precision).valueOf(), "availableBonusAmount doesn't match");
//
//         assert.equal(stats[6][0], new BigNumber('25000000000000').valueOf(), "tokenInWei doesn't match");
//         assert.equal(stats[6][1], new BigNumber('10000000').mul(precision).valueOf(), "maxTokensCollected doesn't match");
//         assert.equal(stats[6][2], 30, "bonusPercents doesn't match");
//         assert.equal(stats[6][3], new BigNumber('0.2').mul(precision).valueOf(), "minInvestInWei doesn't match");
//         assert.equal(stats[6][4], icoSince - 3600 * 2, "startDate doesn't match");
//         assert.equal(stats[6][5], icoSince - 3600, "endDate doesn't match");
//
//         assert.equal(stats[6][6], new BigNumber('25000000000000').valueOf(), "tokenInWei doesn't match");
//         assert.equal(stats[6][7], new BigNumber('4000000').mul(precision).valueOf(), "maxTokensCollected doesn't match");
//         assert.equal(stats[6][8], 15, "bonusPercents doesn't match");
//         assert.equal(stats[6][9], new BigNumber('0.2').mul(precision).valueOf(), "minInvestInWei doesn't match");
//         assert.equal(stats[6][10], icoSince - 3600 * 2, "startDate doesn't match");
//         assert.equal(stats[6][11], icoSince - 3600, "endDate doesn't match");
//
//         assert.equal(stats[6][12], new BigNumber('25000000000000').valueOf(),"tokenInWei doesn't match");
//         assert.equal(stats[6][13], new BigNumber('8000000').mul(precision).valueOf(), "maxTokensCollected doesn't match");
//         assert.equal(stats[6][14], 6, "bonusPercents doesn't match");
//         assert.equal(stats[6][15], new BigNumber('0.2').mul(precision).valueOf(), "minInvestInWei doesn't match");
//         assert.equal(stats[6][16], icoSince, "startDate doesn't match");
//         assert.equal(stats[6][17], icoTill, "endDate doesn't match");
//
//         assert.equal(stats[6][18], new BigNumber('25000000000000').valueOf(),"tokenInWei doesn't match");
//         assert.equal(stats[6][19], new BigNumber('1500000').mul(precision).valueOf(), "maxTokensCollected doesn't match");
//         assert.equal(stats[6][20], 3, "bonusPercents doesn't match");
//         assert.equal(stats[6][21], new BigNumber('0.2').mul(precision).valueOf(), "minInvestInWei doesn't match");
//         assert.equal(stats[6][22], icoSince, "startDate doesn't match");
//         assert.equal(stats[6][23], icoTill, "endDate doesn't match");
//
//         await Utils.balanceShouldEqualTo(token, accounts[1], new BigNumber("800000").mul(precision).valueOf());
//         await Utils.balanceShouldEqualTo(token, accounts[2], new BigNumber("40000").mul(precision).valueOf());
//         await Utils.balanceShouldEqualTo(token, accounts[3], new BigNumber("1200000").mul(precision).valueOf());
//
//         await ico.claimBonuses({from: accounts[1]});
//         await ico.claimBonuses({from: accounts[3]});
//
//         await Utils.balanceShouldEqualTo(token, accounts[1], new BigNumber("800000").add('240000').mul(precision).valueOf());
//         await Utils.balanceShouldEqualTo(token, accounts[2], new BigNumber("40000").mul(precision).valueOf());
//         await Utils.balanceShouldEqualTo(token, accounts[3], new BigNumber("1200000").add('60000').add('6000').mul(precision).valueOf());
//
//         await ico.updateState();
//         currentState = await ico.getState()//InCrowdsale
//         assert.equal(currentState, 3, "state doesn't match");
//
//         await pricingStrategy.updateDates(1, icoSince - 3600 * 2, icoSince - 3600);
//         await pricingStrategy.updateDates(2, icoSince - 3600 * 2, icoSince - 3600);
//         await pricingStrategy.updateDates(3, icoSince - 3600 * 2, icoSince - 3600);
//         await ico.updateState();
//
//         currentState = await ico.getState()//Success
//         assert.equal(currentState, 4, "state doesn't match");
//
//     });
//
// });