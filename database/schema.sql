-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    country_code VARCHAR(3),
    language VARCHAR(10) DEFAULT 'ar',
    created_at TIMESTAMP DEFAULT NOW(),
    consent_signed BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Assessment sessions
CREATE TABLE assessment_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'in_progress',
    consistency_score DECIMAL(5,2),
    total_time_minutes INT
);

-- Biographical data
CREATE TABLE biographical_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    age INT,
    gender VARCHAR(20),
    education_level VARCHAR(50),
    marital_status VARCHAR(30),
    occupation VARCHAR(100),
    family_environment TEXT,
    social_context TEXT,
    major_life_events TEXT,
    current_challenges TEXT,
    future_aspirations TEXT
);

-- Big Five personality scores
CREATE TABLE personality_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    openness_score DECIMAL(5,2) CHECK (openness_score BETWEEN 0 AND 100),
    conscientiousness_score DECIMAL(5,2) CHECK (conscientiousness_score BETWEEN 0 AND 100),
    extraversion_score DECIMAL(5,2) CHECK (extraversion_score BETWEEN 0 AND 100),
    agreeableness_score DECIMAL(5,2) CHECK (agreeableness_score BETWEEN 0 AND 100),
    neuroticism_score DECIMAL(5,2) CHECK (neuroticism_score BETWEEN 0 AND 100),
    facets JSONB,
    interpretation TEXT,
    generated_at TIMESTAMP DEFAULT NOW()
);

-- Intelligences and strengths
CREATE TABLE intelligences_and_strengths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    linguistic_score DECIMAL(5,2),
    logical_score DECIMAL(5,2),
    spatial_score DECIMAL(5,2),
    bodily_kinesthetic_score DECIMAL(5,2),
    musical_score DECIMAL(5,2),
    interpersonal_score DECIMAL(5,2),
    intrapersonal_score DECIMAL(5,2),
    naturalistic_score DECIMAL(5,2),
    via_strengths JSONB,
    top_5_strengths TEXT[],
    interpretation TEXT,
    generated_at TIMESTAMP DEFAULT NOW()
);

-- Health screening
CREATE TABLE health_screening (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    phq9_score INT CHECK (phq9_score BETWEEN 0 AND 27),
    gad7_score INT CHECK (gad7_score BETWEEN 0 AND 21),
    crisis_flags TEXT[],
    crisis_protocol_triggered BOOLEAN DEFAULT FALSE,
    screening_date TIMESTAMP DEFAULT NOW()
);

-- Generated books
CREATE TABLE generated_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES assessment_sessions(id),
    payment_id VARCHAR(255),
    payment_status VARCHAR(20),
    pdf_url TEXT,
    chapters JSONB,
    ai_model_used VARCHAR(50),
    generation_cost_usd DECIMAL(6,4),
    created_at TIMESTAMP DEFAULT NOW(),
    download_count INT DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS generated_books_payment_id_unique
    ON generated_books(payment_id)
    WHERE payment_id IS NOT NULL;

-- RAG knowledge base
CREATE TABLE knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_title VARCHAR(255),
    source_author VARCHAR(255),
    source_year INT,
    chapter_or_section VARCHAR(255),
    content TEXT,
    embedding VECTOR(1536),
    tags TEXT[],
    language VARCHAR(10) DEFAULT 'en'
);
