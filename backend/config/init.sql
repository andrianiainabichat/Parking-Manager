-- ============================================================
-- BASE DE DONNÉES : parking_db (PostgreSQL)
-- ============================================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Fonction trigger pour updatedAt automatique
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE CLIENT
-- ============================================================
CREATE TABLE IF NOT EXISTS "CLIENT" (
  "idClient"   VARCHAR(36) PRIMARY KEY,
  "nom"        VARCHAR(100) NOT NULL,
  "sexe"       VARCHAR(1) NOT NULL CHECK ("sexe" IN ('M','F')),
  "age"        INT NOT NULL,
  "telephone"  VARCHAR(20) NOT NULL,
  "mail"       VARCHAR(150) NOT NULL UNIQUE,
  "createdAt"  TIMESTAMP DEFAULT NOW(),
  "updatedAt"  TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_client_updated
BEFORE UPDATE ON "CLIENT"
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- TABLE VOITURE
-- ============================================================
CREATE TABLE IF NOT EXISTS "VOITURE" (
  "idVoiture"  VARCHAR(36) PRIMARY KEY,
  "matricule"  VARCHAR(30) NOT NULL UNIQUE,
  "marque"     VARCHAR(80) NOT NULL,
  "couleur"    VARCHAR(50) NOT NULL,
  "type"       VARCHAR(20) NOT NULL CHECK ("type" IN ('Berline','SUV','Pickup','Citadine','Monospace','Utilitaire','Moto')),
  "idClient"   VARCHAR(36) NOT NULL REFERENCES "CLIENT"("idClient") ON DELETE CASCADE,
  "createdAt"  TIMESTAMP DEFAULT NOW(),
  "updatedAt"  TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_voiture_updated
BEFORE UPDATE ON "VOITURE"
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- TABLE PLACE_PARKING
-- ============================================================
CREATE TABLE IF NOT EXISTS "PLACE_PARKING" (
  "idPlace"     VARCHAR(36) PRIMARY KEY,
  "numeroPlace" INT NOT NULL UNIQUE,
  "etat"        VARCHAR(10) NOT NULL DEFAULT 'Libre' CHECK ("etat" IN ('Libre','Occupée')),
  "typePlace"   VARCHAR(15) NOT NULL DEFAULT 'Standard' CHECK ("typePlace" IN ('Standard','Handicapé','VIP','Moto')),
  "createdAt"   TIMESTAMP DEFAULT NOW(),
  "updatedAt"   TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_place_updated
BEFORE UPDATE ON "PLACE_PARKING"
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- TABLE TARIF
-- ============================================================
CREATE TABLE IF NOT EXISTS "TARIF" (
  "idTarif"   VARCHAR(36) PRIMARY KEY,
  "dureeMin"  INT NOT NULL,
  "dureeMax"  INT NOT NULL,
  "prix"      INT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_tarif_updated
BEFORE UPDATE ON "TARIF"
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- TABLE ENTREE
-- ============================================================
CREATE TABLE IF NOT EXISTS "ENTREE" (
  "idEntree"   VARCHAR(36) PRIMARY KEY,
  "idVoiture"  VARCHAR(36) NOT NULL REFERENCES "VOITURE"("idVoiture"),
  "idPlace"    VARCHAR(36) NOT NULL REFERENCES "PLACE_PARKING"("idPlace"),
  "dateEntree" TIMESTAMP NOT NULL DEFAULT NOW(),
  "motif"      VARCHAR(255) DEFAULT NULL,
  "createdAt"  TIMESTAMP DEFAULT NOW(),
  "updatedAt"  TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_entree_updated
BEFORE UPDATE ON "ENTREE"
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- TABLE SORTIE
-- ============================================================
CREATE TABLE IF NOT EXISTS "SORTIE" (
  "idSortie"   VARCHAR(36) PRIMARY KEY,
  "idVoiture"  VARCHAR(36) NOT NULL REFERENCES "VOITURE"("idVoiture"),
  "idPlace"    VARCHAR(36) NOT NULL REFERENCES "PLACE_PARKING"("idPlace"),
  "idEntree"   VARCHAR(36) NOT NULL REFERENCES "ENTREE"("idEntree"),
  "dateSortie" TIMESTAMP NOT NULL DEFAULT NOW(),
  "duree"      INT NOT NULL,
  "montant"    INT NOT NULL,
  "createdAt"  TIMESTAMP DEFAULT NOW(),
  "updatedAt"  TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_sortie_updated
BEFORE UPDATE ON "SORTIE"
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- DONNÉES INITIALES
-- ============================================================

INSERT INTO "TARIF" ("idTarif","dureeMin","dureeMax","prix") VALUES
  ('tarif-001', 0,   60,  2000),
  ('tarif-002', 61,  180, 5000),
  ('tarif-003', 181, 360, 10000),
  ('tarif-004', 361, 480, 15000),
  ('tarif-005', 481, 720, 20000),
  ('tarif-006', 721, 1440,30000)
ON CONFLICT DO NOTHING;

INSERT INTO "PLACE_PARKING" ("idPlace","numeroPlace","etat","typePlace") VALUES
  ('place-001', 1,  'Libre','Standard'),
  ('place-002', 2,  'Libre','Standard'),
  ('place-003', 3,  'Libre','Standard'),
  ('place-004', 4,  'Libre','Standard'),
  ('place-005', 5,  'Libre','Standard'),
  ('place-006', 6,  'Libre','Standard'),
  ('place-007', 7,  'Libre','Standard'),
  ('place-008', 8,  'Libre','Standard'),
  ('place-009', 9,  'Libre','Standard'),
  ('place-010', 10, 'Libre','Standard'),
  ('place-011', 11, 'Libre','Handicapé'),
  ('place-012', 12, 'Libre','Handicapé'),
  ('place-013', 13, 'Libre','VIP'),
  ('place-014', 14, 'Libre','VIP'),
  ('place-015', 15, 'Libre','VIP'),
  ('place-016', 16, 'Libre','Moto'),
  ('place-017', 17, 'Libre','Moto'),
  ('place-018', 18, 'Libre','Moto'),
  ('place-019', 19, 'Libre','Standard'),
  ('place-020', 20, 'Libre','Standard')
ON CONFLICT DO NOTHING;

INSERT INTO "CLIENT" ("idClient","nom","sexe","age","telephone","mail") VALUES
  ('client-001','RAKOTO Bernard','M',35,'0324432167','rakoto.bernard@email.mg'),
  ('client-002','RABE Yvonne','F',28,'0331234567','rabe.yvonne@email.mg'),
  ('client-003','RASOA Marie','F',42,'0347654321','rasoa.marie@email.mg')
ON CONFLICT DO NOTHING;

INSERT INTO "VOITURE" ("idVoiture","matricule","marque","couleur","type","idClient") VALUES
  ('voiture-001','1234 TAA','Toyota','Blanc','Berline','client-001'),
  ('voiture-002','5678 TBB','Renault','Gris','SUV','client-002'),
  ('voiture-003','9012 TCC','Honda','Noir','Citadine','client-003')
ON CONFLICT DO NOTHING;

-- ============================================================
-- TABLE USER (authentification)
-- ============================================================
CREATE TABLE IF NOT EXISTS "USER" (
  "idUser"       VARCHAR(36) PRIMARY KEY,
  "nom"          VARCHAR(100) NOT NULL,
  "email"        VARCHAR(150) NOT NULL UNIQUE,
  "password"     VARCHAR(255) NOT NULL,
  "role"         VARCHAR(20) NOT NULL DEFAULT 'agent' CHECK ("role" IN ('admin','agent')),
  "resetToken"   VARCHAR(255) DEFAULT NULL,
  "resetExpires" TIMESTAMP DEFAULT NULL,
  "createdAt"    TIMESTAMP DEFAULT NOW(),
  "updatedAt"    TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_user_updated
BEFORE UPDATE ON "USER"
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
