-- Joel Frame Work: order tracking fields for the admin portal.
-- customer_orders is already created by the existing order-checkout setup.
alter table public.customer_orders
  add column if not exists status text not null default 'order_placed',
  add column if not exists payment_status text not null default 'pending',
  add column if not exists updated_at timestamptz not null default now();

create index if not exists customer_orders_created_at_idx
  on public.customer_orders (created_at desc);

-- Keep existing payment records intact; normalise only empty order statuses.
update public.customer_orders
set status = 'order_placed'
where status is null or btrim(status) = '';

