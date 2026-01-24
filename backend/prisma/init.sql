-- SwimFlow Database Initialization
-- This file is used by Docker to set up the initial database

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE swimflow_db TO swimflow_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO swimflow_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO swimflow_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO swimflow_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO swimflow_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO swimflow_user;