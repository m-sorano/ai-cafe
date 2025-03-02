-- profiles テーブルに updated_at カラムが存在するか確認し、なければ追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;
