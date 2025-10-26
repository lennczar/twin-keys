mod miner;
mod api_client;
mod worker;
mod db;
mod entity;

use sea_orm::{Database, ConnectOptions};
use std::sync::Arc;
use std::time::Duration;
use dotenv::dotenv;
use std::env;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv().ok();
    
    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    let api_url = env::var("API_URL")
        .unwrap_or_else(|_| "http://localhost:3000".to_string());
    let num_threads = env::var("NUM_THREADS")
        .unwrap_or_else(|_| num_cpus::get().to_string())
        .parse::<usize>()
        .unwrap_or_else(|_| num_cpus::get());
    
    println!("Starting twin-keys miner with {} threads", num_threads);
    println!("Database: {}", database_url);
    println!("API URL: {}", api_url);
    
    let mut opt = ConnectOptions::new(database_url);
    opt.max_connections((num_threads as u32 * 3) + 10)
        .connect_timeout(Duration::from_secs(10))
        .acquire_timeout(Duration::from_secs(10))
        .sqlx_logging(false);
    
    let db = Database::connect(opt).await?;
    
    println!("Connected to database");
    
    worker::start_mining(Arc::new(db), api_url, num_threads).await?;
    
    Ok(())
}

