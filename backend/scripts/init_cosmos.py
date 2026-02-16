"""One-time script to create Cosmos DB database and containers.

Usage (from backend/ directory):
    python -m scripts.init_cosmos

Requires COSMOS_DB_URL and COSMOS_DB_KEY in environment or .env file.
"""
from azure.cosmos import CosmosClient, PartitionKey
from app.config import settings


def init_cosmos():
    if not settings.cosmos_db_url or not settings.cosmos_db_key:
        print("ERROR: COSMOS_DB_URL and COSMOS_DB_KEY must be set in .env")
        return

    print(f"Connecting to Cosmos DB: {settings.cosmos_db_url}")
    client = CosmosClient(settings.cosmos_db_url, settings.cosmos_db_key)

    # Create database (serverless -- no throughput provisioning needed)
    database = client.create_database_if_not_exists(id=settings.cosmos_db_database)
    print(f"Database '{settings.cosmos_db_database}' ready")

    # Create jobs container
    database.create_container_if_not_exists(
        id=settings.cosmos_db_jobs_container,
        partition_key=PartitionKey(path="/job_id"),
    )
    print(f"Container '{settings.cosmos_db_jobs_container}' ready (partition: /job_id)")

    # Create proposals container
    database.create_container_if_not_exists(
        id=settings.cosmos_db_proposals_container,
        partition_key=PartitionKey(path="/job_id"),
    )
    print(f"Container '{settings.cosmos_db_proposals_container}' ready (partition: /job_id)")

    # Create users container
    database.create_container_if_not_exists(
        id=settings.cosmos_db_users_container,
        partition_key=PartitionKey(path="/user_id"),
    )
    print(f"Container '{settings.cosmos_db_users_container}' ready (partition: /user_id)")

    # Create settings container
    database.create_container_if_not_exists(
        id=settings.cosmos_db_settings_container,
        partition_key=PartitionKey(path="/scope"),
    )
    print(f"Container '{settings.cosmos_db_settings_container}' ready (partition: /scope)")

    print("Cosmos DB initialization complete!")


if __name__ == "__main__":
    init_cosmos()
