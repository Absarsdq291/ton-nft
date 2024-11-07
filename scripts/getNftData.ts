import { Address } from '@ton/core';
import { NFTItem } from '../wrappers/NftItem';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();
    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('NFT Item Address'));
    const nftItem = provider.open(NFTItem.createFromAddress(address));

    try {
        const res = await nftItem.getNftData()
        console.log(res?.initialized, res?.index, res?.collectionAddress, res?.ownerAddress)
        
    } catch (error: any) {
        ui.write(`Failed: ${error.message}`);
    }
}