
-- Fix order VEL00047: correct total_amount and wallet_amount_used, deduct wallet
UPDATE orders 
SET total_amount = 2940, 
    wallet_amount_used = 2800,
    razorpay_amount = 140
WHERE id = '3954fc57-bf00-4de6-8b41-185bc709e397' AND order_number = 'VEL00047';

-- Deduct wallet for user VM541
UPDATE wallets 
SET subscription_balance = subscription_balance - 2800,
    balance = balance - 2800,
    total_withdrawn = total_withdrawn + 2800,
    updated_at = now()
WHERE user_id = 'dc40c456-dc87-41cb-8a7b-669cd1b61b6e';

-- Record the wallet transaction
INSERT INTO wallet_transactions (user_id, type, amount, description, closing_balance, balance_type, order_id)
VALUES (
  'dc40c456-dc87-41cb-8a7b-669cd1b61b6e', 
  'debit', 
  2800, 
  'Order Payment - VEL00047 (Subscription Balance) [Admin Correction]', 
  0, 
  'subscription', 
  '3954fc57-bf00-4de6-8b41-185bc709e397'
);
