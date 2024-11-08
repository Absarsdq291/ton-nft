import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type NFTItemConfig = {
    index: number;
    collectionAddress: Address;
    ownerAddress: Address;
    content: Cell; // Any metadata or additional data you wish to store
};

export function nftItemConfigToCell(config: NFTItemConfig): Cell {
    return beginCell()
        .storeUint(config.index, 64) // Store the NFT index
        .storeAddress(config.collectionAddress) // Store the collection address
        .storeAddress(config.ownerAddress) // Store the owner address
        .storeRef(config.content) // Store the content or metadata
        .endCell();
}

export class NFTItem implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    // Create NFTItem contract instance from address
    static createFromAddress(address: Address) {
        return new NFTItem(address);
    }

    // Create contract with an initial configuration (code, data, and workchain)
    static createFromConfig(config: NFTItemConfig, code: Cell, workchain = 0) {
        const data = nftItemConfigToCell(config);
        const init = { code, data };
        return new NFTItem(contractAddress(workchain, init), init);
    }

    // Deploy the contract on-chain
    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(), // Empty body for deployment
        });
    }

    // Function to get NFT data (index, collectionAddress, ownerAddress, content)
    async getNftData(provider: ContractProvider) {
        const state = await provider.getState();
        if (state.state.type !== 'active') {
            return null;
        }
        const res = await provider.get('get_nft_data', []);
        return {
            initialized: res.stack.readBoolean(),
            index: res.stack.readBigNumber(),
            collectionAddress: res.stack.readAddress(),
            ownerAddress: res.stack.readAddress(),
            content: res.stack.readCell(), // The stored content (metadata)
            likesCount: res.stack.readBigNumber()
        };
    }

    async getBalance(provider: ContractProvider) {
        const { stack } = await provider.get("balance", []);
        return {
          number: stack.readNumber(),
        };
    } 

    // Send transaction to transfer NFT ownership
    async sendTransferOwnership(
        provider: ContractProvider,
        via: Sender,
        opts: {
          value: bigint;             // TONs to send with the message
          queryId: number;           // Unique query ID for the operation
          itemIndex: number;         // NFT item index
          newOwnerAddress: Address;  // Address of the new owner
          responseDestination: Address;
          forwardAmount: bigint;     // Amount of TON to forward to the new owner
        }
      ) {
        // Construct the payload
        const messageBody = beginCell()
          .storeUint(0x5fcc3d14, 32)       // `op` for transfer
          .storeUint(opts.queryId, 64)     // Unique query ID
          .storeAddress(opts.newOwnerAddress)  // New owner's address
          .storeAddress(opts.responseDestination)
          .storeUint(0, 1)
          .storeCoins(opts.forwardAmount) // TON amount to forward to the new owner
          .storeBit(0)
          .endCell();
      
        // Send the message to the contract
        const tx = await provider.internal(via, {
          value: opts.value,               // Specify the value to send with the message
          sendMode: SendMode.PAY_GAS_SEPARATELY,                 // Send mode (pay gas separately, revert on errors)
          body: messageBody                // Body with operation details and payload
        });
      }

    //Send Transaction to add like
    async sendLike(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint,
            queryId: number
        }
    ) {
        const messageBody = beginCell()
            .storeUint(1, 32)
            .storeUint(opts.queryId, 64)
            .endCell()

         // Send the message to the contract
        const tx = await provider.internal(via, {
            value: opts.value,               // Specify the value to send with the message
            sendMode: SendMode.PAY_GAS_SEPARATELY,                 // Send mode (pay gas separately, revert on errors)
            body: messageBody                // Body with operation details and payload
          });
        
    }

    async sendDeposit(
        provider: ContractProvider, 
        via: Sender, 
        opts: {
            value: bigint,
            queryId: number
        }
    ) {
        const messageBody = beginCell()
          .storeUint(2, 32) // OP code
          .storeUint(opts.queryId, 64)
          .endCell();
    
        await provider.internal(via, {
          value: opts.value,
          sendMode: SendMode.PAY_GAS_SEPARATELY,
          body: messageBody,
        });
      }
    
    async sendWithdraw(
        provider: ContractProvider, 
        via: Sender, 
        opts: {
            value: bigint,
            queryId: number,
            amount: bigint
        }
    ) {
        const messageBody = beginCell()
          .storeUint(3, 32) // OP code
          .storeUint(opts.queryId, 64)
          .storeCoins(opts.amount)
          .endCell();
    
        await provider.internal(via, {
          value: opts.value,
          sendMode: SendMode.PAY_GAS_SEPARATELY,
          body: messageBody,
        });
    }

    
}
