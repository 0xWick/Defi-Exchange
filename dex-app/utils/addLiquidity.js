import { Contract, utils } from "ethers";
import {
    EXCHANGE_CONTRACT_ABI,
    EXCHANGE_CONTRACT_ADDRESS,
    TOKEN_CONTRACT_ABI,
    TOKEN_CONTRACT_ADDRESS,
} from "../constants";

/**
 * addLiquidity helps add liquidity to the exchange,
 * If the user is adding initial liquidity, user decides the ether and CD tokens he wants to add
 * to the exchange. If we he adding the liquidity after the initial liquidity has already been added
 * then we calculate the crypto dev tokens he can add, given the eth he wants to add by keeping the ratios
 * constant
 */

export const addLiquidity = async (
    signer,
    addCDAmountWei,
    addEtherAmountWei
) => {
    try {
        // create a new instance of the token contract
        const tokenContract = new Contract(
            TOKEN_CONTRACT_ADDRESS,
            TOKEN_CONTRACT_ABI,
            signer
        );
        // create a new instance of the exchange contract
        const exchangeContract = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            signer
        );
        // Because CD tokens are an ERC20, user would need to give the contract allowance
        // to take the required number of CD tokens out of his contract
        let tx = await tokenContract.approve(
            EXCHANGE_CONTRACT_ADDRESS,
            addCDAmountWei.toString()
        );
        await tx.wait();
        // After the contract has the approval, add the ether and cd tokens in the liquidity
        tx = await exchangeContract.addLiquidity(addCDAmountWei, {
            value: addEtherAmountWei,
        });
        await tx.wait();

    } catch (error) {
        console.error(error);
    }
};

/**
 * calculateCD calculates the CD tokens that need to be added to the liquidity
 * given `_addEtherAmountWei` amount of ether
 */
export const calculateCD = async (
    _addEther = "0",
    etherBalanceContract,
    cdTokenReserve
) => {
    // `_addEther` is a string, we need to convert it to a BigNumber before we can do our calculations
    // We do that using the `parseEther` function from `ethers.js`
    const _addEtherAmountWei = utils.parseEther(_addEther);
    // Ration need to be maintained when we add liquidity.
    // We need to let the user know who a specific amount of how many `CD` tokens
    // he can add so that the price impace is not large
    // The ratio we follow is (Amount of Crypto Dev tokens to be added)/(Crypto Dev tokens balance) = (Ether that would be added)/ (Eth reseve in the contract)
    // So by maths we get (Amount of Crypto Dev tokens to be added) = (Ether that would be added*rypto Dev tokens balance)/ (Eth reseve in the contract)
    const cryptoDevTokenAMount = _addEtherAmountWei
        .mul(cdTokenReserve)
        .div(etherBalanceContract);
    return cryptoDevTokenAMount;
};