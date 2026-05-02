-- Seed for local development. Run after creating an operator account.
-- Replace <OPERATOR_UUID> with the auth.users.id of your seeded operator.

-- Tools
insert into public.tools (owner_id, name, rate_paise_per_hour, sort_order) values
  ('<OPERATOR_UUID>', 'Rotavator',     80000, 1),
  ('<OPERATOR_UUID>', 'Cultivator',    70000, 2),
  ('<OPERATOR_UUID>', 'Plough',        65000, 3),
  ('<OPERATOR_UUID>', 'Trailer',       55000, 4);

-- Customers
insert into public.customers (owner_id, name, phone, village) values
  ('<OPERATOR_UUID>', 'Murugan',     '9876543210', 'Karur'),
  ('<OPERATOR_UUID>', 'Selvi',       '9876543211', 'Karur'),
  ('<OPERATOR_UUID>', 'Ramasamy',    '9876543212', 'Aravakurichi'),
  ('<OPERATOR_UUID>', 'Lakshmi',     '9876543213', 'Kulithalai'),
  ('<OPERATOR_UUID>', 'Velu',        '9876543214', 'Krishnarayapuram');

-- (Add sample services / payments after you have customer + tool IDs.)
