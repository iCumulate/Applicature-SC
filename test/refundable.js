var
    Token = artifacts.require('./token/erc20/MintableToken'),
    TokenAllocator = artifacts.require('./allocator/MintableTokenAllocator'),
    PricingStrategy =  artifacts.require('./pricing/USDDateTiersPricingStrategy.sol'),
    ContributionForwarder = artifacts.require("./contribution/DistributedDirectContributionForwarder.sol"),
    HardCappedCrowdsale = artifacts.require("./test/RefundableCrowdsaleTest.sol"),
    Agent = artifacts.require("./test/MintableCrowdsaleOnSuccessAgentTest.sol"),
    utils = require("./utils"),
    BigNumber = require('bignumber.js'),
    precision = new BigNumber("1000000000000000000"),
    usdPrecision = new BigNumber("100000"),
    icoSince = parseInt(new Date().getTime() / 1000 - 3600),
    icoTill = parseInt(new Date().getTime() / 1000) + 3600;

contract('RefundableCrowdsale', accounts => {

    let token,
        allocator,
        contributionForwarder,
        strategy,
        crowdsale;

    beforeEach(async function () {
        token = await Token.new(300*precision, 0, true)
        allocator = await TokenAllocator.new(token.address);
        contributionForwarder = await ContributionForwarder.new(100, [accounts[3]], [100]);
        strategy = await PricingStrategy.new([///privateSale
            new BigNumber('1').mul(usdPrecision).valueOf(), //     uint256 tokenInUSD;
            0,// uint256 maxTokensCollected;
            0,// uint256 discountPercents;
            0,// uint256 bonusPercents;
            50000,// uint256 minInvestInUSD;
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
        ], 18, 7504500);
        crowdsale = await HardCappedCrowdsale.new(
            allocator.address, 
            contributionForwarder.address, 
            strategy.address, 
            icoSince, 
            icoTill, 
            true, 
            true, 
            false,
            200*precision,
            500*precision
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
        it('should return InCrowdsale as crowdsale continues', async () => {
            let state = await crowdsale.getState.call()
            assert.equal(state.valueOf(), 3, 'state is not equal')
        });
        
        it('should return Success as crowdsale finished and softcap is achieved', async () => {
            await crowdsale.updateSoldTokens(210e18)
            await crowdsale.updateEndDate(new BigNumber(icoSince).add(10))
            let state = await crowdsale.getState.call()
            assert.equal(state.toString(), 4, 'state is not equal')
        });

        it('should return Rufundable as crowdsale finished and softcap is not achieved', async () => {
            await crowdsale.updateEndDate(new BigNumber(icoSince).add(10))
            let state = await crowdsale.getState.call()
            assert.equal(state.toString(), 6, 'state is not equal')
        });
    });
    
    describe('check internalContribution', () => {
        it('should failed as crowdsale has not been started', async () => {
            await crowdsale.updateEndDate(new BigNumber(icoSince).add(10))
            let state = await crowdsale.getState.call()
            assert.equal(state.toString(), 6, 'state is not equal')
            crowdsale.internalContributionTest(accounts[1], precision)
            .then(utils.receiptShouldFailed).catch(utils.catchReceiptShouldFailed)
        });

        // it('should failed as tokens > tokensAvailable', async () => {
        //     let state = await crowdsale.getState.call()
        //     await assert.equal(state.valueOf(), 3, 'state is not equal')

        //     await allocator.allocate(accounts[1], 299*precision)
        //     await assert.equal(new BigNumber(await allocator.tokensAvailable.call()).valueOf(), precision.valueOf(), 'tokensAvailable is not equal')
        //     let tokens = await strategy.getTokens.call(accounts[0], precision, 0, precision, 0)
        //     await assert.equal(new BigNumber(tokens[0]).valueOf(), 0, "tokens is not equal")
        //     await assert.equal(new BigNumber(tokens[1]).valueOf(), 0, "tokensExcludingBonus is not equal")
        //     await assert.equal(new BigNumber(tokens[2]).valueOf(), 0, "bonus is not equal")

        //     crowdsale.internalContributionTest(accounts[1], precision, {value: 1000})
        //     .then(utils.receiptShouldSucceed)
        //     // .then(utils.receiptShouldFailed).catch(utils.catchReceiptShouldFailed)
        // });

        it('should failed as tokens = 0', async () => {
            let state = await crowdsale.getState.call()
            await assert.equal(state.valueOf(), 3, 'state is not equal')
            await allocator.allocate(accounts[1], 299*precision)
            await assert.equal(new BigNumber(await allocator.tokensAvailable.call()).valueOf(), precision.valueOf(), 'tokensAvailable is not equal')
            crowdsale.internalContributionTest(accounts[1], precision)
            .then(utils.receiptShouldFailed).catch(utils.catchReceiptShouldFailed)
        });

        it('should failed as hardcap is achieved', async () => {
            let state = await crowdsale.getState.call()
            await assert.equal(state.valueOf(), 3, 'state is not equal')
            await crowdsale.updateSoldTokens(499*precision)
            await assert.equal(new BigNumber(await crowdsale.hardCap.call()).sub(499*precision), precision.valueOf(), 'hardcap - soldTokens is not equal')
            crowdsale.internalContributionTest(accounts[1], precision)
            .then(utils.receiptShouldFailed).catch(utils.catchReceiptShouldFailed)
        });

        it('should succeed and forward ethers', async () => {
            let prev = await utils.getEtherBalance(accounts[3])
            let state = await crowdsale.getState.call()
            await assert.equal(state.valueOf(), 3, 'state is not equal')
            await crowdsale.updateSoldTokens(200e18)

            let tokens = await strategy.getTokens.call(accounts[0], 300*precision, 0, precision, 0)
            await assert.equal(new BigNumber(tokens[0]).valueOf(), new BigNumber('75.045').mul(precision).valueOf(), "tokens is not equal")
            await assert.equal(new BigNumber(tokens[1]).valueOf(), new BigNumber('75.045').mul(precision).valueOf(), "tokensExcludingBonus is not equal")
            await assert.equal(new BigNumber(tokens[2]).valueOf(), 0, "bonus is not equal")
            
            await crowdsale.internalContributionTest(accounts[1], precision, {value: 1000}).then(utils.receiptShouldSucceed)
            await assert.equal(new BigNumber(await token.balanceOf.call(accounts[1])).valueOf(), 
            new BigNumber('75.045').mul(precision).valueOf(), 'tokenBalance is not equal')
            await utils.checkEtherBalance(accounts[3], prev.add(1000))
        });

        it('should succeed and store contributor to array', async () => {
            let state = await crowdsale.getState.call()
            await assert.equal(state.valueOf(), 3, 'state is not equal')
            await assert.equal(new BigNumber(await crowdsale.contributorsWei.call(accounts[1])).valueOf(), 0, "contributors weis is not equal")
            await crowdsale.internalContributionTest(accounts[1], precision, {value: 1000}).then(utils.receiptShouldSucceed)
            await assert.equal(new BigNumber(await token.balanceOf.call(accounts[1])).valueOf(), 
            new BigNumber('75.045').mul(precision).valueOf(), 'tokenBalance is not equal')
            let contributor = await crowdsale.contributors.call(0)
            await assert.equal(contributor.valueOf(), accounts[1], "contributor is not equal")
            await assert.equal(new BigNumber(await crowdsale.contributorsWei.call(accounts[1])).valueOf(), 1000, "contributors weis is not equal")
        });
    });

    // describe('check internalRefund', () => {
    //     it('should succeed', async () => {
    //         let state = await crowdsale.getState.call()
    //         await assert.equal(state.valueOf(), 3, 'state is not equal')
    //         await assert.equal(new BigNumber(await crowdsale.contributorsWei.call(accounts[1])).valueOf(), 0, "contributors weis is not equal")
    //         await crowdsale.internalContributionTest(accounts[1], precision, {value: 1000}).then(utils.receiptShouldSucceed)
    //         // await assert.equal(new BigNumber(await token.balanceOf.call(accounts[1])).valueOf(),
    //         // new BigNumber('75.045').mul(precision).valueOf(), 'tokenBalance is not equal')
    //         // await crowdsale.updateEndDate(new BigNumber(icoSince).add(10))
    //         // state = await crowdsale.getState.call()
    //         // assert.equal(state.valueOf(), 6, 'state is not equal')
    //         // await crowdsale.internalRefundTest(accounts[1]).then(utils.receiptShouldSucceed)
    //         // await utils.checkEtherBalance(accounts[1], prev)
    //     });
    // });
});