-- Homework table for storing assignments
CREATE TABLE IF NOT EXISTS homework (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_homework_student_id ON homework(student_id);
CREATE INDEX IF NOT EXISTS idx_homework_coach_id ON homework(coach_id);
CREATE INDEX IF NOT EXISTS idx_homework_date ON homework(date);

-- Enable Row Level Security (RLS)
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Coaches can see and manage homework for their students
CREATE POLICY "Coaches can view homework for their students" ON homework
    FOR SELECT USING (
        coach_id IN (
            SELECT id FROM users WHERE id = auth.uid() AND role = 'coach'
        )
    );

CREATE POLICY "Coaches can insert homework for their students" ON homework
    FOR INSERT WITH CHECK (
        coach_id IN (
            SELECT id FROM users WHERE id = auth.uid() AND role = 'coach'
        )
    );

CREATE POLICY "Coaches can update homework for their students" ON homework
    FOR UPDATE USING (
        coach_id IN (
            SELECT id FROM users WHERE id = auth.uid() AND role = 'coach'
        )
    );

CREATE POLICY "Coaches can delete homework for their students" ON homework
    FOR DELETE USING (
        coach_id IN (
            SELECT id FROM users WHERE id = auth.uid() AND role = 'coach'
        )
    );

-- Students can view and update completion status of their own homework
CREATE POLICY "Students can view their own homework" ON homework
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM users WHERE id = auth.uid() AND role = 'student'
        )
    );

CREATE POLICY "Students can update completion status of their homework" ON homework
    FOR UPDATE USING (
        student_id IN (
            SELECT id FROM users WHERE id = auth.uid() AND role = 'student'
        )
    ) WITH CHECK (
        student_id IN (
            SELECT id FROM users WHERE id = auth.uid() AND role = 'student'
        )
    );

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_homework_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_homework_updated_at
    BEFORE UPDATE ON homework
    FOR EACH ROW
    EXECUTE FUNCTION update_homework_updated_at();