-- Additive migration for the partners + resources feature.
-- Safe to run in the Supabase SQL editor: it only CREATEs two new tables and
-- their indexes/FK, and touches no existing tables or data.

CREATE TABLE IF NOT EXISTS "public"."partners" (
    "id"            UUID          NOT NULL DEFAULT gen_random_uuid(),
    "name"          TEXT          NOT NULL,
    "description"   TEXT,
    "website"       TEXT,
    "logo_url"      TEXT,
    "category"      TEXT,
    "contact_email" TEXT,
    "status"        TEXT          NOT NULL DEFAULT 'ACTIVE',
    "featured"      BOOLEAN       NOT NULL DEFAULT false,
    "created_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."resources" (
    "id"          UUID          NOT NULL DEFAULT gen_random_uuid(),
    "partner_id"  UUID,
    "title"       TEXT          NOT NULL,
    "description" TEXT,
    "url"         TEXT,
    "category"    TEXT          NOT NULL,
    "tags"        TEXT[]        NOT NULL DEFAULT ARRAY[]::TEXT[],
    "featured"    BOOLEAN       NOT NULL DEFAULT false,
    "status"      TEXT          NOT NULL DEFAULT 'PUBLISHED',
    "created_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "partners_name_idx"        ON "public"."partners"("name");
CREATE INDEX IF NOT EXISTS "partners_status_idx"      ON "public"."partners"("status");
CREATE INDEX IF NOT EXISTS "resources_partner_id_idx" ON "public"."resources"("partner_id");
CREATE INDEX IF NOT EXISTS "resources_category_idx"   ON "public"."resources"("category");
CREATE INDEX IF NOT EXISTS "resources_status_idx"     ON "public"."resources"("status");

ALTER TABLE "public"."resources"
    DROP CONSTRAINT IF EXISTS "resources_partner_id_fkey";
ALTER TABLE "public"."resources"
    ADD CONSTRAINT "resources_partner_id_fkey"
    FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Optional seed: one partner + 3 resources across categories, so the two
-- ── acceptance tests can be verified immediately (filter-by-type, and the
-- ── partner + its resources showing on the hub and partner profile).
INSERT INTO "public"."partners" ("id", "name", "description", "website", "category", "contact_email", "featured")
VALUES ('11111111-1111-1111-1111-111111111111', 'Platform Calgary', 'Calgary''s hub for tech founders — mentorship, workspace, and programs.', 'https://platformcalgary.com', 'Ecosystem', 'hello@platformcalgary.com', true)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "public"."resources" ("partner_id", "title", "description", "url", "category", "tags", "featured")
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Product Demonstration Program', 'Non-dilutive grants of up to $300K to validate and demonstrate your product in market.', 'https://example.com/pdp', 'Funding', ARRAY['Grant','Tech','Non-dilutive'], true),
  ('11111111-1111-1111-1111-111111111111', 'Founder Mentorship Network', 'Get matched with experienced operators for structured mentorship.', 'https://example.com/mentors', 'Ecosystem', ARRAY['Mentorship','Community'], false),
  ('11111111-1111-1111-1111-111111111111', 'SR&ED Filing Support', 'Guidance on claiming federal R&D tax credits.', 'https://example.com/sred', 'Tax & Grants', ARRAY['Tax Credit','R&D'], false)
ON CONFLICT DO NOTHING;
