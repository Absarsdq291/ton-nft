import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    targets: ['stdlib.fc', 'contracts/params.fc', 'contracts/op-codes.fc', 'contracts/nft-collection.fc'],
};
