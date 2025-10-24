use anyhow::Result;
use serde::Serialize;

#[derive(Serialize)]
struct DiscoveryPayload {
    #[serde(rename = "targetId")]
    target_id: String,
    score: u8,
    #[serde(rename = "twinAddress")]
    twin_address: String,
    #[serde(rename = "twinPrivateKey")]
    twin_private_key: String,
    #[serde(rename = "oldTwinAddress")]
    old_twin_address: Option<String>,
    #[serde(rename = "oldTwinPrivateKey")]
    old_twin_private_key: Option<String>,
}

pub async fn notify_discovery(
    api_url: &str,
    target_id: &str,
    score: u8,
    twin_address: &str,
    twin_private_key: &str,
    old_twin_address: Option<String>,
    old_twin_private_key: Option<String>,
) -> Result<()> {
    let client = reqwest::Client::new();
    let url = format!("{}/mining/discovery", api_url);
    
    let payload = DiscoveryPayload {
        target_id: target_id.to_string(),
        score,
        twin_address: twin_address.to_string(),
        twin_private_key: twin_private_key.to_string(),
        old_twin_address,
        old_twin_private_key,
    };
    
    client
        .post(&url)
        .json(&payload)
        .send()
        .await?
        .error_for_status()?;
    
    Ok(())
}

