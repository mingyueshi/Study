-- The official PostgreSQL entrypoint runs this only on a new data volume.
\getenv app_user PRIMARY_DB_USER
\getenv app_password PRIMARY_DB_PASSWORD
\getenv app_database PRIMARY_DB_NAME
SELECT format('CREATE ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD %L', :'app_user', :'app_password') \gexec
SELECT format('CREATE DATABASE %I OWNER %I', :'app_database', :'app_user') \gexec
