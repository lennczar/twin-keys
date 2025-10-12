use anyhow::Result;
use serde::Serialize;

#[derive(Serialize)]
struct DiscoveryPayload {
    #[serde(rename = "targetId")]
    target_id: String,
    score: u8,
}

pub async fn notify_discovery(api_url: &str, target_id: &str, score: u8) -> Result<()> {
    let client = reqwest::Client::new();
    let url = format!("{}/mining/discovery", api_url);
    
    let payload = DiscoveryPayload {
        target_id: target_id.to_string(),
        score,
    };
    
    client
        .post(&url)
        .json(&payload)
        .send()
        .await?
        .error_for_status()?;
    
    Ok(())
}

