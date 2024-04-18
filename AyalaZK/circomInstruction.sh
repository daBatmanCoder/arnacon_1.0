# 
circom ayala.circom --r1cs --wasm --sym --c

snarkjs powersoftau new bn128 15 pot15_0000.ptau -v

snarkjs powersoftau contribute pot15_0000.ptau pot15_0001.ptau --name="First contribution" -v

snarkjs powersoftau prepare phase2 pot15_0001.ptau pot15_final.ptau -v

snarkjs groth16 setup ayala.r1cs pot15_final.ptau ayala_0000.zkey

snarkjs zkey contribute ayala_0000.zkey ayala_0001.zkey --name="1st Contributor Name" -v

snarkjs zkey export verificationkey ayala_0001.zkey verification_key.json



# Computing the witness

node ./AyalaZK/ayala_js/generate_witness.js ./AyalaZK/ayala_js/ayala.wasm ./AyalaZK/ayala_js/input.json ./AyalaZK/ayala_js/witness.wtns

# Generating the proof
snarkjs groth16 prove ./AyalaZK/ayala_0001.zkey ./AyalaZK/ayala_js/witness.wtns ./AyalaZK/proof.json ./AyalaZK/public.json

# verifying the proof
snarkjs groth16 verify verification_key.json public.json proof.json

# Smart contract
snarkjs zkey export solidityverifier ayala_0001.zkey verifier.sol


# {
#   "proof_a": ["0x2e8bc1f317a01fd520f753e0bae4f504c169509e2ea6fac67f6fdd42b530230e", "0x0447bd1ad444f48c076614451051b2861153d2e6c90ec3fcf7d372a5550fbd8b"],
#   "proof_b": [["0x14847532376d739990bc4df52933d7c1f6f7ca3f6cefae231a32a8ebf307594e", "0x26bdaec841278d126cb4d58a3a55becec41576913dc574cb18a60a353a98e283"],["0x0f4be721fd7c6be25d5c4996417e4ac640fe2f6f584676ab1e3cb5af07ffe468", "0x2262e2983f1674b847b8cb1b5310eb276fdda8197e4f784b4be6093a18afafaf"]],
#   "proof_c": ["0x0b46aa2bd772ecb4acacbccd1915df35b3c3f3d33c34e40ba1f622bffa449208", "0x1dde1b040206789c06c0642a3e07b3c655cf8ba1d857ab27ea4b9d1cf6596b21"],
#   "_nullifierHash": "0x20d571a2b2de879a2ae65ef49dd9b9781c22d0088642342268018ec9eaca3ee2",
#   "root": "0x1d1a0d6f43c00cdffc2ac268dba02ad4070c95669ad7a8b2cee50a7752b850af",
#   "signature": "0x9ed07d8fbd92ed6bd1d6467e2461b79213d031d08ecf02a6d6a3cc0149e314eb74f26594b7f74ee878b30b4ec4d5e0c825926396ce6de71c5b9c2a708ff4ab3e1c",
#   "userENS": "Hellos",
#   "serviceProviderAddress": "0xe7660e821AD8F5ddc7FBB1c702C223cF934e2d23"

# }