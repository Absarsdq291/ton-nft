import { Address, toNano } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import { NetworkProvider } from '@ton/blueprint';

const randomSeed= Math.floor(Math.random() * 10000);
export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();
    const newOwnerAddress = Address.parse('0QC9dDz_nvDlSI1FWTuEvk_-LqljDjtIUG4mVMUaRwO6-uMD')
    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Collection Address'));
    const nftCollection = provider.open(NftCollection.createFromAddress(address));
    try {
        // Send transaction to transfer NFT ownership
        const tx = await nftCollection.sendChangeOwner(provider.sender(), {
            value: toNano("0.05"),
            queryId: randomSeed,
            newOwnerAddress: newOwnerAddress,
        });
        
    } catch (error: any) {
        // Log error details if transaction fails
        ui.write(`Transaction failed: ${error.message}`);
    }
}