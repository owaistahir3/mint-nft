import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Metaplex, keypairIdentity, bundlrStorage, toMetaplexFile, toBigNumber } from "@metaplex-foundation/js";
import * as fs from 'fs';
import bs58 from 'bs58';

const QUICKNODE_RPC = 'https://ultra-dry-moon.solana-devnet.quiknode.pro/e869d666df1f3fa41871b44d3bddeda24926bcf9/';
const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC);

let secretKey = bs58.decode("5c5yrymAQ4ZM1pkENxYqyfWmRH1eH9RX2Z8A75opksDCgruJn6bRayQA4yqftydn1GAQzTb25rvh5MiwzHFXhPnw"); //Enter your wallet's Private Key here
const secret = Keypair.fromSecretKey(secretKey).secretKey
const WALLET = Keypair.fromSecretKey(new Uint8Array(secret));

const METAPLEX = Metaplex.make(SOLANA_CONNECTION)
    .use(keypairIdentity(WALLET))
    .use(bundlrStorage({
        address: 'https://devnet.bundlr.network',
        providerUrl: QUICKNODE_RPC,
        timeout: 60000,
    }));

const CONFIG = {
    uploadPath: 'uploads/',
    imgFileName: 'giphy.gif',
    imgType: 'image/gif',
    imgName: 'Cogni gif Solana NFT',
    description: 'Test for Solana gif NFTs on Cogni Wallet',
    attributes: [
        {trait_type: 'Hera', value: 'Pheri'},
        {trait_type: 'Type', value: 'Funny'},
        {trait_type: 'Background', value: 'Song'},
        {trait_type: 'Babu', value: 'Bhai'}
    ],
    sellerFeeBasisPoints: 500,//500 bp = 5%
    symbol: 'COGI',
    creators: [
        {address: WALLET.publicKey, share: 100}
    ]
};

async function uploadImage(filePath: string,fileName: string): Promise<string>  {
    console.log(`Step 1 - Uploading Image`);
    const imgBuffer = fs.readFileSync(filePath+fileName);
    const imgMetaplexFile = toMetaplexFile(imgBuffer,fileName);
    const imgUri = await METAPLEX.storage().upload(imgMetaplexFile);
    console.log(`   Image URI:`,imgUri);
    return imgUri;
}

async function uploadMetadata(imgUri: string, imgType: string, nftName: string, description: string, attributes: {trait_type: string, value: string}[]) {
    console.log(`Step 2 - Uploading Metadata`);
    const { uri } = await METAPLEX
    .nfts()
    .uploadMetadata({
        name: nftName,
        description: description,
        image: imgUri,
        attributes: attributes,
        properties: {
            files: [
                {
                    type: imgType,
                    uri: imgUri,
                },
            ]
        }
    });
    console.log('   Metadata URI:',uri);
    return uri;  
}

async function mintNft(metadataUri: string, name: string, sellerFee: number, symbol: string, creators: {address: PublicKey, share: number}[]) {
    console.log(`Step 3 - Minting NFT`);

    const { nft } = await METAPLEX
    .nfts()
    .create({
        uri: metadataUri,
        name: name,
        sellerFeeBasisPoints: sellerFee,
        symbol: symbol,
        creators: creators,
        isMutable: false,
        maxSupply: toBigNumber(1)
    }
    ,{ commitment: "finalized" }
    );
    console.log(`   Success!🎉`);
    console.log(`   Minted NFT: https://explorer.solana.com/address/${nft.address}?cluster=devnet`);

}

async function main() {
    console.log(`Minting ${CONFIG.imgName} to an NFT in Wallet ${WALLET.publicKey.toBase58()}.`);
    //Step 1 - Upload Image
    const imgUri = await uploadImage(CONFIG.uploadPath, CONFIG.imgFileName);
    //Step 2 - Upload Metadata
    const metadataUri = await uploadMetadata(imgUri, CONFIG.imgType, CONFIG.imgName, CONFIG.description, CONFIG.attributes); 
    //Step 3 - Mint NFT
    mintNft(metadataUri, CONFIG.imgName, CONFIG.sellerFeeBasisPoints, CONFIG.symbol, CONFIG.creators);
}

main();