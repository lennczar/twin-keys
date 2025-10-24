use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, Eq, EnumIter, DeriveActiveEnum)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "TargetType")]
pub enum TargetType {
    #[sea_orm(string_value = "wallet")]
    Wallet,
    #[sea_orm(string_value = "token")]
    Token,
}

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "MiningTarget")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    pub address: String,
    pub target: String,
    pub score: i32,
    #[sea_orm(column_name = "twinAddress")]
    pub twin_address: Option<String>,
    #[sea_orm(column_name = "twinPrivateKey")]
    pub twin_private_key: Option<String>,
    #[sea_orm(column_name = "type")]
    pub target_type: TargetType,
    pub deployed: bool,
    #[sea_orm(column_name = "createdAt")]
    pub created_at: DateTime,
    #[sea_orm(column_name = "updatedAt")]
    pub updated_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

