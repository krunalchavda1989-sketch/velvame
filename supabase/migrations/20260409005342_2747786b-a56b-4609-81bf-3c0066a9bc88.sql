
UPDATE commissions SET rate = 0.045 WHERE commission_type = 'level' AND level = 2;
UPDATE commissions SET rate = 0.035 WHERE commission_type = 'level' AND level = 4;
UPDATE commissions SET rate = 0.025 WHERE commission_type = 'level' AND level = 6;
UPDATE commissions SET rate = 0.015 WHERE commission_type = 'level' AND level = 8;
UPDATE commissions SET rate = 0.025 WHERE commission_type = 'repurchase' AND level = 2;
UPDATE commissions SET rate = 0.015 WHERE commission_type = 'repurchase' AND level = 4;
