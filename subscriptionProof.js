const crypto = require("crypto");
const { buildMimcSponge } = require("circomlibjs");
const ethers = require("ethers");
const fs = require("fs");
const {Web3} = require('web3');
const path = require("path");

const ZERO_VALUE = ethers.BigNumber.from('21663839004416932945382355908790599225266501822907911457504978515578255421292') // = keccak256("tornado") % FIELD_SIZE

// Assuming you have the contract ABI and address
const contractABI = require('./contracts/subscriptionABI.json');
const contractAddressPath = path.join(__dirname, './contracts/subscriptionAddress.txt');
const contractAddress = fs.readFileSync(contractAddressPath, 'utf8').trim();
const provider = new ethers.providers.JsonRpcProvider("https://polygon-mumbai.infura.io/v3/97d9c59729a745b790c2b1118ba098ef");
const PRIVATE_KEY = "1cf3bacf75f3c8580aabf395ddb3eb5bf2943ce44cc9907a60802a305c3f4e09"
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const merkleTreeContract = new ethers.Contract(contractAddress, contractABI, wallet);


let web3 = new Web3(new Web3.providers.HttpProvider('https://polygon-mumbai.infura.io/v3/97d9c59729a745b790c2b1118ba098ef'));
let web3Contract = new web3.eth.Contract(contractABI, contractAddress);

async function generateCommitment() {
    const mimc = await buildMimcSponge();
    const nullifier = ethers.BigNumber.from(crypto.randomBytes(31)).toString();
    const secret = ethers.BigNumber.from(crypto.randomBytes(31)).toString();
    const commitment = mimc.F.toString(mimc.multiHash([nullifier, secret]));
    const nullifierHash = mimc.F.toString(mimc.multiHash([nullifier]));
    return {
        nullifier: nullifier,
        secret: secret,
        commitment: commitment,
        nullifierHash: nullifierHash
    };
}

async function prepareProofFile() {

	const commitments = await getPastEvents();
    const mimc = await buildMimcSponge();
    const levels = await merkleTreeContract.levels(); 
	const null_n_secret = fs.readFileSync("./null_n_secret_subscription.json", "utf-8");
	const { nullifier, secret } = JSON.parse(null_n_secret);

	const inputJson = await calculateInputToProof(mimc, levels, commitments, nullifier, secret);
    fs.writeFileSync("./SubscriptionZK/subscription_js/input.json", JSON.stringify(inputJson, null, 2));
}
// window.prepareProofFile = prepareProofFile;

async function generateNull_N_Secret() {
	const commitment = await generateCommitment();
	const result = {
		nullifier: commitment.nullifier,
		secret: commitment.secret
	};
	console.log(result);

	await callCommitDeposit(commitment.commitment); 

	fs.writeFileSync("./null_n_secret_subscription.json", JSON.stringify(result, null, 2));
}


async function calculateInputToProof(mimc, levels, elements, nullifier, secret) {

	const commitment = mimc.F.toString(mimc.multiHash([nullifier, secret]));

	const { root, pathElements, pathIndices } = calculateMerkleRootAndPath(mimc, levels, elements, commitment);
	// Convert commitments to hex strings with '0x' prefix
	const pathElementss = pathElements.map(commitment => {
		// Check if the commitment already starts with '0x', if not, convert it to hex string
		return commitment.startsWith('0x') ? commitment : '0x' + BigInt(commitment).toString(16);
	});

	// Convert path indices to numbers
	const pathIndicess = pathIndices.map(index => parseInt(index, 10));

	const inputJson = {
		"nullifier": nullifier,
		"secret": secret,
		"pathElements": pathElementss,
		"pathIndices": pathIndicess
	};
	
	return inputJson;
}

function calculateMerkleRootAndPath(mimc, levels, elements, element) {

	const capacity = 2 ** levels;
    if (elements.length > capacity)
        throw new Error('Tree is full');
    const zeros = generateZeros(mimc, levels);
    let layers = [];
    layers[0] = elements.slice();
    for (let level = 1; level <= levels; level++) {
        layers[level] = [];
        for (let i = 0; i < Math.ceil(layers[level - 1].length / 2); i++) {
            layers[level][i] = calculateHash(mimc, layers[level - 1][i * 2], i * 2 + 1 < layers[level - 1].length ? layers[level - 1][i * 2 + 1] : zeros[level - 1]);
        }
    }
    const root = layers[levels].length > 0 ? layers[levels][0] : zeros[levels - 1];
    let pathElements = [];
    let pathIndices = [];
    if (element) {

        const bne = ethers.BigNumber.from(element);
        let index = layers[0].findIndex(e => ethers.BigNumber.from(e).eq(bne));
        
        for (let i = 0; i < levels; i++) {
            pathIndices[i] = index % 2;
            pathElements[i] = (index ^ 1) < layers[i].length ? layers[i][index ^ 1] : zeros[i];
            index >>= 1;
        }
    }


	console.log(root.toString());	
    return {
        root: root.toString(),
        pathElements: pathElements.map(e => e.toString()),
        pathIndices: pathIndices.map(e => e.toString())
    };
}

function generateZeros(mimc, levels) {
	let zeros = [];
    zeros[0] = ZERO_VALUE;
    for (let i = 1; i <= levels; i++){
		// zeros[i] = await merkleTreeContract.zeros(i);
        zeros[i] = calculateHash(mimc, zeros[i - 1], zeros[i - 1]);
	}
    return zeros;
}

function calculateHash(mimc, left, right) {
    return ethers.BigNumber.from(mimc.F.toString(mimc.multiHash([left, right])));
}



async function callCommitDeposit(commitment) {

    try {
        const tx = await merkleTreeContract.commitDeposit(commitment);

        // Wait for the transaction to be mined
        await tx.wait();

        console.log('Transaction successful:', tx);
    } catch (error) {
        console.error('Transaction failed:', error);
    }
}

async function getPastEvents() {
    try{
        const events = await web3Contract.getPastEvents('Commit', {
            fromBlock: 0, // Use appropriate block number to limit search range
            toBlock: 'latest'
        });
        const commitments = events.map(events => events.returnValues.commitment);
    
        return commitments;
    } catch(error){
        console.error("Error fetching events:", error);
        throw error;
    }
    
}


(async () => {  await prepareProofFile(); })();