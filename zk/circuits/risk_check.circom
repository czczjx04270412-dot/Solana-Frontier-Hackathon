pragma circom 2.0.0;

// Simplified ZK circuit for DeFi credit risk verification
// Proves: collateralRatio >= minRatio AND creditScore >= minScore
// without revealing the actual values of collateralRatio or creditScore

template GreaterEqThan(n) {
    signal input in[2];
    signal output out;

    // in[0] >= in[1] means (in[0] - in[1]) is non-negative
    // For simplified demo, we use a range check
    signal diff;
    diff <== in[0] - in[1];

    // Ensure diff is in valid range [0, 2^n - 1]
    // This is a simplified constraint for demo purposes
    signal bits[n];
    var sum = 0;
    for (var i = 0; i < n; i++) {
        bits[i] <-- (diff >> i) & 1;
        bits[i] * (bits[i] - 1) === 0; // each bit is 0 or 1
        sum += bits[i] * (1 << i);
    }
    sum === diff;
    out <== 1;
}

template RiskCheck() {
    // Private inputs (borrower's secret data)
    signal input collateralRatio;  // e.g., 184
    signal input creditScore;      // e.g., 87

    // Public inputs (thresholds known to everyone)
    signal input minRatio;         // e.g., 120
    signal input minScore;         // e.g., 40

    // Output: 1 if both conditions are satisfied
    signal output valid;

    // Check collateralRatio >= minRatio
    component geRatio = GreaterEqThan(16);
    geRatio.in[0] <== collateralRatio;
    geRatio.in[1] <== minRatio;

    // Check creditScore >= minScore
    component geScore = GreaterEqThan(16);
    geScore.in[0] <== creditScore;
    geScore.in[1] <== minScore;

    // Both must pass
    valid <== geRatio.out * geScore.out;
}

component main {public [minRatio, minScore]} = RiskCheck();
