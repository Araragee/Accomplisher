create table if not exists messages (
    id text primary key,
    group_id text not null,
    author text not null,
    content text not null,
    time text not null,
    created_at timestamptz default now()
);

-- set up realtime
alter publication supabase_realtime add table messages;
