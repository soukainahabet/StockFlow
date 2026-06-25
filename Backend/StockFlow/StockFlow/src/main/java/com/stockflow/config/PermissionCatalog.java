package com.stockflow.config;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

/**
 * Single source of truth for the permission codes seeded at startup.
 * Mirror this list on the frontend by fetching {@code GET /api/permissions}.
 */
public final class PermissionCatalog {

    private PermissionCatalog() {}

    @Getter
    @AllArgsConstructor
    public static final class Entry {
        private final String code;
        private final String label;
        private final String category;
    }

    public static final List<Entry> ENTRIES = List.of(
            // Produits
            new Entry("PRODUCT_READ",     "Consulter les produits",            "Produits"),
            new Entry("PRODUCT_WRITE",    "Créer / modifier des produits",     "Produits"),
            new Entry("PRODUCT_DELETE",   "Supprimer des produits",            "Produits"),
            // Catégories
            new Entry("CATEGORY_READ",    "Consulter les catégories",          "Catégories"),
            new Entry("CATEGORY_WRITE",   "Créer / modifier des catégories",   "Catégories"),
            new Entry("CATEGORY_DELETE",  "Supprimer des catégories",          "Catégories"),
            // Stock
            new Entry("STOCK_READ",       "Consulter les mouvements",          "Stock"),
            new Entry("STOCK_WRITE",      "Enregistrer des entrées / sorties", "Stock"),
            new Entry("STOCK_DELETE",     "Supprimer des mouvements",          "Stock"),
            // Ventes
            new Entry("VENTE_READ",       "Consulter les ventes",              "Ventes"),
            new Entry("VENTE_WRITE",      "Enregistrer des ventes",            "Ventes"),
            new Entry("VENTE_DELETE",     "Supprimer des ventes",              "Ventes"),
            // Factures
            new Entry("INVOICE_READ",     "Consulter les factures",            "Factures"),
            new Entry("INVOICE_WRITE",    "Éditer les factures",               "Factures"),
            new Entry("VIEW_INVOICES",    "Voir la liste des factures",        "Factures"),
            new Entry("CREATE_INVOICE",   "Générer / éditer une facture",      "Factures"),
            new Entry("DOWNLOAD_INVOICE", "Télécharger une facture (PDF)",     "Factures"),
            // Pilotage
            new Entry("DASHBOARD_READ",   "Tableau de bord",                   "Pilotage"),
            new Entry("REPORT_READ",      "Rapports analytiques",              "Pilotage"),
            // Administration
            new Entry("USER_MANAGE",      "Gérer les utilisateurs",            "Administration"),
            new Entry("ROLE_MANAGE",      "Gérer les rôles",                   "Administration")
    );
}
