
-- Fix Level Income rates for even levels
UPDATE commissions SET rate = 0.045 WHERE commission_type = 'level' AND level = 2 AND rate != 0.045;
UPDATE commissions SET rate = 0.035 WHERE commission_type = 'level' AND level = 4 AND rate != 0.035;
UPDATE commissions SET rate = 0.025 WHERE commission_type = 'level' AND level = 6 AND rate != 0.025;
UPDATE commissions SET rate = 0.015 WHERE commission_type = 'level' AND level = 8 AND rate != 0.015;

-- Fix Repurchase rates for even levels
UPDATE commissions SET rate = 0.025 WHERE commission_type = 'repurchase' AND level = 2 AND rate != 0.025;
UPDATE commissions SET rate = 0.015 WHERE commission_type = 'repurchase' AND level = 4 AND rate != 0.015;

-- Recalculate amounts for all commissions based on corrected rates
UPDATE commissions c
SET amount = ROUND((o.total_amount * c.rate)::numeric, 2)
FROM orders o
WHERE o.id = c.order_id;
