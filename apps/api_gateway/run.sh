#!/bin/bash
set -e

echo "Waiting for database to be ready"
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 0.1
done

npm run migrations:up & PID=$!
# Wait for migration to finish
wait $PID
echo "Migration finished"

# Run the seed in order
npm run seed:run -- -n RoleSeeder
npm run seed:run -- -n PermissionSeeder
npm run seed:run -- -n AdminUserSeeder
npm run seed:run -- -n RolePermissionSeeder

# Start the server
echo "Starting server"
npm run start