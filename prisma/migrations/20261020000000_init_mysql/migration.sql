-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `nom` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `couleur` VARCHAR(20) NULL,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `roles_code_key`(`code`),
    UNIQUE INDEX `roles_nom_key`(`nom`),
    INDEX `roles_code_idx`(`code`),
    INDEX `roles_nom_idx`(`nom`),
    INDEX `roles_is_system_idx`(`is_system`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(100) NOT NULL,
    `nom_affichage` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `categorie` VARCHAR(50) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `permissions_code_key`(`code`),
    INDEX `permissions_code_idx`(`code`),
    INDEX `permissions_categorie_idx`(`categorie`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_id` INTEGER NOT NULL,
    `permission_id` INTEGER NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `role_permissions_role_id_idx`(`role_id`),
    INDEX `role_permissions_permission_id_idx`(`permission_id`),
    UNIQUE INDEX `role_permissions_role_id_permission_id_key`(`role_id`, `permission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `utilisateur_permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utilisateur_id` INTEGER NOT NULL,
    `permission_id` INTEGER NOT NULL,
    `type` VARCHAR(10) NOT NULL,
    `reason` TEXT NULL,
    `granted_by` INTEGER NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `utilisateur_permissions_utilisateur_id_idx`(`utilisateur_id`),
    INDEX `utilisateur_permissions_permission_id_idx`(`permission_id`),
    INDEX `utilisateur_permissions_type_idx`(`type`),
    UNIQUE INDEX `utilisateur_permissions_utilisateur_id_permission_id_key`(`utilisateur_id`, `permission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `utilisateurs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `nom_complet` VARCHAR(255) NOT NULL,
    `role_id` INTEGER NOT NULL,
    `agent_id` INTEGER NULL,
    `statut` VARCHAR(20) NOT NULL DEFAULT 'actif',
    `avatar` VARCHAR(500) NULL,
    `telephone` VARCHAR(50) NULL,
    `departement` VARCHAR(100) NULL,
    `derniere_connexion` DATETIME(6) NULL,
    `nombre_connexions` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `created_by` INTEGER NULL,
    `auth_source` VARCHAR(10) NOT NULL DEFAULT 'local',
    `ldap_dn` VARCHAR(500) NULL,
    `mfa_exempt` BOOLEAN NOT NULL DEFAULT false,
    `failed_login_attempts` INTEGER NOT NULL DEFAULT 0,
    `locked_until` DATETIME(6) NULL,
    `password_updated_at` DATETIME(6) NULL,
    `must_change_password` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `utilisateurs_username_key`(`username`),
    UNIQUE INDEX `utilisateurs_email_key`(`email`),
    UNIQUE INDEX `utilisateurs_agent_id_key`(`agent_id`),
    INDEX `utilisateurs_username_idx`(`username`),
    INDEX `utilisateurs_email_idx`(`email`),
    INDEX `utilisateurs_role_id_idx`(`role_id`),
    INDEX `utilisateurs_agent_id_idx`(`agent_id`),
    INDEX `utilisateurs_statut_idx`(`statut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mfa_challenges` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utilisateur_id` INTEGER NOT NULL,
    `code_hash` VARCHAR(255) NOT NULL,
    `channel` VARCHAR(10) NOT NULL,
    `destination` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(6) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `consumed_at` DATETIME(6) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `mfa_challenges_utilisateur_id_idx`(`utilisateur_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auth_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utilisateur_id` INTEGER NOT NULL,
    `token_id` VARCHAR(64) NOT NULL,
    `ip_address` VARCHAR(50) NULL,
    `user_agent` VARCHAR(500) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `last_activity_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `expires_at` DATETIME(6) NOT NULL,
    `revoked_at` DATETIME(6) NULL,

    UNIQUE INDEX `auth_sessions_token_id_key`(`token_id`),
    INDEX `auth_sessions_utilisateur_id_idx`(`utilisateur_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `app_settings` (
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_by` INTEGER NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utilisateur_id` INTEGER NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `password_history_utilisateur_id_idx`(`utilisateur_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `connexion_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utilisateur_id` INTEGER NOT NULL,
    `connected_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `connexion_logs_utilisateur_id_idx`(`utilisateur_id`),
    INDEX `connexion_logs_connected_at_idx`(`connected_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utilisateur_id` INTEGER NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` INTEGER NULL,
    `description` TEXT NULL,
    `ip_address` VARCHAR(50) NULL,
    `user_agent` VARCHAR(500) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `audit_logs_utilisateur_id_idx`(`utilisateur_id`),
    INDEX `audit_logs_action_idx`(`action`),
    INDEX `audit_logs_entity_type_idx`(`entity_type`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agent_rubriques` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agent_id` INTEGER NOT NULL,
    `rubrique_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agent_dossiers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agent_id` INTEGER NOT NULL,
    `rubrique_id` INTEGER NOT NULL,
    `sous_dossier_id` INTEGER NOT NULL,
    `created_at` DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `agent_dossiers_agent_id_idx`(`agent_id`),
    INDEX `agent_dossiers_rubrique_id_idx`(`rubrique_id`),
    INDEX `agent_dossiers_sous_dossier_id_idx`(`sous_dossier_id`),
    UNIQUE INDEX `agent_dossiers_agent_id_rubrique_id_sous_dossier_id_key`(`agent_id`, `rubrique_id`, `sous_dossier_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `matricule` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NULL,
    `role` VARCHAR(50) NULL,
    `nom_complet` VARCHAR(255) NOT NULL,
    `fonction` VARCHAR(255) NULL,
    `date_naissance` DATE NULL,
    `lieu_naissance` VARCHAR(255) NULL,
    `sexe` VARCHAR(255) NULL,
    `situation_matrimoniale` VARCHAR(50) NULL,
    `adresse` VARCHAR(191) NULL,
    `telephone` VARCHAR(50) NULL,
    `email` VARCHAR(255) NULL,
    `statut` VARCHAR(20) NOT NULL DEFAULT 'actif',
    `photo` VARCHAR(500) NULL,
    `created_at` DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `agents_matricule_key`(`matricule`),
    INDEX `agents_matricule_idx`(`matricule`),
    INDEX `agents_nom_complet_idx`(`nom_complet`),
    INDEX `agents_statut_idx`(`statut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fiabilisations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agent_id` INTEGER NOT NULL,
    `piece_nom` VARCHAR(255) NOT NULL,
    `statut` VARCHAR(255) NOT NULL,
    `date_update` DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agent_id` INTEGER NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `type_notif` VARCHAR(255) NOT NULL,
    `date_envoi` DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
    `lu` BOOLEAN NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rubriques` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(255) NOT NULL,
    `description` VARCHAR(191) NULL,
    `type` VARCHAR(20) NOT NULL DEFAULT 'personnel',

    INDEX `rubriques_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sous_dossiers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rubrique_id` INTEGER NOT NULL,
    `titre` VARCHAR(255) NOT NULL,
    `description` VARCHAR(191) NULL,
    `statut` VARCHAR(50) NOT NULL DEFAULT 'ouvert',
    `created_at` DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sous_dossier_positions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rubrique_id` INTEGER NOT NULL,
    `sous_dossier_id` INTEGER NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `sous_dossier_positions_sous_dossier_id_key`(`sous_dossier_id`),
    INDEX `sous_dossier_positions_rubrique_id_idx`(`rubrique_id`),
    INDEX `sous_dossier_positions_sous_dossier_id_idx`(`sous_dossier_id`),
    UNIQUE INDEX `sous_dossier_positions_rubrique_id_sous_dossier_id_key`(`rubrique_id`, `sous_dossier_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pieces` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sous_dossier_id` INTEGER NOT NULL,
    `nom` VARCHAR(255) NOT NULL,
    `description` VARCHAR(191) NULL,
    `created_at` DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
    `has_meta` BOOLEAN NULL DEFAULT false,
    `updated_at` DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `piece_positions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sous_dossier_id` INTEGER NOT NULL,
    `piece_id` INTEGER NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `piece_positions_piece_id_key`(`piece_id`),
    INDEX `piece_positions_sous_dossier_id_idx`(`sous_dossier_id`),
    INDEX `piece_positions_piece_id_idx`(`piece_id`),
    UNIQUE INDEX `piece_positions_sous_dossier_id_piece_id_key`(`sous_dossier_id`, `piece_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `metadata_model` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `piece_id` INTEGER NOT NULL,
    `obligatoire` BOOLEAN NULL DEFAULT false,
    `created_at` DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
    `description` VARCHAR(191) NULL,
    `libelle` VARCHAR(255) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `updated_at` DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pieces_check` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `piece_id` INTEGER NOT NULL,
    `disponible` BOOLEAN NOT NULL,
    `date_check` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `agent_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `piece_file` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_piece` INTEGER NOT NULL,
    `agent_dossier_id` INTEGER NULL,
    `file_path` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `piece_file_agent_dossier_id_idx`(`agent_dossier_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meta_values` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `meta_model_id` INTEGER NOT NULL,
    `agent_dossier_id` INTEGER NULL,
    `valeur` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `meta_values_agent_dossier_id_idx`(`agent_dossier_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `metadata_credit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sous_dossier_id` INTEGER NOT NULL,
    `nom_meta` VARCHAR(255) NOT NULL,
    `type_meta` VARCHAR(50) NOT NULL,
    `obligatoire` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meta_credit_values` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `metadata_credit_id` INTEGER NOT NULL,
    `agent_dossier_id` INTEGER NULL,
    `entry_id` INTEGER NULL,
    `valeur` TEXT NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `meta_credit_values_agent_dossier_id_idx`(`agent_dossier_id`),
    INDEX `meta_credit_values_entry_id_idx`(`entry_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credit_files` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agent_dossier_id` INTEGER NOT NULL,
    `entry_id` INTEGER NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `thumbnail_path` VARCHAR(500) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `credit_files_agent_dossier_id_idx`(`agent_dossier_id`),
    INDEX `credit_files_entry_id_idx`(`entry_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credit_dossier_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agent_dossier_id` INTEGER NOT NULL,
    `label` VARCHAR(255) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `credit_dossier_entries_agent_dossier_id_idx`(`agent_dossier_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `utilisateur_permissions` ADD CONSTRAINT `utilisateur_permissions_utilisateur_id_fkey` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `utilisateur_permissions` ADD CONSTRAINT `utilisateur_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `utilisateurs` ADD CONSTRAINT `utilisateurs_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `utilisateurs` ADD CONSTRAINT `utilisateurs_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mfa_challenges` ADD CONSTRAINT `mfa_challenges_utilisateur_id_fkey` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auth_sessions` ADD CONSTRAINT `auth_sessions_utilisateur_id_fkey` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_history` ADD CONSTRAINT `password_history_utilisateur_id_fkey` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `connexion_logs` ADD CONSTRAINT `connexion_logs_utilisateur_id_fkey` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_utilisateur_id_fkey` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_rubriques` ADD CONSTRAINT `agent_rubriques_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `agent_rubriques` ADD CONSTRAINT `agent_rubriques_rubrique_id_fkey` FOREIGN KEY (`rubrique_id`) REFERENCES `rubriques`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `agent_dossiers` ADD CONSTRAINT `agent_dossiers_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `agent_dossiers` ADD CONSTRAINT `agent_dossiers_rubrique_id_fkey` FOREIGN KEY (`rubrique_id`) REFERENCES `rubriques`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `agent_dossiers` ADD CONSTRAINT `agent_dossiers_sous_dossier_id_fkey` FOREIGN KEY (`sous_dossier_id`) REFERENCES `sous_dossiers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `fiabilisations` ADD CONSTRAINT `fiabilisations_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `sous_dossiers` ADD CONSTRAINT `sous_dossiers_rubrique_id_fkey` FOREIGN KEY (`rubrique_id`) REFERENCES `rubriques`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `sous_dossier_positions` ADD CONSTRAINT `sous_dossier_positions_sous_dossier_id_fkey` FOREIGN KEY (`sous_dossier_id`) REFERENCES `sous_dossiers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `sous_dossier_positions` ADD CONSTRAINT `sous_dossier_positions_rubrique_id_fkey` FOREIGN KEY (`rubrique_id`) REFERENCES `rubriques`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `pieces` ADD CONSTRAINT `pieces_sous_dossier_id_fkey` FOREIGN KEY (`sous_dossier_id`) REFERENCES `sous_dossiers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `piece_positions` ADD CONSTRAINT `piece_positions_piece_id_fkey` FOREIGN KEY (`piece_id`) REFERENCES `pieces`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `piece_positions` ADD CONSTRAINT `piece_positions_sous_dossier_id_fkey` FOREIGN KEY (`sous_dossier_id`) REFERENCES `sous_dossiers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `metadata_model` ADD CONSTRAINT `metadata_model_piece_id_fkey` FOREIGN KEY (`piece_id`) REFERENCES `pieces`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `pieces_check` ADD CONSTRAINT `pieces_check_piece_id_fkey` FOREIGN KEY (`piece_id`) REFERENCES `pieces`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `pieces_check` ADD CONSTRAINT `pieces_check_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `piece_file` ADD CONSTRAINT `piece_file_id_piece_fkey` FOREIGN KEY (`id_piece`) REFERENCES `pieces`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `piece_file` ADD CONSTRAINT `piece_file_agent_dossier_id_fkey` FOREIGN KEY (`agent_dossier_id`) REFERENCES `agent_dossiers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `meta_values` ADD CONSTRAINT `meta_values_meta_model_id_fkey` FOREIGN KEY (`meta_model_id`) REFERENCES `metadata_model`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `meta_values` ADD CONSTRAINT `meta_values_agent_dossier_id_fkey` FOREIGN KEY (`agent_dossier_id`) REFERENCES `agent_dossiers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `metadata_credit` ADD CONSTRAINT `metadata_credit_sous_dossier_id_fkey` FOREIGN KEY (`sous_dossier_id`) REFERENCES `sous_dossiers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `meta_credit_values` ADD CONSTRAINT `meta_credit_values_metadata_credit_id_fkey` FOREIGN KEY (`metadata_credit_id`) REFERENCES `metadata_credit`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `meta_credit_values` ADD CONSTRAINT `meta_credit_values_agent_dossier_id_fkey` FOREIGN KEY (`agent_dossier_id`) REFERENCES `agent_dossiers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `meta_credit_values` ADD CONSTRAINT `meta_credit_values_entry_id_fkey` FOREIGN KEY (`entry_id`) REFERENCES `credit_dossier_entries`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `credit_files` ADD CONSTRAINT `credit_files_agent_dossier_id_fkey` FOREIGN KEY (`agent_dossier_id`) REFERENCES `agent_dossiers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `credit_files` ADD CONSTRAINT `credit_files_entry_id_fkey` FOREIGN KEY (`entry_id`) REFERENCES `credit_dossier_entries`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `credit_dossier_entries` ADD CONSTRAINT `credit_dossier_entries_agent_dossier_id_fkey` FOREIGN KEY (`agent_dossier_id`) REFERENCES `agent_dossiers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

