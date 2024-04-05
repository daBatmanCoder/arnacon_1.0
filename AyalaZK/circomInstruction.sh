# 
circom ayala.circom --r1cs --wasm --sym --c

snarkjs powersoftau new bn128 15 pot15_0000.ptau -v

snarkjs powersoftau contribute pot15_0000.ptau pot15_0001.ptau --name="First contribution" -v

snarkjs powersoftau prepare phase2 pot15_0001.ptau pot15_final.ptau -v

snarkjs groth16 setup ayala.r1cs pot15_final.ptau ayala_0000.zkey

snarkjs zkey contribute ayala_0000.zkey ayala_0001.zkey --name="1st Contributor Name" -v

snarkjs zkey export verificationkey ayala_0001.zkey verification_key.json



# Computing the witness

node generate_witness.js ayala.wasm input.json witness.wtns

# Generating the proof
snarkjs groth16 prove ayala_0001.zkey ./ayala_js/witness.wtns proof.json public.json

# verifying the proof
snarkjs groth16 verify verification_key.json public.json proof.json

# Smart contract
snarkjs zkey export solidityverifier ayala_0001.zkey verifier.sol

