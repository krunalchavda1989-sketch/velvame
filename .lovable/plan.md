## Add Self Pickup & Courier Delivery Options

### 1. Database (migration)
- New table `pickup_locations`: name, address_line1, address_line2, city, state, pincode, phone, hours, is_active, sort_order.
  - GRANT: anon+authenticated SELECT (active only via policy); service_role ALL; admins full manage.
- New table `shipping_settings` (single row): courier_charge, free_courier_above (nullable), pickup_charge (default 0), pickup_enabled, courier_enabled.
  - GRANT: anon+authenticated SELECT; admins update.
- Alter `orders`: add `delivery_method` text ('courier'|'pickup', default 'courier'), `pickup_location_id` uuid FK nullable, `shipping_charge` numeric default 0.
- Alter `validate_order_item_price` untouched. Total validation unaffected (charges added at order level).

### 2. Admin
- New page `AdminPickupLocations.tsx` (sidebar entry under Settings): CRUD pickup points.
- New page/section `AdminShippingSettings.tsx` (or section in existing Localization/Settings): toggle methods, set courier charge, free-above threshold, pickup charge.
- `AdminManualOrder.tsx`: add Delivery Method radio (default **Self Pickup**), pickup location dropdown when pickup, charge auto-applied, shipping address still required.

### 3. Storefront Checkout (`src/pages/Checkout.tsx`)
- Add Delivery Method radio group (Courier / Self Pickup) — respect admin enable flags.
- When Pickup: show pickup location selector (cards with address & hours), apply pickup charge.
- When Courier: apply courier charge, free if subtotal ≥ threshold.
- Shipping address form stays required in both cases.
- Mobile-friendly stacked layout (matches earlier mobile checkout fix).
- Pass `delivery_method`, `pickup_location_id`, `shipping_charge` into order insert; include in total.

### 4. Order display
- `OrderDetailView`, `Orders`, admin `AdminOrders` / `AdminOrderDetail`: show delivery method badge and pickup location details when applicable.
- Invoice/email (`send-order-email`, `InvoicePrint`): include delivery method + pickup address or shipping address accordingly.

### 5. Types & misc
- Regenerated `types.ts` after migration.
- No change to commission/wallet logic. Shipping charge added to `total_amount` only.

### Technical notes
- RLS: `pickup_locations` public SELECT where `is_active`; admin manage via `has_role(auth.uid(),'admin')`. `shipping_settings` public SELECT; admin update.
- `validate_order_item_price` trigger only checks item price, so adding shipping_charge to order total is safe.
- Default `delivery_method='courier'` on existing rows; manual order form default overrides to 'pickup' in UI only.

Confirm to proceed and I'll implement.