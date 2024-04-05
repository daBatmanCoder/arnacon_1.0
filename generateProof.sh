# Ensure the input.json file exists before proceeding
if [ ! -f ./AyalaZK/ayala_js/input.json ]; then
    echo "input.json not found, exiting..."
    exit 1
fi

# Navigate to the verifier_js folder
cd ./AyalaZK/ayala_js

# Generate the witness using the input.json file
echo "Generating the witness, snarkjs and call..."
node generate_witness.js ayala.wasm input.json witness.wtns

# Navigate back to the circuits folder
cd ..

# Generate the proof using the witness file
snarkjs groth16 prove ayala_0001.zkey ayala_js/witness.wtns proof.json public.json

# Generate the call data for the smart contract using the simplified command
callData=$(snarkjs generatecall)

snarkjs generatecall