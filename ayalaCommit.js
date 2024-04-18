const { ethers } = require('ethers');
const crypto = require("crypto");
const fs = require("fs");
const path = require('path');
const { buildMimcSponge } = require("circomlibjs");
const {Web3} = require('web3');

let web3 = new Web3(new Web3.providers.HttpProvider('https://polygon-amoy-bor-rpc.publicnode.com'));
const PRIVATE_KEY = "0x1cf3bacf75f3c8580aabf395ddb3eb5bf2943ce44cc9907a60802a305c3f4e09"

async function generateNull_N_Secret_To_File() {
    const mimc = await buildMimcSponge();
    // const null_n_secret = fs.readFileSync("./null_n_secret.json", "utf-8");
	// const { nullifier } = JSON.parse(null_n_secret);
	// const commitment = await generateCommitmentFromNullifier(nullifier);

	const commitment = await generateCommitment();
    const nullifierHash = mimc.F.toString(mimc.multiHash([commitment.nullifier]));
    console.log(nullifierHash);
    const signature = await getSignature(nullifierHash);
    console.log(signature.signature);
	console.log(commitment);

	const result = {
		nullifier: commitment.nullifier,
		secret: commitment.secret
	};

	// await callCommitDeposit(commitment.commitment); 

	fs.writeFileSync("./null_n_secret.json", JSON.stringify(result, null, 2));
}

async function getSignature(nullifierHash ) {
    try {
        const signatureObject = await web3.eth.accounts.sign(nullifierHash, PRIVATE_KEY);
        return signatureObject;
    } catch (error) {
        console.error("Error signing message:", error);
        return null;
    }
}

async function generateCommitment() {
    const mimc = await buildMimcSponge();
    let nullifier = ethers.BigNumber.from(crypto.randomBytes(31)).toString();
    let secret = ethers.BigNumber.from(crypto.randomBytes(31)).toString();
    const commitment = mimc.F.toString(mimc.multiHash([nullifier, secret]));
    const response =  {
        nullifier: nullifier,
        secret: secret,
        commitment: commitment
    };
	return response;
}
// window.generateCommitment = generateCommitment;

async function generateCommitmentFromNullifier( nullifier) {
    const mimc = await buildMimcSponge();
    let secret = ethers.BigNumber.from(crypto.randomBytes(31)).toString();
    const commitment = mimc.F.toString(mimc.multiHash([nullifier, secret]));
    const response =  {
        nullifier: nullifier,
        secret: secret,
        commitment: commitment
    };
	return response;
}

async function callCommitDeposit(commitment) {

    try {
        const tx = await merkleTreeContract.commitDeposit(commitment);

        // Wait for the transaction to be mined
        await tx.wait();

        console.log('Transaction successful:', tx);
		return true;
    } catch (error) {
        console.error('Transaction failed:', error);
		return false;
    }
}
// window.callCommitDeposit = callCommitDeposit;


// const contractABI = require('./contracts/ayalaABI.json');
// const contractAddressPath = path.join(__dirname, './contracts/ayalaAddress.txt');
// const contractAddress = fs.readFileSync(contractAddressPath, 'utf8').trim();

// const PRIVATE_KEY = "1cf3bacf75f3c8580aabf395ddb3eb5bf2943ce44cc9907a60802a305c3f4e09"
// const provider = new ethers.providers.JsonRpcProvider("https://polygon-mumbai.infura.io/v3/97d9c59729a745b790c2b1118ba098ef");
// const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
// const merkleTreeContract = new ethers.Contract(contractAddress, contractABI, wallet);

(async () => {  await generateNull_N_Secret_To_File(); })();
