-- =============================================
-- スコピタちゃん データベーススキーマ
-- =============================================

-- ユーザーテーブル
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- グループテーブル
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- グループメンバーテーブル
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member' NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(group_id, user_id)
);

-- グループルール設定テーブル
CREATE TABLE group_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE UNIQUE NOT NULL,
  game_type TEXT CHECK (game_type IN ('東風', '東南')) DEFAULT '東南' NOT NULL,
  start_score INTEGER DEFAULT 25000 NOT NULL,
  return_score INTEGER DEFAULT 30000 NOT NULL,
  uma_first INTEGER DEFAULT 20 NOT NULL,
  uma_second INTEGER DEFAULT 10 NOT NULL,
  uma_third INTEGER DEFAULT -10 NOT NULL,
  uma_fourth INTEGER DEFAULT -20 NOT NULL,
  has_oka BOOLEAN DEFAULT TRUE NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 対局セッションテーブル（1日の対局まとめ）
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- セッション参加者テーブル
CREATE TABLE session_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_name TEXT,
  player_index INTEGER NOT NULL,
  CHECK (user_id IS NOT NULL OR guest_name IS NOT NULL)
);

-- 半荘テーブル
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
  game_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(session_id, game_number)
);

-- 半荘結果テーブル
CREATE TABLE game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES session_players(id) ON DELETE CASCADE NOT NULL,
  rank INTEGER CHECK (rank >= 1 AND rank <= 4) NOT NULL,
  raw_score INTEGER NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(game_id, player_id)
);

-- 役満テーブル
CREATE TABLE yakuman (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES session_players(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN (
    '国士無双', '四暗刻', '大三元', '字一色', '小四喜', '大四喜',
    '緑一色', '清老頭', '九蓮宝燈', '四槓子', '天和', '地和'
  )) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- インデックス
-- =============================================

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_game_sessions_group_id ON game_sessions(group_id);
CREATE INDEX idx_game_sessions_created_by ON game_sessions(created_by);
CREATE INDEX idx_game_sessions_date ON game_sessions(date);
CREATE INDEX idx_session_players_session_id ON session_players(session_id);
CREATE INDEX idx_session_players_user_id ON session_players(user_id);
CREATE INDEX idx_games_session_id ON games(session_id);
CREATE INDEX idx_game_results_game_id ON game_results(game_id);
CREATE INDEX idx_game_results_player_id ON game_results(player_id);
CREATE INDEX idx_yakuman_game_id ON yakuman(game_id);
CREATE INDEX idx_yakuman_player_id ON yakuman(player_id);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE yakuman ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のプロフィールを読み書きできる
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- グループメンバーはグループを閲覧できる
CREATE POLICY "Group members can view groups" ON groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

-- 認証済みユーザーはグループを作成できる
CREATE POLICY "Authenticated users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- グループ管理者はグループを更新できる
CREATE POLICY "Group admins can update groups" ON groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

-- グループメンバーはメンバー一覧を閲覧できる
CREATE POLICY "Group members can view members" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

-- 認証済みユーザーはグループに参加できる
CREATE POLICY "Users can join groups" ON group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- グループメンバーはルールを閲覧できる
CREATE POLICY "Group members can view rules" ON group_rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_rules.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- グループ管理者はルールを更新できる
CREATE POLICY "Group admins can update rules" ON group_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_rules.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

-- 対局セッションのポリシー
CREATE POLICY "Users can view own sessions" ON game_sessions
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = game_sessions.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sessions" ON game_sessions
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Session creators can update" ON game_sessions
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Session creators can delete" ON game_sessions
  FOR DELETE USING (auth.uid() = created_by);

-- セッション参加者のポリシー
CREATE POLICY "Users can view session players" ON session_players
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_sessions.id = session_players.session_id
      AND (
        game_sessions.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM group_members
          WHERE group_members.group_id = game_sessions.group_id
          AND group_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Session creators can manage players" ON session_players
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_sessions.id = session_players.session_id
      AND game_sessions.created_by = auth.uid()
    )
  );

-- 半荘のポリシー
CREATE POLICY "Users can view games" ON games
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_sessions.id = games.session_id
      AND (
        game_sessions.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM group_members
          WHERE group_members.group_id = game_sessions.group_id
          AND group_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Session creators can manage games" ON games
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_sessions.id = games.session_id
      AND game_sessions.created_by = auth.uid()
    )
  );

-- 半荘結果のポリシー
CREATE POLICY "Users can view game results" ON game_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM games
      JOIN game_sessions ON game_sessions.id = games.session_id
      WHERE games.id = game_results.game_id
      AND (
        game_sessions.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM group_members
          WHERE group_members.group_id = game_sessions.group_id
          AND group_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Session creators can manage results" ON game_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM games
      JOIN game_sessions ON game_sessions.id = games.session_id
      WHERE games.id = game_results.game_id
      AND game_sessions.created_by = auth.uid()
    )
  );

-- 役満のポリシー
CREATE POLICY "Users can view yakuman" ON yakuman
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM games
      JOIN game_sessions ON game_sessions.id = games.session_id
      WHERE games.id = yakuman.game_id
      AND (
        game_sessions.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM group_members
          WHERE group_members.group_id = game_sessions.group_id
          AND group_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Session creators can manage yakuman" ON yakuman
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM games
      JOIN game_sessions ON game_sessions.id = games.session_id
      WHERE games.id = yakuman.game_id
      AND game_sessions.created_by = auth.uid()
    )
  );

-- =============================================
-- トリガー: updated_at自動更新
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_group_rules_updated_at
  BEFORE UPDATE ON group_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- 関数: 新規ユーザー作成時にusersテーブルに追加
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- 関数: グループ作成時にルールとメンバーを追加
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_group()
RETURNS TRIGGER AS $$
BEGIN
  -- デフォルトルールを作成
  INSERT INTO group_rules (group_id)
  VALUES (NEW.id);

  -- 作成者を管理者として追加
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_group_created
  AFTER INSERT ON groups
  FOR EACH ROW EXECUTE FUNCTION handle_new_group();
