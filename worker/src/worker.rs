use crate::miner::{mine_address, calculate_score};
use crate::api_client::notify_discovery;
use crate::db;
use sea_orm::DatabaseConnection;
use rayon::prelude::*;
use std::sync::Arc;

pub async fn start_mining(
    db: Arc<DatabaseConnection>,
    api_url: String,
    num_threads: usize,
) -> anyhow::Result<()> {    
    loop {
        let targets = db::get_active_targets(&db).await?;
        
        if targets.is_empty() {
            println!("All targets reached score 8. Mining complete!");
            break;
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
                        let updated = rt.block_on(async {
                            match db::get_current_score(&db, &target.id).await {
                                Ok(current_score) if score as i32 > current_score => {
                                    db::update_target(
                                        &db,
                                        &target.id,
                                        score as i32,
                                        &candidate_addr,
                                        &candidate_key,
                                    )
                                    .await
                                    .unwrap_or(false)
                                }
                                _ => false,
                            }
                        });
                        
                        if updated {
                            println!(
                                "Thread {} found better match for target {}! Score: {} -> {}",
                                thread_id, target.id, target.score, score
                            );
                            
                            let _ = rt.block_on(notify_discovery(&api_url, &target.id, score));
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
    
    Ok(())
}

