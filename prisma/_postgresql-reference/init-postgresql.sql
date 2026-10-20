-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "couleur" VARCHAR(20),
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "nom_affichage" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "categorie" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilisateur_permissions" (
    "id" SERIAL NOT NULL,
    "utilisateur_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "type" VARCHAR(10) NOT NULL,
    "reason" TEXT,
    "granted_by" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilisateur_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "nom_complet" VARCHAR(255) NOT NULL,
    "role_id" INTEGER NOT NULL,
    "agent_id" INTEGER,
    "statut" VARCHAR(20) NOT NULL DEFAULT 'actif',
    "avatar" VARCHAR(500),
    "telephone" VARCHAR(50),
    "departement" VARCHAR(100),
    "derniere_connexion" TIMESTAMPTZ(6),
    "nombre_connexions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "auth_source" VARCHAR(10) NOT NULL DEFAULT 'local',
    "ldap_dn" VARCHAR(500),
    "mfa_exempt" BOOLEAN NOT NULL DEFAULT false,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(6),
    "password_updated_at" TIMESTAMPTZ(6),
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mfa_challenges" (
    "id" SERIAL NOT NULL,
    "utilisateur_id" INTEGER NOT NULL,
    "code_hash" VARCHAR(255) NOT NULL,
    "channel" VARCHAR(10) NOT NULL,
    "destination" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mfa_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" SERIAL NOT NULL,
    "utilisateur_id" INTEGER NOT NULL,
    "token_id" VARCHAR(64) NOT NULL,
    "ip_address" VARCHAR(50),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" INTEGER,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "password_history" (
    "id" SERIAL NOT NULL,
    "utilisateur_id" INTEGER NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connexion_logs" (
    "id" SERIAL NOT NULL,
    "utilisateur_id" INTEGER NOT NULL,
    "connected_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connexion_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "utilisateur_id" INTEGER NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" INTEGER,
    "description" TEXT,
    "ip_address" VARCHAR(50),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_rubriques" (
    "id" SERIAL NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "rubrique_id" INTEGER NOT NULL,

    CONSTRAINT "agent_rubriques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_dossiers" (
    "id" SERIAL NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "rubrique_id" INTEGER NOT NULL,
    "sous_dossier_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" SERIAL NOT NULL,
    "matricule" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255),
    "role" VARCHAR(50),
    "nom_complet" VARCHAR(255) NOT NULL,
    "fonction" VARCHAR(255),
    "date_naissance" DATE,
    "lieu_naissance" VARCHAR(255),
    "sexe" VARCHAR(255),
    "situation_matrimoniale" VARCHAR(50),
    "adresse" TEXT,
    "telephone" VARCHAR(50),
    "email" VARCHAR(255),
    "statut" VARCHAR(20) NOT NULL DEFAULT 'actif',
    "photo" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiabilisations" (
    "id" SERIAL NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "piece_nom" VARCHAR(255) NOT NULL,
    "statut" VARCHAR(255) NOT NULL,
    "date_update" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiabilisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "type_notif" VARCHAR(255) NOT NULL,
    "date_envoi" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "lu" BOOLEAN DEFAULT false,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rubriques" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(20) NOT NULL DEFAULT 'personnel',

    CONSTRAINT "rubriques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sous_dossiers" (
    "id" SERIAL NOT NULL,
    "rubrique_id" INTEGER NOT NULL,
    "titre" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "statut" VARCHAR(50) NOT NULL DEFAULT 'ouvert',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sous_dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sous_dossier_positions" (
    "id" SERIAL NOT NULL,
    "rubrique_id" INTEGER NOT NULL,
    "sous_dossier_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sous_dossier_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pieces" (
    "id" SERIAL NOT NULL,
    "sous_dossier_id" INTEGER NOT NULL,
    "nom" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "has_meta" BOOLEAN DEFAULT false,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pieces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "piece_positions" (
    "id" SERIAL NOT NULL,
    "sous_dossier_id" INTEGER NOT NULL,
    "piece_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "piece_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metadata_model" (
    "id" SERIAL NOT NULL,
    "piece_id" INTEGER NOT NULL,
    "obligatoire" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "libelle" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metadata_model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pieces_check" (
    "id" SERIAL NOT NULL,
    "piece_id" INTEGER NOT NULL,
    "disponible" BOOLEAN NOT NULL,
    "date_check" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agent_id" INTEGER NOT NULL,

    CONSTRAINT "pieces_check_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "piece_file" (
    "id" SERIAL NOT NULL,
    "id_piece" INTEGER NOT NULL,
    "agent_dossier_id" INTEGER,
    "file_path" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "piece_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meta_values" (
    "id" SERIAL NOT NULL,
    "meta_model_id" INTEGER NOT NULL,
    "agent_dossier_id" INTEGER,
    "valeur" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meta_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metadata_credit" (
    "id" SERIAL NOT NULL,
    "sous_dossier_id" INTEGER NOT NULL,
    "nom_meta" VARCHAR(255) NOT NULL,
    "type_meta" VARCHAR(50) NOT NULL,
    "obligatoire" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metadata_credit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meta_credit_values" (
    "id" SERIAL NOT NULL,
    "metadata_credit_id" INTEGER NOT NULL,
    "agent_dossier_id" INTEGER,
    "entry_id" INTEGER,
    "valeur" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meta_credit_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_files" (
    "id" SERIAL NOT NULL,
    "agent_dossier_id" INTEGER NOT NULL,
    "entry_id" INTEGER,
    "file_path" VARCHAR(500) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "thumbnail_path" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_dossier_entries" (
    "id" SERIAL NOT NULL,
    "agent_dossier_id" INTEGER NOT NULL,
    "label" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_dossier_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nom_key" ON "roles"("nom");

-- CreateIndex
CREATE INDEX "roles_code_idx" ON "roles"("code");

-- CreateIndex
CREATE INDEX "roles_nom_idx" ON "roles"("nom");

-- CreateIndex
CREATE INDEX "roles_is_system_idx" ON "roles"("is_system");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_code_idx" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_categorie_idx" ON "permissions"("categorie");

-- CreateIndex
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions"("role_id");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE INDEX "utilisateur_permissions_utilisateur_id_idx" ON "utilisateur_permissions"("utilisateur_id");

-- CreateIndex
CREATE INDEX "utilisateur_permissions_permission_id_idx" ON "utilisateur_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "utilisateur_permissions_type_idx" ON "utilisateur_permissions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateur_permissions_utilisateur_id_permission_id_key" ON "utilisateur_permissions"("utilisateur_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_username_key" ON "utilisateurs"("username");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_agent_id_key" ON "utilisateurs"("agent_id");

-- CreateIndex
CREATE INDEX "utilisateurs_username_idx" ON "utilisateurs"("username");

-- CreateIndex
CREATE INDEX "utilisateurs_email_idx" ON "utilisateurs"("email");

-- CreateIndex
CREATE INDEX "utilisateurs_role_id_idx" ON "utilisateurs"("role_id");

-- CreateIndex
CREATE INDEX "utilisateurs_agent_id_idx" ON "utilisateurs"("agent_id");

-- CreateIndex
CREATE INDEX "utilisateurs_statut_idx" ON "utilisateurs"("statut");

-- CreateIndex
CREATE INDEX "mfa_challenges_utilisateur_id_idx" ON "mfa_challenges"("utilisateur_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_token_id_key" ON "auth_sessions"("token_id");

-- CreateIndex
CREATE INDEX "auth_sessions_utilisateur_id_idx" ON "auth_sessions"("utilisateur_id");

-- CreateIndex
CREATE INDEX "password_history_utilisateur_id_idx" ON "password_history"("utilisateur_id");

-- CreateIndex
CREATE INDEX "connexion_logs_utilisateur_id_idx" ON "connexion_logs"("utilisateur_id");

-- CreateIndex
CREATE INDEX "connexion_logs_connected_at_idx" ON "connexion_logs"("connected_at");

-- CreateIndex
CREATE INDEX "audit_logs_utilisateur_id_idx" ON "audit_logs"("utilisateur_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_idx" ON "audit_logs"("entity_type");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "agent_dossiers_agent_id_idx" ON "agent_dossiers"("agent_id");

-- CreateIndex
CREATE INDEX "agent_dossiers_rubrique_id_idx" ON "agent_dossiers"("rubrique_id");

-- CreateIndex
CREATE INDEX "agent_dossiers_sous_dossier_id_idx" ON "agent_dossiers"("sous_dossier_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_dossiers_agent_id_rubrique_id_sous_dossier_id_key" ON "agent_dossiers"("agent_id", "rubrique_id", "sous_dossier_id");

-- CreateIndex
CREATE UNIQUE INDEX "agents_matricule_key" ON "agents"("matricule");

-- CreateIndex
CREATE INDEX "agents_matricule_idx" ON "agents"("matricule");

-- CreateIndex
CREATE INDEX "agents_nom_complet_idx" ON "agents"("nom_complet");

-- CreateIndex
CREATE INDEX "agents_statut_idx" ON "agents"("statut");

-- CreateIndex
CREATE INDEX "rubriques_type_idx" ON "rubriques"("type");

-- CreateIndex
CREATE UNIQUE INDEX "sous_dossier_positions_sous_dossier_id_key" ON "sous_dossier_positions"("sous_dossier_id");

-- CreateIndex
CREATE INDEX "sous_dossier_positions_rubrique_id_idx" ON "sous_dossier_positions"("rubrique_id");

-- CreateIndex
CREATE INDEX "sous_dossier_positions_sous_dossier_id_idx" ON "sous_dossier_positions"("sous_dossier_id");

-- CreateIndex
CREATE UNIQUE INDEX "sous_dossier_positions_rubrique_id_sous_dossier_id_key" ON "sous_dossier_positions"("rubrique_id", "sous_dossier_id");

-- CreateIndex
CREATE UNIQUE INDEX "piece_positions_piece_id_key" ON "piece_positions"("piece_id");

-- CreateIndex
CREATE INDEX "piece_positions_sous_dossier_id_idx" ON "piece_positions"("sous_dossier_id");

-- CreateIndex
CREATE INDEX "piece_positions_piece_id_idx" ON "piece_positions"("piece_id");

-- CreateIndex
CREATE UNIQUE INDEX "piece_positions_sous_dossier_id_piece_id_key" ON "piece_positions"("sous_dossier_id", "piece_id");

-- CreateIndex
CREATE INDEX "piece_file_agent_dossier_id_idx" ON "piece_file"("agent_dossier_id");

-- CreateIndex
CREATE INDEX "meta_values_agent_dossier_id_idx" ON "meta_values"("agent_dossier_id");

-- CreateIndex
CREATE INDEX "meta_credit_values_agent_dossier_id_idx" ON "meta_credit_values"("agent_dossier_id");

-- CreateIndex
CREATE INDEX "meta_credit_values_entry_id_idx" ON "meta_credit_values"("entry_id");

-- CreateIndex
CREATE INDEX "credit_files_agent_dossier_id_idx" ON "credit_files"("agent_dossier_id");

-- CreateIndex
CREATE INDEX "credit_files_entry_id_idx" ON "credit_files"("entry_id");

-- CreateIndex
CREATE INDEX "credit_dossier_entries_agent_dossier_id_idx" ON "credit_dossier_entries"("agent_dossier_id");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilisateur_permissions" ADD CONSTRAINT "utilisateur_permissions_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilisateur_permissions" ADD CONSTRAINT "utilisateur_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilisateurs" ADD CONSTRAINT "utilisateurs_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilisateurs" ADD CONSTRAINT "utilisateurs_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mfa_challenges" ADD CONSTRAINT "mfa_challenges_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_history" ADD CONSTRAINT "password_history_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connexion_logs" ADD CONSTRAINT "connexion_logs_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_rubriques" ADD CONSTRAINT "agent_rubriques_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "agent_rubriques" ADD CONSTRAINT "agent_rubriques_rubrique_id_fkey" FOREIGN KEY ("rubrique_id") REFERENCES "rubriques"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "agent_dossiers" ADD CONSTRAINT "agent_dossiers_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "agent_dossiers" ADD CONSTRAINT "agent_dossiers_rubrique_id_fkey" FOREIGN KEY ("rubrique_id") REFERENCES "rubriques"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "agent_dossiers" ADD CONSTRAINT "agent_dossiers_sous_dossier_id_fkey" FOREIGN KEY ("sous_dossier_id") REFERENCES "sous_dossiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fiabilisations" ADD CONSTRAINT "fiabilisations_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sous_dossiers" ADD CONSTRAINT "sous_dossiers_rubrique_id_fkey" FOREIGN KEY ("rubrique_id") REFERENCES "rubriques"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sous_dossier_positions" ADD CONSTRAINT "sous_dossier_positions_sous_dossier_id_fkey" FOREIGN KEY ("sous_dossier_id") REFERENCES "sous_dossiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sous_dossier_positions" ADD CONSTRAINT "sous_dossier_positions_rubrique_id_fkey" FOREIGN KEY ("rubrique_id") REFERENCES "rubriques"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pieces" ADD CONSTRAINT "pieces_sous_dossier_id_fkey" FOREIGN KEY ("sous_dossier_id") REFERENCES "sous_dossiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "piece_positions" ADD CONSTRAINT "piece_positions_piece_id_fkey" FOREIGN KEY ("piece_id") REFERENCES "pieces"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "piece_positions" ADD CONSTRAINT "piece_positions_sous_dossier_id_fkey" FOREIGN KEY ("sous_dossier_id") REFERENCES "sous_dossiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metadata_model" ADD CONSTRAINT "metadata_model_piece_id_fkey" FOREIGN KEY ("piece_id") REFERENCES "pieces"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pieces_check" ADD CONSTRAINT "pieces_check_piece_id_fkey" FOREIGN KEY ("piece_id") REFERENCES "pieces"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pieces_check" ADD CONSTRAINT "pieces_check_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "piece_file" ADD CONSTRAINT "piece_file_id_piece_fkey" FOREIGN KEY ("id_piece") REFERENCES "pieces"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "piece_file" ADD CONSTRAINT "piece_file_agent_dossier_id_fkey" FOREIGN KEY ("agent_dossier_id") REFERENCES "agent_dossiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "meta_values" ADD CONSTRAINT "meta_values_meta_model_id_fkey" FOREIGN KEY ("meta_model_id") REFERENCES "metadata_model"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "meta_values" ADD CONSTRAINT "meta_values_agent_dossier_id_fkey" FOREIGN KEY ("agent_dossier_id") REFERENCES "agent_dossiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metadata_credit" ADD CONSTRAINT "metadata_credit_sous_dossier_id_fkey" FOREIGN KEY ("sous_dossier_id") REFERENCES "sous_dossiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "meta_credit_values" ADD CONSTRAINT "meta_credit_values_metadata_credit_id_fkey" FOREIGN KEY ("metadata_credit_id") REFERENCES "metadata_credit"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "meta_credit_values" ADD CONSTRAINT "meta_credit_values_agent_dossier_id_fkey" FOREIGN KEY ("agent_dossier_id") REFERENCES "agent_dossiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "meta_credit_values" ADD CONSTRAINT "meta_credit_values_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "credit_dossier_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "credit_files" ADD CONSTRAINT "credit_files_agent_dossier_id_fkey" FOREIGN KEY ("agent_dossier_id") REFERENCES "agent_dossiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "credit_files" ADD CONSTRAINT "credit_files_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "credit_dossier_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "credit_dossier_entries" ADD CONSTRAINT "credit_dossier_entries_agent_dossier_id_fkey" FOREIGN KEY ("agent_dossier_id") REFERENCES "agent_dossiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

