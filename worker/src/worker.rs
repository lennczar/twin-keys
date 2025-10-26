use crate::miner::{mine_address, calculate_score, MAX_SCORE, POSITION_WEIGHTS};
use crate::api_client::notify_discovery;
use crate::db;
use sea_orm::DatabaseConnection;
use rayon::prelude::*;
use std::sync::Arc;
use std::time::Duration;

const IDLE_CHECK_INTERVAL_SECS: u64 = 30;

/// Format the candidate address with matching positions in white (bold), non-matching in gray
fn format_match(candidate: &str, score: u8) -> String {
    let candidate_bytes = candidate.as_bytes();
    let candidate_len = candidate_bytes.len();
    
    let mut result = String::new();
    
    // Format first 4 chars (prefix)
    for i in 0..4 {
        let c = candidate_bytes[i] as char;
        let bit_position = POSITION_WEIGHTS[i];
        let matches = (score & (1 << bit_position)) != 0;
        
        if matches {
            result.push_str(&format!("\x1b[1;97m{}\x1b[0m", c)); // bold white
        } else {
            result.push_str(&format!("\x1b[1;90m{}\x1b[0m", c)); // bold gray
        }
    }
    
    result.push_str("\x1b[1;90m..\x1b[0m"); // bold gray for separator
    
    // Format last 4 chars (suffix)
    for i in 0..4 {
        let c = candidate_bytes[candidate_len - 4 + i] as char;
        let bit_position = POSITION_WEIGHTS[4 + i];
        let matches = (score & (1 << bit_position)) != 0;
        
        if matches {
            result.push_str(&format!("\x1b[1;97m{}\x1b[0m", c)); // bold white
        } else {
            result.push_str(&format!("\x1b[1;90m{}\x1b[0m", c)); // bold gray
        }
    }
    
    result
}

pub async fn start_mining(
    db: Arc<DatabaseConnection>,
    api_url: String,
    num_threads: usize,
) -> anyhow::Result<()> {
   
    let db_clone = Arc::clone(&db);
    let api_url_clone = api_url.clone();
    
    (0..num_threads).into_par_iter().for_each(|thread_id| {
        let rt = tokio::runtime::Runtime::new().unwrap();
        let db = Arc::clone(&db_clone);
        let api_url = api_url_clone.clone();
        
        let mut nonce: u64 = 0;
        let mut target_count: u64 = 0;
        
        loop {
            // Each thread independently fetches targets
            let targets = rt.block_on(async {
                db::get_active_targets(&db).await.unwrap_or_else(|e| {
                    eprintln!("[thread:{}] error fetching targets: {}", thread_id, e);
                    Vec::new()
                })
            });
            
            if targets.is_empty() {
                println!("[thread:{}] all targets complete (max score {}). idling for {} seconds...", thread_id, MAX_SCORE, IDLE_CHECK_INTERVAL_SECS);
                std::thread::sleep(Duration::from_secs(IDLE_CHECK_INTERVAL_SECS));
                continue;
            }
            
            if target_count != targets.len() as u64 {
                println!("[thread:{}] mining targets updated to {} targets", thread_id, targets.len());
                target_count = targets.len() as u64;
            }
            
            // Mine for a batch before refreshing targets
            let batch_end = nonce + 2_500_000;
            while nonce < batch_end {
                let (candidate_addr, candidate_key) = mine_address(thread_id as u32, nonce);
                nonce += 1;
                
                for target in targets.iter() {
                    let score = calculate_score(&target.target, &candidate_addr);
                    
                    if score > target.score as u8 {
                        let (updated, old_twin_address, old_twin_private_key) = rt.block_on(async {
                            // Single database call to get current target state
                            match db::get_target_by_id(&db, &target.id).await {
                                Ok(current_target) if score as i32 > current_target.score => {
                                    let old_twin_addr = current_target.twin_address.clone();
                                    let old_twin_key = current_target.twin_private_key.clone();
                                    
                                    let updated = db::update_target(
                                        &db,
                                        &target.id,
                                        score as i32,
                                        &candidate_addr,
                                        &candidate_key,
                                    )
                                    .await
                                    .unwrap_or(false);
                                    
                                    (updated, old_twin_addr, old_twin_key)
                                }
                                _ => (false, None, None),
                            }
                        });
                        
                        if updated {
                            let formatted = format_match(&candidate_addr, score);
                            println!(
                                "thread[{}] target[{}]: {} (score: {})",
                                thread_id, target.id, formatted, score
                            );

                            if score >= 0b11100000 {
                                let _ = rt.block_on(notify_discovery(
                                    &api_url,
                                    &target.id,
                                    score,
                                    &candidate_addr,
                                    &candidate_key,
                                    old_twin_address,
                                    old_twin_private_key,
                                ));
                            }
                        }
                    }
                }
            }
        }
    });

    Ok(())
}

