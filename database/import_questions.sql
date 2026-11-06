-- إنشاء جداول الأسئلة
CREATE TABLE big_five_questions (
    id INT PRIMARY KEY,
    trait VARCHAR(50) NOT NULL,
    facet VARCHAR(50) NOT NULL,
    question_ar TEXT NOT NULL,
    question_en TEXT NOT NULL,
    score_direction VARCHAR(20) DEFAULT 'positive',
    source VARCHAR(100) NOT NULL
);

CREATE TABLE via_questions (
    id INT PRIMARY KEY,
    virtue VARCHAR(50) NOT NULL,
    strength VARCHAR(50) NOT NULL,
    question_ar TEXT NOT NULL,
    question_en TEXT NOT NULL,
    score_direction VARCHAR(20) DEFAULT 'positive',
    source VARCHAR(100) NOT NULL
);

CREATE TABLE health_screening_questions (
    id INT PRIMARY KEY,
    scale VARCHAR(20) NOT NULL,
    question_number INT NOT NULL,
    question_ar TEXT NOT NULL,
    question_en TEXT NOT NULL,
    score_min INT NOT NULL,
    score_max INT NOT NULL,
    source VARCHAR(100) NOT NULL
);

CREATE TABLE narrative_questions (
    id INT PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    question_ar TEXT NOT NULL,
    question_en TEXT NOT NULL,
    min_words INT,
    max_words INT,
    purpose VARCHAR(100)
);

-- استيراد البيانات من ملفات CSV.
-- استخدم مسارات محلية متاحة لخادم PostgreSQL مع COPY،
-- أو استخدم \copy داخل psql من جهازك.
-- COPY big_five_questions FROM '/path/to/big_five_questions.csv' DELIMITER ',' CSV HEADER;
-- COPY via_questions FROM '/path/to/via_questions.csv' DELIMITER ',' CSV HEADER;
-- COPY health_screening_questions FROM '/path/to/health_screening_questions.csv' DELIMITER ',' CSV HEADER;
-- COPY narrative_questions FROM '/path/to/narrative_questions.csv' DELIMITER ',' CSV HEADER;
