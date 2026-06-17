-- Migration SQL for Meeting Approval Workflow

-- Add meeting_link column to meetings table
ALTER TABLE meetings ADD COLUMN meeting_link VARCHAR(500);

-- Update meetings status check constraint to remove 'requested'
ALTER TABLE meetings DROP CONSTRAINT meetings_status_check;
ALTER TABLE meetings ADD CONSTRAINT meetings_status_check CHECK (status IN ('scheduled', 'completed', 'cancelled'));

-- Create meeting_requests table
CREATE TABLE meeting_requests (
    id SERIAL PRIMARY KEY,
    investor_id INTEGER REFERENCES investors(id),
    startup_id INTEGER REFERENCES startups(id),
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Migrate existing 'requested' meetings to meeting_requests
-- INSERT INTO meeting_requests (investor_id, startup_id, message, status, created_at)
-- SELECT investor_id, startup_id, NULL, 'pending', created_at
-- FROM meetings WHERE status = 'requested';

-- Then delete old requested meetings
-- DELETE FROM meetings WHERE status = 'requested';