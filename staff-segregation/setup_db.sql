-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Table to store staff profiles and their facial embeddings
CREATE TABLE IF NOT EXISTS staff_profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    embedding vector(512), -- DeepFace Facenet512 produces 512-d embeddings
    image BYTEA, -- Store the face image for reference
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to log detections
CREATE TABLE IF NOT EXISTS detections_log (
    id SERIAL PRIMARY KEY,
    tracking_id INT,
    label VARCHAR(50), -- 'Staff', 'Customer', 'Unknown'
    confidence FLOAT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create an index for faster similarity search (optional, requires some data first ideally, but good to have)
-- specific index parameters might need tuning based on dataset size
CREATE INDEX ON staff_profiles USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
