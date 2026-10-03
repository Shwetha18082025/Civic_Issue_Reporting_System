CREATE TABLE IF NOT EXISTS organizations (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL UNIQUE,
  type           TEXT NOT NULL CHECK (type IN ('department', 'ngo')),
  handles        TEXT[] DEFAULT '{}',
  contact_person TEXT,
  phone          TEXT,
  email          TEXT,
  ward           TEXT,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE issues
  ADD COLUMN IF NOT EXISTS assigned_org    UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_org_at TIMESTAMPTZ;

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organizations are readable" ON organizations;
CREATE POLICY "Organizations are readable"
  ON organizations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authorities manage organizations" ON organizations;
CREATE POLICY "Authorities manage organizations"
  ON organizations FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('officer', 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('officer', 'admin')));

INSERT INTO organizations (name, type, handles) VALUES
  ('Roads & Infrastructure',     'department', '{road_damage}'),
  ('Sanitation & Waste',         'department', '{garbage}'),
  ('Electrical & Street Lights', 'department', '{street_light}'),
  ('Water & Sewage',             'department', '{water_leak}'),
  ('General Administration',     'department', '{other}'),
  ('Clean City Volunteers',      'ngo',        '{garbage}'),
  ('Safe Roads Trust',           'ngo',        '{road_damage}'),
  ('Jal Seva Foundation',        'ngo',        '{water_leak}'),
  ('Bright Streets Collective',  'ngo',        '{street_light}')
ON CONFLICT (name) DO NOTHING;

SELECT name, type, handles FROM organizations ORDER BY type, name;