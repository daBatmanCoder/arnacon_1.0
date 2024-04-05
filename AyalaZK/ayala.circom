pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/mimcsponge.circom";

include "merkleTree.circom";

template CommitmentHasher() {
    signal input nullifier;
    signal input secret;
    signal output commitment;
    signal output nullifierHash;

    component commitmentHasher = MiMCSponge(2, 220, 1);
    component nullifierHasher = MiMCSponge(1, 220, 1);

    commitmentHasher.ins[0] <== nullifier;
    commitmentHasher.ins[1] <== secret;
    commitmentHasher.k <== 0;

    nullifierHasher.ins[0] <== nullifier;
    nullifierHasher.k <== 0;

    commitment <== commitmentHasher.outs[0];
    nullifierHash <== nullifierHasher.outs[0];
}


template Ayala(levels) {
    signal input nullifier;
    signal input secret;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal output nullifierHash;
    signal output root;

    component commitmentHasher = CommitmentHasher();
    component merkleTreeChecker = MerkleTreeChecker(levels);

    commitmentHasher.nullifier <== nullifier;
    commitmentHasher.secret <== secret;

    merkleTreeChecker.leaf <== commitmentHasher.commitment;
    for (var i = 0; i < levels; i++) {
        merkleTreeChecker.pathElements[i] <== pathElements[i];
        merkleTreeChecker.pathIndices[i] <== pathIndices[i];
    }

    nullifierHash <== commitmentHasher.nullifierHash;
    root <== merkleTreeChecker.root;
}

component main = Ayala(20);
