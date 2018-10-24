var
    Token = artifacts.require('./token/erc20/MintableToken'),
    TokenAllocator = artifacts.require('./allocator/MintableTokenAllocator'),
    PricingStrategy = artifacts.require('./test/USDDateTiersPricingStrategy.sol'),
    ContributionForwarder = artifacts.require("./contribution/DistributedDirectContributionForwarder.sol"),
    HardCappedCrowdsale = artifacts.require("./test/HardCappedCrowdsaleTest.sol"),
    Agent = artifacts.require("./test/MintableCrowdsaleOnSuccessAgentTest.sol"),
    utils = require("./utils"),
    BigNumber = require('bignumber.js'),
    precision = new BigNumber("1000000000000000000"),
    usdPrecision = new BigNumber("100000"),
    icoSince = parseInt(new Date().getTime() / 1000 - 3600),
    icoTill = parseInt(new Date().getTime() / 1000) + 3600;

contract('HardCappedCrowdsale', accounts => {

    let token,
        allocator,
        contributionForwarder,
        strategy,
        crowdsale;

    beforeEach(async function () {
        token = await Token.new(new BigNumber('400').mul(precision), 0, true)
        allocator = await TokenAllocator.new(token.address);
        contributionForwarder = await ContributionForwarder.new(100, [accounts[0]], [100]);
        strategy = await PricingStrategy.new([///privateSale
            new BigNumber('1').mul(usdPrecision).valueOf(), //     uint256 tokenInUSD;
            0,// uint256 maxTokensCollected;
            0,// uint256 discountPercents;
            0,// uint256 bonusPercents;
            1000000,// uint256 minInvestInUSD;
            0,// uint256 maxInvestInUSD;
            icoSince,// uint256 startDate;
            icoTill,// uint256 endDate;
            ///preSale
            new BigNumber('1').mul(usdPrecision).valueOf(), //     uint256 tokenInUSD;
            500,// uint256 maxTokensCollected;
            30,// uint256 discountPercents;
            0,// uint256 bonusPercents;
            50000000,// uint256 minInvestInUSD;
            0,// uint256 maxInvestInUSD;
            icoTill + 3600,// uint256 startDate;
            icoTill + 3600 * 2,// uint256 endDate;
            ///ICO Tier1
            new BigNumber('1').mul(usdPrecision).valueOf(), //     uint256 tokenInUSD;
            0,// uint256 maxTokensCollected;
            25,// uint256 discountPercents;
            0,// uint256 bonusPercents;
            100000000,// uint256 minInvestInUSD;
            0,// uint256 maxInvestInUSD;
            icoTill + 3600,// uint256 startDate;
            icoTill + 3600 * 2,// uint256 endDate;
            ///ICO Tier2
            new BigNumber('1').mul(usdPrecision).valueOf(), //     uint256 tokenInUSD;
            0,// uint256 maxTokensCollected;
            20,// uint256 discountPercents;
            0,// uint256 bonusPercents;
            100000000,// uint256 minInvestInUSD;
            0,// uint256 maxInvestInUSD;
            icoTill + 3600,// uint256 startDate;
            icoTill + 3600 * 2,// uint256 endDate;
            ///ICO Tier3
            new BigNumber('1').mul(usdPrecision).valueOf(), //     uint256 tokenInUSD;
            0,// uint256 maxTokensCollected;
            10,// uint256 discountPercents;
            0,// uint256 bonusPercents;
            100000000,// uint256 minInvestInUSD;
            0,// uint256 maxInvestInUSD;
            icoTill + 3600,// uint256 startDate;
            icoTill + 3600 * 2,// uint256 endDate;
            ///ICO Tier4
            new BigNumber('1').mul(usdPrecision).valueOf(), //     uint256 tokenInUSD;
            0,// uint256 maxTokensCollected;
            0,// uint256 discountPercents;
            0,// uint256 bonusPercents;
            100000000,// uint256 minInvestInUSD;
            0,// uint256 maxInvestInUSD;
            icoTill + 3600,// uint256 startDate;
            icoTill + 3600 * 2// uint256 endDate;
        ], 18, 750450);
        crowdsale = await HardCappedCrowdsale.new(
            allocator.address,
            contributionForwarder.address,
            strategy.address,
            icoSince,
            icoTill,
            true,
            true,
            false,
            new BigNumber('400').mul(precision)
        );

        await token.updateMintingAgent(allocator.address, true);
        await allocator.addCrowdsales(accounts[0]);
        await allocator.addCrowdsales(crowdsale.address);
        await token.updateMintingAgent(allocator.address, true);
        await token.updateMintingAgent(accounts[0], true);

        agent = await Agent.new(crowdsale.address, token.address);

        await token.updateMintingAgent(allocator.address, true);
        await token.updateStateChangeAgent(agent.address, true);

        await crowdsale.setCrowdsaleAgent(agent.address);
        await crowdsale.addSigner(accounts[0]);
        await crowdsale.addExternalContributor(accounts[0]);
    });

    describe('check getState', () => {
        it('should return Success as crowdsale continues and hardcap is achieved', async () => {
            await crowdsale.updateSoldTokens(new BigNumber(400).mul(precision))
            let state = await crowdsale.getState.call()
            assert.equal(state.toString(), 4, 'state is not equal')
        });

        it('should return InCrowdsale as crowdsale continues and hardcap is not achieved', async () => {
            let state = await crowdsale.getState.call()
            assert.equal(state.valueOf(), 3, 'state is not equal')
        });

        it('should return BeforeCrowdsale as crowdsale has not been started', async () => {
            await crowdsale.updateStartDate(new BigNumber(icoTill).sub(10))
            let state = await crowdsale.getState.call()
            assert.equal(state.toString(), 2, 'state is not equal')
        });
    });

    describe('check internalContribution', () => {
        it('should failed as crowdsale has not been started', async () => {
            await crowdsale.updateStartDate(new BigNumber(icoTill).sub(10))
            let state = await crowdsale.getState.call()
            assert.equal(state.toString(), 2, 'state is not equal')
            crowdsale.internalContributionTest(accounts[0], precision)
                .then(utils.receiptShouldFailed).catch(utils.catchReceiptShouldFailed)
        });

        it('should failed as tokens > tokensAvailable', async () => {
            let state = await crowdsale.getState.call()
            await assert.equal(state.valueOf(), 3, 'state is not equal')
            crowdsale.internalContributionTest(accounts[0], new BigNumber('1000').mul(precision))
                .then(utils.receiptShouldFailed).catch(utils.catchReceiptShouldFailed)
        });

        it('should failed as hardcap is achieved', async () => {
            let state = await crowdsale.getState.call()
            await assert.equal(state.valueOf(), 3, 'state is not equal')
            await allocator.allocate(accounts[0], new BigNumber(350).mul(precision))
            await assert.equal(new BigNumber(await allocator.tokensAvailable.call()).valueOf(),
                new BigNumber(50).mul(precision), 'tokensAvailable is not equal')
            crowdsale.internalContributionTest(accounts[0], precision)
                .then(utils.receiptShouldFailed).catch(utils.catchReceiptShouldFailed)
        });

        it('should succeed', async () => {
            let prev = await utils.getEtherBalance(accounts[0]);
            let state = await crowdsale.getState.call();
            await assert.equal(state.valueOf(), 3, 'state is not equal');
            let availableTokens = await allocator.tokensAvailable.call();
            await assert.equal(availableTokens.valueOf(), (new BigNumber('400').mul(precision)).valueOf(), 'tokens is not equal');
            await assert.equal(await crowdsale.allocator.call(), allocator.address, 'allocator is not equal');
            await crowdsale.internalContributionTest(accounts[1], new BigNumber('10').mul(precision), {value: 1000})
                .then(utils.receiptShouldSucceed);
            await assert.equal(new BigNumber(await token.balanceOf.call(accounts[1])).valueOf(),
                new BigNumber('75.045').mul(precision).valueOf(), 'balance is not equal');
        });
    });
});