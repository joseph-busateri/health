-- Fix split_days table to use concentric for all 12 weeks
UPDATE split_days
SET week11_style = 'concentric',
    week12_style = 'concentric'
WHERE week11_style != 'concentric' OR week12_style != 'concentric';

-- Verify the update
SELECT id, split_day, split_focus, day_order, week1_10_style, week11_style, week12_style
FROM split_days
ORDER BY day_order;
