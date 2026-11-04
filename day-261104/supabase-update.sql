-- 고해상도 원본 + 썸네일로 바꾸기. Supabase > SQL Editor 에 붙여넣고 Run
alter table public.dishes add column if not exists thumb text
  check (thumb is null or (thumb like 'data:image/%' and length(thumb) < 150000));
alter table public.dishes drop constraint if exists dishes_img_check;
alter table public.dishes add constraint dishes_img_check
  check (img like 'data:image/%' and length(img) < 1500000);
