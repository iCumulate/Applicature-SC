var ICUToken = artifacts.require("./ICUToken.sol"),
    ICUStrategy = artifacts.require("./ICUStrategy.sol"),
    ICUCrowdsale = artifacts.require("./test/ICUCrowdsaleTest.sol"),
    MintableTokenAllocator = artifacts.require("./allocator/MintableTokenAllocator.sol"),
    DistributedDirectContributionForwarder = artifacts.require("./contribution/DistributedDirectContributionForwarder.sol"),
    ICUAgent = artifacts.require("./ICUAgent.sol"),

    Utils = require("./utils"),
    BigNumber = require('bignumber.js'),

    precision = new BigNumber("1000000000000000000"),
    usdPrecision = new BigNumber("100000"),
    icoSince = parseInt(new Date().getTime() / 1000 - 3600),
    icoTill = parseInt(new Date().getTime() / 1000) + 3600,
    signAddress = web3.eth.accounts[0],
    bountyAddress = web3.eth.accounts[5],
    applicatureHolder = web3.eth.accounts[8],
    etherHolder = web3.eth.accounts[9];

var abi = require('ethereumjs-abi'),
    BN = require('bn.js');

async function deploy() {
    const token = await ICUToken.new(icoTill);
    const strategy = await ICUStrategy.new([], new BigNumber('400').mul(usdPrecision));

    await strategy.updateDates(0, icoSince, icoTill);
    await strategy.updateDates(1, icoTill + 3600, icoTill + 3600 * 2);

    const contributionForwarder = await DistributedDirectContributionForwarder.new(100, [etherHolder, applicatureHolder], [99, 1]);
    const allocator = await MintableTokenAllocator.new(token.address);
    const crowdsale = await ICUCrowdsale.new(
        allocator.address,
        contributionForwarder.address,
        strategy.address,
        icoSince,
        icoTill
    );

    const agent = await ICUAgent.new(crowdsale.address, token.address, strategy.address);

    return {
        token,
        strategy,
        contributionForwarder,
        allocator,
        crowdsale,
        agent
    };
}

contract('ICUCrowdsale', function (accounts) {

    it("deploy contract & check state", async function () {
        const {
            token,
            strategy,
            contributionForwarder,
            allocator,
            crowdsale,
            agent
        } = await deploy();

        await Utils.checkState({crowdsale}, {
            crowdsale: {
                pricingStrategy: strategy.address,
                currentState: 0,
                allocator: allocator.address,
                contributionForwarder: contributionForwarder.address,
                crowdsaleAgent: 0x0,
                finalized: false,
                startDate: icoSince,
                endDate: icoTill,
                allowWhitelisted: true,
                allowSigned: true,
                allowAnonymous: false,
                tokensSold: new BigNumber('0').mul(precision).valueOf(),
                whitelisted: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                ],
                signers: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                ],
                externalContributionAgents: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                ],
                owner: accounts[0],
                newOwner: 0x0,
            }
        });
    });

    describe('check contribution', async function () {
        let token,
            strategy,
            contributionForwarder,
            allocator,
            crowdsale,
            agent;

        beforeEach(async function () {
            token = await ICUToken.new(icoTill);
            strategy = await ICUStrategy.new([], new BigNumber('400').mul(usdPrecision));

            contributionForwarder = await DistributedDirectContributionForwarder.new(100, [etherHolder, applicatureHolder], [99, 1]);
            allocator = await MintableTokenAllocator.new(token.address);
            crowdsale = await ICUCrowdsale.new(
                allocator.address,
                contributionForwarder.address,
                strategy.address,
                icoSince,
                icoTill
            );
            agent = await ICUAgent.new(crowdsale.address, token.address, strategy.address);

            await allocator.addCrowdsales(crowdsale.address);

            await token.updateMintingAgent(allocator.address, true);
            await token.updateBurnAgent(agent.address, true);
            await token.updateStateChangeAgent(agent.address, true);

            await crowdsale.setCrowdsaleAgent(agent.address);
            await strategy.setCrowdsaleAgent(agent.address);
        });

        it('check flow | updateState & internalContribution & refund', async function () {
            await Utils.checkState({crowdsale}, {
                crowdsale: {
                    softCap: new BigNumber('5000000').mul(usdPrecision).valueOf(),
                    hardCap: new BigNumber('23500000').mul(usdPrecision).valueOf(),
                    usdCollected: new BigNumber('0').mul(usdPrecision).valueOf(),
                    // isBonusIncreased: false,
                    maxSaleSupply: new BigNumber('2350000000').mul(precision).valueOf(),
                    availableBonusAmount: new BigNumber('447500000').mul(precision).valueOf(),
                    contributorBonuses: [
                        {[accounts[0]]: 0},
                        {[accounts[1]]: 0},
                    ],
                    contributorsWei: [
                        {[accounts[0]]: 0},
                        {[accounts[1]]: 0},
                    ],
                    // contributors: [
                    //     {[0]: 0x0},
                    //     {[1]: 0x0},
                    // ],
                    pricingStrategy: strategy.address,
                    currentState: 0,
                    allocator: allocator.address,
                    contributionForwarder: contributionForwarder.address,
                    crowdsaleAgent: agent.address,
                    finalized: false,
                    startDate: icoSince,
                    endDate: icoTill,
                    allowWhitelisted: true,
                    allowSigned: true,
                    allowAnonymous: false,
                    tokensSold: new BigNumber('0').mul(precision).valueOf(),
                    whitelisted: [
                        {[accounts[0]]: false},
                        {[accounts[1]]: false},
                    ],
                    signers: [
                        {[accounts[0]]: false},
                        {[accounts[1]]: false},
                    ],
                    externalContributionAgents: [
                        {[accounts[0]]: false},
                        {[accounts[1]]: false},
                    ],
                    owner: accounts[0],
                    newOwner: 0x0,
                }
            });

            let tierData = await strategy.tiers.call(0);
            await assert.equal(tierData[2], 0, "soldTierTokens is not equal");
            await assert.equal(tierData[3], 0, "bonusTierTokens is not equal");
            tierData = await strategy.tiers.call(1);
            await assert.equal(tierData[2], 0, "soldTierTokens is not equal");
            await assert.equal(tierData[3], 0, "bonusTierTokens is not equal");

            await strategy.updateDates(0, icoTill + 600, icoTill + 1000);
            await strategy.updateDates(1, icoTill + 1600, icoTill + 2600);

            await crowdsale.updateWhitelist(accounts[1], true);
            await crowdsale.sendTransaction({value: new BigNumber('1').mul(precision).valueOf(), from: accounts[1]})
                .then(Utils.receiptShouldFailed)
                .catch(Utils.catchReceiptShouldFailed);

            await strategy.updateDates(0, icoSince, icoTill);
            await strategy.updateDates(1, icoTill + 1600, icoTill + 2600);

            await crowdsale.sendTransaction({value: new BigNumber('20').mul(precision).valueOf(), from: accounts[1]})
            // .then(Utils.receiptShouldFailed);
                .then(Utils.receiptShouldSucceed);

            await strategy.updateDates(0, icoSince - 2600, icoSince - 1600);
            await strategy.updateDates(1, icoSince, icoTill);

            await crowdsale.sendTransaction({value: new BigNumber('1').mul(precision).valueOf(), from: accounts[1]})
                .then(Utils.receiptShouldSucceed);

            tierData = await strategy.tiers.call(0);
            await assert.equal(tierData[2], new BigNumber('800000').mul(precision).valueOf(), "soldTierTokens is not equal");
            await assert.equal(tierData[3], new BigNumber('240000').mul(precision).valueOf(), "bonusTierTokens is not equal");
            tierData = await strategy.tiers.call(1);
            await assert.equal(tierData[2], new BigNumber('40000').mul(precision).valueOf(), "soldTierTokens is not equal");
            await assert.equal(tierData[3], new BigNumber('8000').mul(precision).valueOf(), "bonusTierTokens is not equal");

            await Utils.checkState({crowdsale, token}, {
                token: {
                    balanceOf: [
                        {[accounts[0]]: 0},
                        {
                            [accounts[1]]: new BigNumber('0')
                                .add('800000')
                                .add('40000')
                                .mul(precision).valueOf()
                        },
                    ],
                },
                crowdsale: {
                    softCap: new BigNumber('5000000').mul(usdPrecision).valueOf(),
                    hardCap: new BigNumber('23500000').mul(usdPrecision).valueOf(),
                    usdCollected: new BigNumber('21').mul('400').mul(usdPrecision).valueOf(),
                    // isBonusIncreased: true,
                    maxSaleSupply: new BigNumber('2350000000').mul(precision).valueOf(),
                    availableBonusAmount: new BigNumber('447500000')
                        .sub('240000')
                        .sub('8000')
                        // .add('1000000000')
                        // .sub('800000')
                        .mul(precision).valueOf(),
                    contributorBonuses: [
                        {[accounts[0]]: 0},
                        {[accounts[1]]: new BigNumber('240000').add('8000').mul(precision)},
                    ],
                    contributorsWei: [
                        {[accounts[0]]: 0},
                        {[accounts[1]]: new BigNumber('21').mul(precision).valueOf()},
                    ],
                    contributors: [
                        {[0]: accounts[1]},
                    ],
                    pricingStrategy: strategy.address,
                    currentState: 3,
                    allocator: allocator.address,
                    contributionForwarder: contributionForwarder.address,
                    crowdsaleAgent: agent.address,
                    finalized: false,
                    startDate: icoSince,
                    endDate: icoTill,
                    allowWhitelisted: true,
                    allowSigned: true,
                    allowAnonymous: false,
                    tokensSold: new BigNumber('0')
                        .add('800000')
                        .add('40000')
                        .add('240000')
                        .add('8000')
                        .mul(precision).valueOf(),
                    whitelisted: [
                        {[accounts[0]]: false},
                        {[accounts[1]]: true},
                    ],
                    signers: [
                        {[accounts[0]]: false},
                        {[accounts[1]]: false},
                    ],
                    externalContributionAgents: [
                        {[accounts[0]]: false},
                        {[accounts[1]]: false},
                    ],
                    owner: accounts[0],
                    newOwner: 0x0,
                }
            });

            await crowdsale.claimBonuses()
                .then(Utils.receiptShouldFailed)
                .catch(Utils.catchReceiptShouldFailed);

            await crowdsale.refund({from: accounts[1]})
                .then(Utils.receiptShouldFailed)
                .catch(Utils.catchReceiptShouldFailed);

            await strategy.updateDates(0, icoSince - 8600, icoSince - 7600);
            await strategy.updateDates(1, icoSince - 6600, icoSince - 5600);
            await token.updateBurnAgent(agent.address, true);

            await crowdsale.refund({from: accounts[1]})
            // .then(Utils.receiptShouldFailed);
                .then(Utils.receiptShouldSucceed);

            await Utils.checkState({crowdsale, token}, {
                token: {
                    balanceOf: [
                        {[accounts[0]]: 0},
                        {
                            [accounts[1]]: new BigNumber('0')
                                .add('0')
                                .add('0')
                                .mul(precision).valueOf()
                        },
                    ],
                },
                crowdsale: {
                    softCap: new BigNumber('5000000').mul(usdPrecision).valueOf(),
                    hardCap: new BigNumber('23500000').mul(usdPrecision).valueOf(),
                    usdCollected: new BigNumber('21').mul('400').mul(usdPrecision).valueOf(),
                    // isBonusIncreased: true,
                    maxSaleSupply: new BigNumber('2350000000').mul(precision).valueOf(),
                    availableBonusAmount: new BigNumber('447500000')
                        .sub('240000')
                        .sub('8000')
                        // .add('1000000000')
                        // .sub('800000')
                        .mul(precision).valueOf(),
                    contributorBonuses: [
                        {[accounts[0]]: 0},
                        {[accounts[1]]: new BigNumber('240000').add('8000').mul(precision)},
                    ],
                    contributorsWei: [
                        {[accounts[0]]: 0},
                        {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                    ],
                    contributors: [
                        {[0]: accounts[1]},
                    ],
                    pricingStrategy: strategy.address,
                    currentState: 6,
                    allocator: allocator.address,
                    contributionForwarder: contributionForwarder.address,
                    crowdsaleAgent: agent.address,
                    finalized: false,
                    // startDate: icoSince,
                    // endDate: icoTill,
                    allowWhitelisted: true,
                    allowSigned: true,
                    allowAnonymous: false,
                    tokensSold: new BigNumber('0')
                        .add('800000')
                        .add('40000')
                        .add('240000')
                        .add('8000')
                        .mul(precision).valueOf(),
                    whitelisted: [
                        {[accounts[0]]: false},
                        {[accounts[1]]: true},
                    ],
                    signers: [
                        {[accounts[0]]: false},
                        {[accounts[1]]: false},
                    ],
                    externalContributionAgents: [
                        {[accounts[0]]: false},
                        {[accounts[1]]: false},
                    ],
                    owner: accounts[0],
                    newOwner: 0x0,
                }
            });
        })

        it('check bonuses', async function () {
            await Utils.checkState({crowdsale}, {
                crowdsale: {
                    softCap: new BigNumber('5000000').mul(usdPrecision).valueOf(),
                    hardCap: new BigNumber('23500000').mul(usdPrecision).valueOf(),
                    usdCollected: new BigNumber('0').mul(usdPrecision).valueOf(),
                    // isBonusIncreased: false,
                    maxSaleSupply: new BigNumber('2350000000').mul(precision).valueOf(),
                    availableBonusAmount: new BigNumber('447500000').mul(precision).valueOf(),
                    contributorBonuses: [
                        {[accounts[0]]: 0},
                        {[accounts[1]]: 0},
                    ],
                    contributorsWei: [
                        {[accounts[0]]: 0},
                        {[accounts[1]]: 0},
                    ],
                    // contributors: [
                    //     {[0]: 0x0},
                    //     {[1]: 0x0},
                    // ],
                    pricingStrategy: strategy.address,
                    currentState: 0,
                    allocator: allocator.address,
                    contributionForwarder: contributionForwarder.address,
                    crowdsaleAgent: agent.address,
                    finalized: false,
                    startDate: icoSince,
                    endDate: icoTill,
                    allowWhitelisted: true,
                    allowSigned: true,
                    allowAnonymous: false,
                    tokensSold: new BigNumber('0').mul(precision).valueOf(),
                    whitelisted: [
                        {[accounts[0]]: false},
                        {[accounts[1]]: false},
                    ],
                    signers: [
                        {[accounts[0]]: false},
                        {[accounts[1]]: false},
                    ],
                    externalContributionAgents: [
                        {[accounts[0]]: false},
                        {[accounts[1]]: false},
                    ],
                    owner: accounts[0],
                    newOwner: 0x0,
                }
            });

            await crowdsale.updateWhitelist(accounts[1], true);
            await crowdsale.updateWhitelist(accounts[3], true);
            await strategy.updateDates(0, icoSince, icoTill);
            await strategy.updateDates(1, icoTill + 1600, icoTill + 2600);

            await crowdsale.sendTransaction({value: new BigNumber('20').mul(precision).valueOf(), from: accounts[1]})
                .then(Utils.receiptShouldSucceed);

            await strategy.updateDates(0, icoSince - 2600, icoSince - 1600);
            await strategy.updateDates(1, icoSince, icoTill);

            await crowdsale.sendTransaction({value: new BigNumber('1').mul(precision).valueOf(), from: accounts[1]})
                .then(Utils.receiptShouldSucceed);

            let tierData = await strategy.tiers.call(0);
            await assert.equal(tierData[2], new BigNumber('800000').mul(precision).valueOf(), "soldTierTokens is not equal");
            await assert.equal(tierData[3], new BigNumber('240000').mul(precision).valueOf(), "bonusTierTokens is not equal");
            tierData = await strategy.tiers.call(1);
            await assert.equal(tierData[2], new BigNumber('40000').mul(precision).valueOf(), "soldTierTokens is not equal");
            await assert.equal(tierData[3], new BigNumber('8000').mul(precision).valueOf(), "bonusTierTokens is not equal");

            await Utils.checkState({crowdsale, token}, {
                token: {
                    balanceOf: [
                        {[accounts[0]]: 0},
                        {
                            [accounts[1]]: new BigNumber('0')
                                .add('800000')
                                .add('40000')
                                .mul(precision).valueOf()
                        },
                    ],
                },
                crowdsale: {
                    softCap: new BigNumber('5000000').mul(usdPrecision).valueOf(),
                    hardCap: new BigNumber('23500000').mul(usdPrecision).valueOf(),
                    usdCollected: new BigNumber('21').mul('400').mul(usdPrecision).valueOf(),
                    // isBonusIncreased: true,
                    maxSaleSupply: new BigNumber('2350000000').mul(precision).valueOf(),
                    availableBonusAmount: new BigNumber('447500000')
                        .sub('240000')
                        .sub('8000')
                        // .add('1000000000')
                        // .sub('800000')
                        .mul(precision).valueOf(),
                    contributorBonuses: [
                        {[accounts[0]]: 0},
                        {[accounts[1]]: new BigNumber('240000').add('8000').mul(precision)},
                    ],
                    contributorsWei: [
                        {[accounts[0]]: 0},
                        {[accounts[1]]: new BigNumber('21').mul(precision).valueOf()},
                    ],
                    contributors: [
                        {[0]: accounts[1]},
                    ],
                    pricingStrategy: strategy.address,
                    currentState: 3,
                    allocator: allocator.address,
                    contributionForwarder: contributionForwarder.address,
                    crowdsaleAgent: agent.address,
                    finalized: false,
                    startDate: icoSince,
                    endDate: icoTill,
                    allowWhitelisted: true,
                    allowSigned: true,
                    allowAnonymous: false,
                    tokensSold: new BigNumber('0')
                        .add('800000')
                        .add('40000')
                        .add('240000')
                        .add('8000')
                        .mul(precision).valueOf(),
                    whitelisted: [
                        {[accounts[0]]: false},
                        {[accounts[1]]: true},
                    ],
                    signers: [
                        {[accounts[0]]: false},
                        {[accounts[1]]: false},
                    ],
                    externalContributionAgents: [
                        {[accounts[0]]: false},
                        {[accounts[1]]: false},
                    ],
                    owner: accounts[0],
                    newOwner: 0x0,
                }
            });

            await crowdsale.claimBonuses({from: accounts[1]})
                .then(Utils.receiptShouldFailed)
                .catch(Utils.catchReceiptShouldFailed);

            await strategy.updateDates(0, icoSince - 8600, icoSince - 7600);
            await strategy.updateDates(1, icoSince - 6600, icoSince - 5600);

            await crowdsale.claimBonuses({from: accounts[1]})
                .then(Utils.receiptShouldFailed)
                .catch(Utils.catchReceiptShouldFailed);

            await crowdsale.updateUsdCollected(new BigNumber('5000000').mul(usdPrecision).valueOf());

            await crowdsale.claimBonuses({from: accounts[0]})
                .then(Utils.receiptShouldFailed)
                .catch(Utils.catchReceiptShouldFailed);

            await crowdsale.claimBonuses({from: accounts[1]})
                .then(Utils.receiptShouldSucceed);

            await crowdsale.updateState();

            await Utils.checkState({crowdsale, token}, {
                token: {
                    balanceOf: [
                        {[accounts[0]]: 0},
                        {
                            [accounts[1]]: new BigNumber('0')
                                .add('800000')
                                .add('40000')
                                .add('240000')
                                .add('8000')
                                .mul(precision).valueOf()
                        },
                    ],
                },
                crowdsale: {
                    softCap: new BigNumber('5000000').mul(usdPrecision).valueOf(),
                    hardCap: new BigNumber('23500000').mul(usdPrecision).valueOf(),
                    usdCollected: new BigNumber('5000000').mul(usdPrecision).valueOf(),
                    // isBonusIncreased: true,
                    maxSaleSupply: new BigNumber('2350000000').mul(precision).valueOf(),
                    availableBonusAmount: new BigNumber('447500000')
                        .sub('240000')
                        .sub('8000')
                        // .add('1000000000')
                        // .sub('800000')
                        .mul(precision).valueOf(),
                    contributorBonuses: [
                        {[accounts[0]]: 0},
                        {[accounts[1]]: 0},
                    ],
                    contributorsWei: [
                        {[accounts[0]]: 0},
                        {[accounts[1]]: new BigNumber('21').mul(precision).valueOf()},
                    ],
                    contributors: [
                        {[0]: accounts[1]},
                    ],
                    pricingStrategy: strategy.address,
                    currentState: 4,
                    allocator: allocator.address,
                    contributionForwarder: contributionForwarder.address,
                    crowdsaleAgent: agent.address,
                    finalized: false,
                    // startDate: icoSince,
                    // endDate: icoTill,
                    allowWhitelisted: true,
                    allowSigned: true,
                    allowAnonymous: false,
                    tokensSold: new BigNumber('0')
                        .add('800000')
                        .add('40000')
                        .add('240000')
                        .add('8000')
                        .mul(precision).valueOf(),
                    whitelisted: [
                        {[accounts[0]]: false},
                        {[accounts[1]]: true},
                    ],
                    signers: [
                        {[accounts[0]]: false},
                        {[accounts[1]]: false},
                    ],
                    externalContributionAgents: [
                        {[accounts[0]]: false},
                        {[accounts[1]]: false},
                    ],
                    owner: accounts[0],
                    newOwner: 0x0,
                }
            });

        })

        it('check bonuses > available bonus', async function () {
            await Utils.checkState({crowdsale}, {
                crowdsale: {
                    softCap: new BigNumber('5000000').mul(usdPrecision).valueOf(),
                    hardCap: new BigNumber('23500000').mul(usdPrecision).valueOf(),
                    usdCollected: new BigNumber('0').mul(usdPrecision).valueOf(),
                    // isBonusIncreased: false,
                    maxSaleSupply: new BigNumber('2350000000').mul(precision).valueOf(),
                    availableBonusAmount: new BigNumber('447500000').mul(precision).valueOf(),
                    contributorBonuses: [
                        {[accounts[0]]: 0},
                        {[accounts[1]]: 0},
                    ],
                    contributorsWei: [
                        {[accounts[0]]: 0},
                        {[accounts[1]]: 0},
                    ],
                    // contributors: [
                    //     {[0]: 0x0},
                    //     {[1]: 0x0},
                    // ],
                    pricingStrategy: strategy.address,
                    currentState: 0,
                    allocator: allocator.address,
                    contributionForwarder: contributionForwarder.address,
                    crowdsaleAgent: agent.address,
                    finalized: false,
                    startDate: icoSince,
                    endDate: icoTill,
                    allowWhitelisted: true,
                    allowSigned: true,
                    allowAnonymous: false,
                    tokensSold: new BigNumber('0').mul(precision).valueOf(),
                    whitelisted: [
                        {[accounts[0]]: false},
                        {[accounts[1]]: false},
                    ],
                    signers: [
                        {[accounts[0]]: false},
                        {[accounts[1]]: false},
                    ],
                    externalContributionAgents: [
                        {[accounts[0]]: false},
                        {[accounts[1]]: false},
                    ],
                    owner: accounts[0],
                    newOwner: 0x0,
                }
            });

            await crowdsale.updateWhitelist(accounts[1], true);
            await strategy.updateDates(0, icoSince, icoTill);
            await strategy.updateDates(1, icoTill + 1600, icoTill + 2600);

            await crowdsale.updateAvailableBonusAmount(new BigNumber('200000').mul(precision).valueOf());

            await crowdsale.sendTransaction({value: new BigNumber('20').mul(precision).valueOf(), from: accounts[1]})
                .then(Utils.receiptShouldSucceed);

            await strategy.updateDates(0, icoSince - 2600, icoSince - 1600);
            await strategy.updateDates(1, icoSince, icoTill);

            await crowdsale.sendTransaction({value: new BigNumber('1').mul(precision).valueOf(), from: accounts[1]})
                .then(Utils.receiptShouldSucceed);

            let tierData = await strategy.tiers.call(0);
            await assert.equal(tierData[2], new BigNumber('800000').mul(precision).valueOf(), "soldTierTokens is not equal");
            await assert.equal(tierData[3], new BigNumber('200000').mul(precision).valueOf(), "bonusTierTokens is not equal");
            tierData = await strategy.tiers.call(1);
            await assert.equal(tierData[2], new BigNumber('40000').mul(precision).valueOf(), "soldTierTokens is not equal");
            await assert.equal(tierData[3], new BigNumber('0').mul(precision).valueOf(), "bonusTierTokens is not equal");

            await Utils.checkState({crowdsale, token}, {
                token: {
                    balanceOf: [
                        {[accounts[0]]: 0},
                        {
                            [accounts[1]]: new BigNumber('0')
                                .add('800000')
                                .add('40000')
                                .mul(precision).valueOf()
                        },
                    ],
                },
                crowdsale: {
                    softCap: new BigNumber('5000000').mul(usdPrecision).valueOf(),
                    hardCap: new BigNumber('23500000').mul(usdPrecision).valueOf(),
                    usdCollected: new BigNumber('21').mul('400').mul(usdPrecision).valueOf(),
                    // isBonusIncreased: true,
                    maxSaleSupply: new BigNumber('2350000000').mul(precision).valueOf(),
                    availableBonusAmount: new BigNumber('0')
                        // .sub('240000')
                        // .sub('8000')
                        // .add('1000000000')
                        // .sub('800000')
                        .mul(precision).valueOf(),
                    contributorBonuses: [
                        {[accounts[0]]: 0},
                        {[accounts[1]]: new BigNumber('200000').add('0').mul(precision)},
                    ],
                    contributorsWei: [
                        {[accounts[0]]: 0},
                        {[accounts[1]]: new BigNumber('21').mul(precision).valueOf()},
                    ],
                    contributors: [
                        {[0]: accounts[1]},
                    ],
                    pricingStrategy: strategy.address,
                    currentState: 3,
                    allocator: allocator.address,
                    contributionForwarder: contributionForwarder.address,
                    crowdsaleAgent: agent.address,
                    finalized: false,
                    startDate: icoSince,
                    endDate: icoTill,
                    allowWhitelisted: true,
                    allowSigned: true,
                    allowAnonymous: false,
                    tokensSold: new BigNumber('0')
                        .add('800000')
                        .add('40000')
                        .add('240000')
                        .add('8000')
                        .mul(precision).valueOf(),
                    whitelisted: [
                        {[accounts[0]]: false},
                        {[accounts[1]]: true},
                    ],
                    signers: [
                        {[accounts[0]]: false},
                        {[accounts[1]]: false},
                    ],
                    externalContributionAgents: [
                        {[accounts[0]]: false},
                        {[accounts[1]]: false},
                    ],
                    owner: accounts[0],
                    newOwner: 0x0,
                }
            });

        })

    })
});