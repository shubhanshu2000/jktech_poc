#!/bin/bash
set -e

# wait until the database is ready
echo "Waiting for database to be ready"
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 0.1
done

npm run migrations:up & PID=$!
# Wait for migration to finish
wait $PID
echo "Migration finished"

# Start the server
echo "Starting server"
npm run start