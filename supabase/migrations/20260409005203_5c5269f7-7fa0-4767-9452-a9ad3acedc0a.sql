
-- Step 1: Fix commission rates and amounts
UPDATE commissions c
SET rate = correct_rates.correct_rate,
    amount = ROUND(correct_rates.order_total * correct_rates.correct_rate, 2)
FROM (
  SELECT c2.id,
    o.total_amount as order_total,
    CASE 
      WHEN c2.commission_type = 'level' THEN 
        CASE c2.level WHEN 1 THEN 0.05 WHEN 2 THEN 0.045 WHEN 3 THEN 0.04 WHEN 4 THEN 0.035 WHEN 5 THEN 0.03 WHEN 6 THEN 0.025 WHEN 7 THEN 0.02 WHEN 8 THEN 0.015 WHEN 9 THEN 0.01 END
      WHEN c2.commission_type = 'repurchase' THEN 
        CASE c2.level WHEN 1 THEN 0.03 WHEN 2 THEN 0.025 WHEN 3 THEN 0.02 WHEN 4 THEN 0.015 WHEN 5 THEN 0.01 WHEN 6 THEN 0.005 END
    END as correct_rate
  FROM commissions c2
  JOIN orders o ON o.id = c2.order_id
) correct_rates
WHERE c.id = correct_rates.id;

-- Step 2: Recalculate wallet balances from actual commission totals
UPDATE wallets w
SET commission_balance = COALESCE(comm_totals.total, 0) - COALESCE(debits.total_debited, 0),
    total_earned = COALESCE(comm_totals.total, 0),
    balance = COALESCE(comm_totals.total, 0) - COALESCE(debits.total_debited, 0) + (w.balance - w.commission_balance)
FROM (
  SELECT beneficiary_id as user_id, SUM(amount) as total
  FROM commissions
  GROUP BY beneficiary_id
) comm_totals
LEFT JOIN (
  SELECT user_id, SUM(amount) as total_debited
  FROM wallet_transactions
  WHERE type = 'debit' AND balance_type = 'commission'
  GROUP BY user_id
) debits ON debits.user_id = comm_totals.user_id
WHERE w.user_id = comm_totals.user_id;

-- Step 3: Log correction transactions for affected users
INSERT INTO wallet_transactions (user_id, type, amount, description, closing_balance, balance_type)
SELECT w.user_id, 'debit', 14.70, 'Commission Rate Correction (System Audit)', w.balance, 'commission'
FROM wallets w
WHERE w.user_id IN (
  'd195dd3a-07ea-42f8-9517-19c26feb005a',
  'a60d25ef-3f0d-4858-b33d-7e622333e4e6',
  '679fac9a-fbba-499f-a77e-3350cbcb99be'
);
