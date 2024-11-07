import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, beginCell, Cell, TupleItemInt } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import { NFTItem } from '../wrappers/NftItem';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('NFTCollection', () => {
    let collectionCode: Cell;
    let nftItemCode: Cell;
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let newOwner: SandboxContract<TreasuryContract>;
    let nftCollection: SandboxContract<NftCollection>;
    let defaultContent: Cell;
    let nftItem: SandboxContract<NFTItem>;

    beforeAll(async () => {
        collectionCode = await compile('NFTCollection');
        nftItemCode = await compile('NFTItem');
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        newOwner = await blockchain.treasury('newOwner');
        defaultContent = beginCell().storeStringTail('https://example.com/nft-metadata.json').endCell();

        nftCollection = blockchain.openContract(
            NftCollection.createFromConfig(
                {
                    ownerAddress: deployer.address,
                    nextItemIndex: 0,
                    collectionContent: defaultContent,
                    nftItemCode: nftItemCode,
                    royaltyParams: {
                        royaltyFactor: Math.floor(Math.random() * 500), 
                        royaltyBase: 1000,
                        royaltyAddress: deployer.address
                    }
                },
                collectionCode
            )
        );

    });

    // Test deployment of NFTCollection
    it('should deploy the NFT collection', async () => {
        const deployResult = await nftCollection.sendDeploy(deployer.getSender(), toNano('1'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftCollection.address,
            deploy: true,
        });
    });

    // Test deploying a single NFT
    it('should deploy NFT item', async () => {
        const nftContent = beginCell().storeStringTail('https://example.com/nft1-metadata.json').endCell();

        nftItem = blockchain.openContract(
            NFTItem.createFromConfig(
                {
                    index: 0,
                    collectionAddress: nftCollection.address,
                    ownerAddress: deployer.address,
                    content: nftContent
                },
                nftItemCode
            )
        )

        const deployNFTResult = await nftItem.sendDeploy(
            deployer.getSender(), toNano('0.05')
        );

        expect(deployNFTResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftItem.address,
            success: true,
        });

        const index: TupleItemInt = { type: "int", value: BigInt(0)};
        // Check the deployed NFT address
        const nftAddress = await nftCollection.getItemAddressByIndex(index);
        expect(nftAddress).not.toBeNull();
    });

    // Test changing owner of the collection with unauthorized user
    it("should not change the item owner when tried by someone other than the original owner", async () => {
        const randomSeed = Math.floor(Math.random() * 10000);

        const changeOwnerResult = await nftItem.sendTransferOwnership(newOwner.getSender(),
        {
            value: toNano("0.05"),
            queryId: randomSeed,
            itemIndex: 0,
            newOwnerAddress: newOwner.address,
            responseDestination: newOwner.address,
            forwardAmount: toNano("0.04")
        });
        expect(changeOwnerResult.transactions).toHaveTransaction({
            from: newOwner.address,
            to: nftItem.address,
            success: false
        })
    })

    // Test changing the owner of the collection
    it('should change the item owner', async () => {
        const randomSeed= Math.floor(Math.random() * 10000);

        const changeOwnerResult = await nftItem.sendTransferOwnership(deployer.getSender(), 
        {
            value: toNano("0.05"),
            queryId: randomSeed,
            itemIndex: 0,
            newOwnerAddress: newOwner.address,
            responseDestination: newOwner.address,
            forwardAmount: toNano('0.04')
        });
        expect(changeOwnerResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftItem.address,
            success: true,
        });

        // Verify that the owner was changed
        const itemData = await nftItem.getNftData();
        expect(itemData?.ownerAddress).toEqualAddress(newOwner.address);
    });
});
