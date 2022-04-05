import { Contract } from "ethers";
import {
    EXCHANGE_CONTRACT_ABI,
    EXCHANGE_CONTRACT_ADDRESS,
    TOKEN_CONTRACT_ABI,
    TOKEN_CONTRACT_ADDRESS,
} from "../constants";

/*
 getAmountOfTokensRecievedFromSwap: Returns the number of Eth/Crypto Dev tokens that can be Recieved
 when the user swapa `_swapAmountWEI` amoung of Eth/Crypto Dev tokens.
*/
export const getAmountOfTokensRecievedFromSwap = async (
    _swapAmountWei,
    provider,
    ethSelected,
    ethBalance,
    reservedCD
) => {
    // create a new instance of the exchange contract
    const exchangeContract = new Contract(
        EXCHANGE_CONTRACT_ADDRESS,
        EXCHANGE_CONTRACT_ABI,
        provider
    );
    let amountOfTokens;
    // If ETH is selected this means our input value is `Eth` which means our input amount would be
    // `_swapAmountWei`, the input reserve would be the `ethBalance` of the contract and output reserve
    // would be the  `Crypto Dev token` reserve}
    if (ethSelected) {
        amountOfTokens = await exchangeContract.getAmoungOfTokens(
            _swapAmountWei,
            ethBalance,
            reservedCD
        );
    } else {
        // If ETH is not selected this means our input value is `Crypto Dev` tokens which means our input amount would be
        // `_swapAmountWei`, the input reserve would be the `Crypto Dev token` reserve of the contract and output reserve
        // would be the `ethBalance`
        amountOfTokens = await exchangeContract.getAmoungOfTokens(
            _swapAmountWei,
            reservedCD,
            ethBalance
        );
    }

    return amountOfTokens;
};

/*
    swapTokens; Swaps `swapAmountWei` of Eth/Crypto Dev tokens with `tokenToBeRecievedAfterSwap` amount of Eth/Crypto Dev tokens
*/
export const swapTokens = async (
    signer,
    swapAmountWei,
    tokenToBeRecievedAfterSwap,
    ethSelected
) => {
    // Create a new instancce of the exchange contract
    const exchangeContract = new Contract(
        EXCHANGE_CONTRACT_ADDRESS,
        EXCHANGE_CONTRACT_ABI,
        signer
    );
    const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
    );
    let tx;
    // If Eth is selected call the `ethToCryptoDevToken` function else
    // call the `cryptoDevTokenToEth` function from the contract
    // As you can see you need to pass the `swapAmoung` as a value to the function because
    // It is the ether we are paying to the contract, instead of a value we are passingto the function
    if (ethSelected) {
        tx = await exchangeContract.ethToCryptoDevToken(
            tokenToBeRecievedAfterSwap,
            {
                value: swapAmountWei,
            }
        );
    } else {
        // User has to approvde `swapAmountWei` for the contract because `Crypto Dev Token` 
        // is an ERC20
        tx = await tokenContract.approve(
            EXCHANGE_CONTRACT_ADDRESS,
            swapAmountWei.toString()
        );
        await tx.wait();
        // call cryptoDevTokenToEth function which would take in `swapAmountWei` of crypto dev tokens
        // and would send back `tokenToBeRecievedAfterSwap` amount of ether to the user
        tx = await exchangeContract.cryptoDevTokenToEth(
            swapAmountWei,
            tokenToBeRecievedAfterSwap
        );
    }
    await tx.wait();
}