import { Address, toNano } from '@ton/core';
import { NFTItem } from '../wrappers/NftItem';
import { NetworkProvider } from '@ton/blueprint';

const randomSeed= Math.floor(Math.random() * 10000);
export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();
    const newOwnerAddress = Address.parse('UQBjh72eaquRvZ3Xy4Bvf59a5nFCPMFjD9wEL_xcg-0hbgNh')
    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('NFT Item Address'));
    const nftItem = provider.open(NFTItem.createFromAddress(address));
    try {
        // Send transaction to transfer NFT ownership
        const tx = await nftItem.sendTransferOwnership(provider.sender(), {
            value: toNano("0.05"),
            queryId: randomSeed,
            itemIndex: 0,
            newOwnerAddress: newOwnerAddress,
            responseDestination: newOwnerAddress,
            forwardAmount: toNano("0.04"),
        });
        
    } catch (error: any) {
        // Log error details if transaction fails
        ui.write(`Transaction failed: ${error.message}`);
    }
}