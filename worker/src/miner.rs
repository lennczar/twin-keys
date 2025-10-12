use ed25519_dalek::{SigningKey, VerifyingKey};
use bs58;

pub fn mine_address(thread_id: u32, nonce: u64) -> (String, String) {
    let mut seed = [0u8; 32];
    
    seed[0..4].copy_from_slice(&thread_id.to_le_bytes());
    seed[4..12].copy_from_slice(&nonce.to_le_bytes());
    
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
    
    for i in 0..4 {
        if target_bytes[i] == candidate_bytes[i] {
            score += 1;
        }
    }
    
    for i in 0..4 {
        if target_bytes[4 + i] == candidate_bytes[candidate_len - 4 + i] {
            score += 1;
        }
    }
    
    score
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_score() {
        assert_eq!(calculate_score("abcd1234", "abcd_____1234"), 8);
        assert_eq!(calculate_score("abcd1234", "abxx_____1234"), 6);
        assert_eq!(calculate_score("abcd1234", "xxxx_____xxxx"), 0);
        assert_eq!(calculate_score("abcd1234", "abcd_____xxxx"), 4);
    }
}

