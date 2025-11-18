-- Supabase Schema for LGS Student Coaching Platform
-- This file contains the complete database schema needed for the application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for both coaches and students)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('coach', 'student')),
    coach_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Only for students
    programs TEXT DEFAULT '[]', -- JSON string for student programs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Books table
CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily logs table
CREATE TABLE IF NOT EXISTS daily_logs (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(50) NOT NULL,
    question_count INTEGER NOT NULL CHECK (question_count >= 0),
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trial exams table
CREATE TABLE IF NOT EXISTS trial_exams (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    total_correct INTEGER NOT NULL CHECK (total_correct >= 0),
    total_incorrect INTEGER NOT NULL CHECK (total_incorrect >= 0),
    total_blank INTEGER NOT NULL CHECK (total_blank >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trial exam details table (for subject-specific results)
CREATE TABLE IF NOT EXISTS trial_exam_details (
    id SERIAL PRIMARY KEY,
    trial_exam_id INTEGER NOT NULL REFERENCES trial_exams(id) ON DELETE CASCADE,
    subject VARCHAR(50) NOT NULL,
    correct INTEGER NOT NULL CHECK (correct >= 0),
    incorrect INTEGER NOT NULL CHECK (incorrect >= 0),
    blank INTEGER NOT NULL CHECK (blank >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_coach_id ON users(coach_id);
CREATE INDEX IF NOT EXISTS idx_assignments_student_id ON assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_student_id ON daily_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);
CREATE INDEX IF NOT EXISTS idx_trial_exams_student_id ON trial_exams(student_id);
CREATE INDEX IF NOT EXISTS idx_trial_exams_date ON trial_exams(date);
CREATE INDEX IF NOT EXISTS idx_trial_exam_details_exam_id ON trial_exam_details(trial_exam_id);

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_exam_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies should be set up based on your authentication requirements
-- For now, we'll allow all operations for development purposes
-- In production, you should implement proper RLS policies

-- Database is ready for use
-- No sample data inserted - you can add your own coaches and students through the application