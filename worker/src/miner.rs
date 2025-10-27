use ed25519_dalek::{SigningKey, VerifyingKey};
use bs58;
use sha2::{Sha256, Digest};
use once_cell::sync::Lazy;

// Version string for seed generation - increment to invalidate old addresses
const VERSION: &str = "v0.0.1";

// Weights for each of the 8 positions: [prefix_0, prefix_1, prefix_2, prefix_3, suffix_0, suffix_1, suffix_2, suffix_3]
// Adjust these weights to prioritize certain positions over others
pub const POSITION_WEIGHTS: [u8; 8] = [7, 5, 3, 1, 0, 2, 4, 6];

// Calculate the maximum possible score
pub const MAX_SCORE: u8 = 255;

// Compute version hash once at startup
static VERSION_HASH: Lazy<[u8; 4]> = Lazy::new(|| {
    let mut hasher = Sha256::new();
    hasher.update(VERSION.as_bytes());
    let hash = hasher.finalize();
    let mut result = [0u8; 4];
    result.copy_from_slice(&hash[0..4]);
    result
});

pub fn mine_address(thread_id: u32, nonce: u64) -> (String, String) {
    let mut seed = [0u8; 32];
    
    seed[0..4].copy_from_slice(&*VERSION_HASH);
    seed[4..8].copy_from_slice(&thread_id.to_le_bytes());
    seed[8..16].copy_from_slice(&nonce.to_le_bytes());
    
    let signing_key = SigningKey::from_bytes(&seed);
    let verifying_key: VerifyingKey = signing_key.verifying_key();
    
    let address = bs58::encode(verifying_key.as_bytes()).into_string();
    let private_key = bs58::encode(signing_key.to_bytes()).into_string();
    
    (address, private_key)
}

pub fn calculate_score(target: &str, candidate: &str) -> u8 {
    let target_bytes = target.as_bytes();
    let candidate_bytes = candidate.as_bytes();
    let candidate_len = candidate_bytes.len();
    
    let mut score = 0u8;
    
    // Check prefix positions (first 4 characters)
    for i in 0..4 {
        if target_bytes[i] == candidate_bytes[i] {
            score += 0b1 << POSITION_WEIGHTS[i];
        }
    }
    
    // Check suffix positions (last 4 characters)
    for i in 0..4 {
        if target_bytes[4 + i] == candidate_bytes[candidate_len - 4 + i] {
            score += 0b1 << POSITION_WEIGHTS[4 + i];
        }
    }
    
    score
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_score() {
        // With weights [7, 5, 3, 1, 0, 2, 4, 6] used as bit positions (2^weight)
        // All 8 positions match: 2^7 + 2^5 + 2^3 + 2^1 + 2^0 + 2^2 + 2^4 + 2^6 = 255
        assert_eq!(calculate_score("abcd1234", "abcd_____1234"), MAX_SCORE);
        
        // First 2 prefix (2^7 + 2^5 = 160) and last 4 suffix (2^0 + 2^2 + 2^4 + 2^6 = 85) = 245
        assert_eq!(calculate_score("abcd1234", "abxx_____1234"), 245);
        
        // No matches
        assert_eq!(calculate_score("abcd1234", "xxxx_____xxxx"), 0);
        
        // First 4 prefix only (2^7 + 2^5 + 2^3 + 2^1 = 170)
        assert_eq!(calculate_score("abcd1234", "abcd_____xxxx"), 170);
        
        // Last 4 suffix only (2^0 + 2^2 + 2^4 + 2^6 = 85)
        assert_eq!(calculate_score("abcd1234", "xxxx_____1234"), 85);
    }
}

