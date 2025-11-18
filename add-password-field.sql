-- Add password field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Update existing check constraints to ensure positive values
ALTER TABLE trial_exams 
DROP CONSTRAINT IF EXISTS trial_exams_total_correct_check,
DROP CONSTRAINT IF EXISTS trial_exams_total_incorrect_check,
DROP CONSTRAINT IF EXISTS trial_exams_total_blank_check;

ALTER TABLE trial_exams 
ADD CONSTRAINT trial_exams_total_correct_check CHECK (total_correct >= 0),
ADD CONSTRAINT trial_exams_total_incorrect_check CHECK (total_incorrect >= 0),
ADD CONSTRAINT trial_exams_total_blank_check CHECK (total_blank >= 0);

ALTER TABLE trial_exam_details
DROP CONSTRAINT IF EXISTS trial_exam_details_correct_check,
DROP CONSTRAINT IF EXISTS trial_exam_details_incorrect_check,
DROP CONSTRAINT IF EXISTS trial_exam_details_blank_check;

ALTER TABLE trial_exam_details
ADD CONSTRAINT trial_exam_details_correct_check CHECK (correct >= 0),
ADD CONSTRAINT trial_exam_details_incorrect_check CHECK (incorrect >= 0),
ADD CONSTRAINT trial_exam_details_blank_check CHECK (blank >= 0);

-- Note: In production, always store hashed passwords, never plain text passwords
-- This is a simple implementation for development purposes