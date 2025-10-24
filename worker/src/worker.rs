use crate::miner::{mine_address, calculate_score};
use crate::api_client::notify_discovery;
use crate::db;
use sea_orm::DatabaseConnection;
use rayon::prelude::*;
use std::sync::Arc;
use std::time::Duration;

const IDLE_CHECK_INTERVAL_SECS: u64 = 30;

pub async fn start_mining(
    db: Arc<DatabaseConnection>,
    api_url: String,
    num_threads: usize,
) -> anyhow::Result<()> {    
    loop {
        let targets = db::get_active_targets(&db).await?;
        
        if targets.is_empty() {
            println!("All targets complete (score 8). Idling for {} seconds...", IDLE_CHECK_INTERVAL_SECS);
            tokio::time::sleep(Duration::from_secs(IDLE_CHECK_INTERVAL_SECS)).await;
            continue;
        }
        
        let targets = Arc::new(targets);
        let db_clone = Arc::clone(&db);
        let api_url_clone = api_url.clone();
        
        (0..num_threads).into_par_iter().for_each(|thread_id| {
            let targets = Arc::clone(&targets);
            let rt = tokio::runtime::Runtime::new().unwrap();
            let db = Arc::clone(&db_clone);
            let api_url = api_url_clone.clone();
            
            let mut nonce: u64 = 0;
            
            loop {
                let (candidate_addr, candidate_key) = mine_address(thread_id as u32, nonce);
                nonce += 1;
                
                for target in targets.iter() {
                    let score = calculate_score(&target.target, &candidate_addr);
                    
                    if score > target.score as u8 {
                        let (updated, old_twin_address, old_twin_private_key) = rt.block_on(async {
                            match db::get_current_score(&db, &target.id).await {
                                Ok(current_score) if score as i32 > current_score => {
                                    let current_target = db::get_target_by_id(&db, &target.id).await.ok();
                                    let old_twin_addr = current_target.as_ref().and_then(|t| t.twin_address.clone());
                                    let old_twin_key = current_target.as_ref().and_then(|t| t.twin_private_key.clone());
                                    
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
                            println!(
                                "Thread {} found better match for target {}! Score: {} -> {}",
                                thread_id, target.id, target.score, score
                            );
                            
                            let _ = rt.block_on(notify_discovery(
                                &api_url,
                                &target.id,
                                score,
                                &candidate_addr,
                                &candidate_key,
                                old_twin_address,
                                old_twin_private_key,
                            ));
                            break;
                        }
                    }
                }
                
                if nonce % 10000 == 0 {
                    break;
                }
            }
        });
        
        tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
    }
}

