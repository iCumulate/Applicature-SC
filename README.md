# iCumulate Smart Contracts

## Built With

* [truffle](https://truffleframework.com/) - A world class development environment, testing framework and asset pipeline for blockchains using the Ethereum Virtual Machine (EVM)

### Directory layout
    .
    ├── contracts                           # Source files
    │   ├── agent                           # Agents related smart contracts
    │   ├── allocator                       # Allocator related smart contracts
    │   ├── contribution                    # Contribution related smart contracts
    │   ├── crowdsale                       # Crowdsale related smart contracts
    │   ├── pricing                         # Pricing related smart contracts
    │   ├── test                            # Helpers for the automated tests smart contracts
    │   ├── token                           # Token related smart contracts
    │   └── ICUAgent.sol                    # 
    │   └── ICUAllocation.sol               # 
    │   └── ICUCrowdsale.sol                # 
    │   └── ICUReferral.sol                 # 
    │   └── ICUStrategy.sol                 # 
    │   └── ICUToken.sol                    # 
    │   └── LockupContract.sol              # 
    │   └── PeriodicTokenVesting.sol        # 
    │   └── Referral.sol                    # 
    │   └── Stats.sol                       # 
    ├── migrations                          # Migration files (alternatively `doc`)
    ├── test                                # Automated tests
    └── README.md
* [Agent](#agent) folder
* [Allocator](#allocator) folder
* [Contribution](#contribution) folder
* [Crowdsale](#crowdsale) folder
* [Pricing](#pricing) folder
* [Token](#token) folder
* [Referral](#Referral) contract
* [Stats](#stats) contract

## Agent Folder
This folder contains contracts which are base contracts for the ICUAgent.sol.
There are a few main methods that are called when a Crowdsale contract performs some actions:

1. onContribution method is triggering while contributor is making the contribution. In our case it is updating tier state in the ICUStrategy.sol contract:
    * increasing amount of sold tokens and bonus tokens in a current crowdsale round(tier)
    * when the first tier ends, all unsold tokens are going to the second tier's bonus amount
  
2. onStateChange method is triggering while Crowdsale contract's state was changed(ex. from 'Initializing' to 'BeforeCrowdsale'). In our case it performs 2 actions:
    * update 'isSoftCapAchieved' variable in the tokens contract if Crowdsale is finished and the soft cap is reached; It was made to avoid calls from token contract to the crowdsale contract for the checking whether soft cap was met or not while transfer tokens.  
    * burn unsold tokens if crowdsale has been finished
3. onRefund method is triggering while contributor want's to refund his contributions. In our case, it performs burning contributor's tokens.

## Allocator Folder
This folder contains contracts which are making tokens allocations. Only Allocator contract is allowed to call 'mint' function in the token contract to mint new tokens and only allowed contracts (Crowdsale, Referral, Allocation) can use 'allocate' method.

## Contribution Folder
This folder contains contracts which are making Weis transfers to the ether holders and keep statistic information about collected/forwarded ether.

## Crowdsale Folder
This folder contains contracts which are base contracts for the ICUCrowdsale.sol.
Crowdsale contracts implement such main features as:

1. Crowdsale management: state updating and permissions, a state can be: Unknown, Initializing, BeforeCrowdsale, InCrowdsale, Success, Finalized or Refunding.
2. Contributions and bonuses. It can be done through several ways: whitelist, signed transaction by allowed address and external contribution.
3. Refund functionality. It can be done by contributor or delegated address only if a crowdsale state is 'Refunding'.

### Contribution
After Crowdsale contract deployment, it has 'Initializing' state, the default state is 'Unknown'. It will be 'Initializing' until we initialize Allocator, Contribution and Pricing Strategy contracts, after that Crowdsale state can be 'BeforeCrowdsale' or 'InCrowdsale' depends on 'startDate' and 'endDate' variables.
Date variables are updating while 'updateState' function is called and their values are getting from the appropriate tier from the Pricing strategy contract.
When someone makes a contribution:

1. 'updateState' function is called; if the state is not 'InCrowdsale' transaction will be revered.
2. Calculations are making in USD and from Pricing Strategy we get USD amount by contributed Weis, if with this contribution we will exceed hard cap transaction will be reverted.
3. From the Pricing strategy we get tokens and bonuses amount by contributed Weis. If tokens amount 0 - the transaction will be reverted.
4. Tokens are allocating to the contributor, tokensSold and usdCollected vars increasing, in case if a soft cap is met all Weis are distributed between ether holders, if not - contributorsWei mapping is increasing.
5. 'onContribution' function is calling and emitting 'Contribution' event.
    
## Pricing Folder
This folder contains contracts which are base contracts for the ICUStrategy.sol.
Pricing Strategy contracts implement such main features as:

1. Holds info about tiers (crowdsale rounds).
2. Performs ETH to USD exchange rate update.
3. Calculations for tokens, bonuses, Weis.
4. Provides statistic for sold tokens, bonuses.
5. Ability to update tier data (dates, prices...).

## Token Folder
This folder contains contracts which are base contracts for the ICUToken.sol.
ICUToken contracts implement the ERC20 token standard and based on OpenZeppelin implementation.
Also, it has transfers lockup and burning functionalities.

## Referral Contract
Referral contracts give an ability to the contributor to claim his referral tokens. All calculation is made on the backed side, Referral contract just ensures that transaction was signed with an allowed address and allocates referral tokens.

## Stats Contract
Stats contract was designed to give needed statistics information to the backend