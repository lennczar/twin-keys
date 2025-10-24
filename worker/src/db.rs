use sea_orm::*;

pub async fn get_active_targets(db: &DatabaseConnection) -> Result<Vec<crate::entity::mining_target::Model>, DbErr> {
    use crate::entity::mining_target;
    
    mining_target::Entity::find()
        .filter(mining_target::Column::Score.lt(8))
        .all(db)
        .await
}

pub async fn update_target(
    db: &DatabaseConnection,
    id: &str,
    score: i32,
    twin_address: &str,
    twin_private_key: &str,
) -> Result<bool, DbErr> {
    use crate::entity::mining_target;
    use sea_orm::sea_query::Expr;
    
    let result = mining_target::Entity::update_many()
        .col_expr(mining_target::Column::Score, Expr::value(score))
        .col_expr(mining_target::Column::TwinAddress, Expr::value(Some(twin_address)))
        .col_expr(mining_target::Column::TwinPrivateKey, Expr::value(Some(twin_private_key)))
        .col_expr(mining_target::Column::Deployed, Expr::value(false))
        .col_expr(mining_target::Column::UpdatedAt, Expr::current_timestamp().into())
        .filter(mining_target::Column::Id.eq(id))
        .filter(mining_target::Column::Score.lt(score))
        .exec(db)
        .await?;
    
    Ok(result.rows_affected > 0)
}

pub async fn get_current_score(db: &DatabaseConnection, id: &str) -> Result<i32, DbErr> {
    use crate::entity::mining_target;
    
    let target = mining_target::Entity::find()
        .filter(mining_target::Column::Id.eq(id))
        .one(db)
        .await?;
    
    Ok(target.map(|t| t.score).unwrap_or(0))
}

pub async fn get_target_by_id(db: &DatabaseConnection, id: &str) -> Result<crate::entity::mining_target::Model, DbErr> {
    use crate::entity::mining_target;
    
    mining_target::Entity::find()
        .filter(mining_target::Column::Id.eq(id))
        .one(db)
        .await?
        .ok_or(DbErr::RecordNotFound(format!("Target {} not found", id)))
}

