#!/bin/bash
# ZK Trusted Setup Script
# Prerequisites: circom compiler installed (npm install -g circom or cargo install circom)
# This script compiles the circuit and generates proving/verification keys

set -e

CIRCUIT_DIR="$(dirname "$0")/../circuits"
BUILD_DIR="$(dirname "$0")/../build"
PTAU_FILE="$BUILD_DIR/pot12_final.ptau"

mkdir -p "$BUILD_DIR"

echo "=== Step 1: Download Powers of Tau ==="
if [ ! -f "$PTAU_FILE" ]; then
  curl -L -o "$PTAU_FILE" https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau
fi

echo "=== Step 2: Compile circuit ==="
circom "$CIRCUIT_DIR/risk_check.circom" --r1cs --wasm --sym -o "$BUILD_DIR"

echo "=== Step 3: Generate zkey (Groth16 setup) ==="
npx snarkjs groth16 setup "$BUILD_DIR/risk_check.r1cs" "$PTAU_FILE" "$BUILD_DIR/risk_check_0000.zkey"

echo "=== Step 4: Contribute to ceremony ==="
npx snarkjs zkey contribute "$BUILD_DIR/risk_check_0000.zkey" "$BUILD_DIR/risk_check_final.zkey" --name="Demo contribution" -v -e="random entropy for demo"

echo "=== Step 5: Export verification key ==="
npx snarkjs zkey export verificationkey "$BUILD_DIR/risk_check_final.zkey" "$BUILD_DIR/verification_key.json"

echo "=== Done! ==="
echo "Files generated in $BUILD_DIR:"
echo "  - risk_check_js/risk_check.wasm (for proof generation)"
echo "  - risk_check_final.zkey (proving key)"
echo "  - verification_key.json (verification key)"
