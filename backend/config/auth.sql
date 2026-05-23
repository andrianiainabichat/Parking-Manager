-- Table utilisateurs pour l'authentification
CREATE TABLE IF NOT EXISTS "USER" (
  "idUser"        VARCHAR(36) PRIMARY KEY,
  "nom"           VARCHAR(100) NOT NULL,
  "email"         VARCHAR(150) NOT NULL UNIQUE,
  "password"      VARCHAR(255) NOT NULL,
  "role"          VARCHAR(20) NOT NULL DEFAULT 'agent' CHECK ("role" IN ('admin','agent')),
  "resetToken"    VARCHAR(255) DEFAULT NULL,
  "resetExpires"  TIMESTAMP DEFAULT NULL,
  "createdAt"     TIMESTAMP DEFAULT NOW(),
  "updatedAt"     TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_user_updated
BEFORE UPDATE ON "USER"
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
