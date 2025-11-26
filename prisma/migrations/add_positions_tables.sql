-- Migration pour ajouter les tables de positions
-- Date: 2024

-- Table pour les positions des sous-dossiers
CREATE TABLE IF NOT EXISTS sous_dossier_positions (
  id SERIAL PRIMARY KEY,
  rubrique_id INTEGER NOT NULL,
  sous_dossier_id INTEGER NOT NULL UNIQUE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP(6) DEFAULT NOW(),
  updated_at TIMESTAMP(6) DEFAULT NOW(),
  CONSTRAINT fk_sous_dossier_positions_rubrique 
    FOREIGN KEY (rubrique_id) 
    REFERENCES rubriques(id) 
    ON DELETE CASCADE 
    ON UPDATE NO ACTION,
  CONSTRAINT fk_sous_dossier_positions_sous_dossier 
    FOREIGN KEY (sous_dossier_id) 
    REFERENCES sous_dossiers(id) 
    ON DELETE CASCADE 
    ON UPDATE NO ACTION,
  CONSTRAINT unique_rubrique_sous_dossier 
    UNIQUE (rubrique_id, sous_dossier_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_sous_dossier_positions_rubrique 
  ON sous_dossier_positions(rubrique_id);
CREATE INDEX IF NOT EXISTS idx_sous_dossier_positions_sous_dossier 
  ON sous_dossier_positions(sous_dossier_id);
CREATE INDEX IF NOT EXISTS idx_sous_dossier_positions_position 
  ON sous_dossier_positions(rubrique_id, position);

-- Table pour les positions des pièces
CREATE TABLE IF NOT EXISTS piece_positions (
  id SERIAL PRIMARY KEY,
  sous_dossier_id INTEGER NOT NULL,
  piece_id INTEGER NOT NULL UNIQUE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP(6) DEFAULT NOW(),
  updated_at TIMESTAMP(6) DEFAULT NOW(),
  CONSTRAINT fk_piece_positions_sous_dossier 
    FOREIGN KEY (sous_dossier_id) 
    REFERENCES sous_dossiers(id) 
    ON DELETE CASCADE 
    ON UPDATE NO ACTION,
  CONSTRAINT fk_piece_positions_piece 
    FOREIGN KEY (piece_id) 
    REFERENCES pieces(id) 
    ON DELETE CASCADE 
    ON UPDATE NO ACTION,
  CONSTRAINT unique_sous_dossier_piece 
    UNIQUE (sous_dossier_id, piece_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_piece_positions_sous_dossier 
  ON piece_positions(sous_dossier_id);
CREATE INDEX IF NOT EXISTS idx_piece_positions_piece 
  ON piece_positions(piece_id);
CREATE INDEX IF NOT EXISTS idx_piece_positions_position 
  ON piece_positions(sous_dossier_id, position);

