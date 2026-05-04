function main() {
    if (!process.env.DATABASE_URL) {
        console.warn("DATABASE_URL is not configured.");
    }

    console.log("Database setup script is disabled. Manage schema and data manually.");
}

main();
