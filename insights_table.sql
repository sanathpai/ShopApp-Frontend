-- Create insights table for business insights feature
CREATE TABLE IF NOT EXISTS insights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    insight1 TEXT,
    insight2 TEXT,
    free_text LONGTEXT,
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Foreign key constraint (assuming you have a users table)
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    
    -- Index for faster queries
    INDEX idx_user_id (user_id),
    INDEX idx_updated_at (updated_at),
    INDEX idx_user_updated (user_id, updated_at)
);

-- Optional: Add some sample data for testing
-- INSERT INTO insights (user_id, insight1, insight2, free_text, title) VALUES
-- (1, 'Your sales have increased by 15% this month', 'Top performing product is Apple - Gala', 'Based on your recent sales data, there\'s a clear upward trend in customer acquisition. Consider expanding your inventory of high-performing items.', 'Sales Performance'),
-- (1, 'Inventory turnover is optimal', 'Stock levels are well-balanced', 'Your inventory management strategy is working well. Current turnover rate suggests efficient stock management without overstock issues.', 'Inventory Analysis');

-- Grant permissions for the professor's Python script (adjust username as needed)
-- GRANT INSERT, UPDATE, SELECT ON shopdatabase.insights TO 'professor_user'@'%'; 