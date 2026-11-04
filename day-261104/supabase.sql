-- 배양 접시 갤러리 테이블. Supabase > SQL Editor 에 붙여넣고 Run
create table if not exists public.dishes (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  img text not null check (img like 'data:image/%' and length(img) < 400000)
);

alter table public.dishes enable row level security;

-- 누구나 보기와 제출만 가능. 수정·삭제 정책은 만들지 않는다
create policy "dishes are public" on public.dishes for select using (true);
create policy "anyone can submit" on public.dishes for insert with check (true);

-- (2026-11-05 추가) 썸네일 칸과 원본 용량 상한은 supabase-update.sql 참고
