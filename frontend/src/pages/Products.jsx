
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import { productService } from '../services/productService';
import { ProductTable } from '../components/ui/ProductTable';
import { ProductForm } from '../components/ui/ProductForm';
import { Modal } from '../components/ui/Modal';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';

export const Products = () => {
  // Produits et chargement
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Recherche et pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const limit = 10;

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Notifications Toast
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });

    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }

    toastTimer.current = setTimeout(() => {
      setToast(null);
      toastTimer.current = null;
    }, 3500);
  }, []);

  // Nettoyage du timer lors du démontage du composant
  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  // Chargement des produits depuis FastAPI
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);

      const res = await productService.getProducts({
        page,
        limit,
        search: activeSearch,
      });

      // Si la page actuelle n'existe plus, revenir à une page valide
      if (page > res.totalPages) {
        setPage(res.totalPages);
        return;
      }

      setProducts(res.items);
      setTotalPages(res.totalPages);
      setTotalItems(res.total);

    } catch (err) {
      showToast(
        err.message || 'Erreur lors du chargement des produits.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [page, activeSearch, showToast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Recherche
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch(searchTerm.trim());
  };

  // Ouverture de la modal de création
  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  // Ouverture de la modal de modification
  const handleOpenEdit = (product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  // Ouverture de la modal de détails
  const handleOpenView = (product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  // Ouverture du dialogue de suppression
  const handleOpenDelete = (product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  // Création ou modification d'un produit
  const handleSaveProduct = async (formData) => {
    try {
      setActionLoading(true);

      if (selectedProduct) {
        await productService.updateProduct(
          selectedProduct.id,
          formData
        );

        showToast(
          `Produit "${formData.name}" mis à jour avec succès.`
        );
      } else {
        await productService.createProduct(formData);

        showToast(
          `Produit "${formData.name}" créé avec succès.`
        );

        // Le nouveau produit apparaît sur la première page
        setPage(1);
      }

      setIsFormOpen(false);
      setSelectedProduct(null);

      await loadProducts();

    } catch (err) {
      showToast(err.message || 'Opération échouée.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Suppression d'un produit
  const handleConfirmDelete = async () => {
    if (!selectedProduct) return;

    try {
      setActionLoading(true);

      await productService.deleteProduct(selectedProduct.id);

      showToast(
        `Produit "${selectedProduct.name}" supprimé avec succès.`
      );

      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);

      await loadProducts();

    } catch (err) {
      showToast(
        err.message || 'Impossible de supprimer le produit.',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Toast Feedback */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-sm backdrop-blur-md transition-all ${toast.type === 'success'
              ? 'bg-[#121313] border-emerald-500/40 text-emerald-400'
              : 'bg-[#121313] border-rose-500/40 text-rose-400'
            }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}

          <span>{toast.message}</span>
        </div>
      )}

      {/* Barre d'action : Recherche + Nouveau Produit */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">

        {/* Recherche */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex-1 max-w-md"
        >
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
            <Search className="w-4 h-4" />
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom ou caractéristique..."
            className="w-full bg-[#121313] border border-[#252629] focus:border-[#13F2F8] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none transition-colors"
          />
        </form>

        {/* Ajouter un produit */}
        <button
          onClick={handleOpenCreate}
          disabled={actionLoading}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#13F2F8] hover:bg-[#279DA1] text-[#0B0F10] font-semibold text-sm transition-all shadow-[0_0_15px_rgba(19,242,248,0.2)] shrink-0 cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Ajouter un Produit</span>
        </button>
      </div>

      {/* Tableau des produits */}
      <div className="bg-[#121313] border border-[#252629] rounded-2xl overflow-hidden shadow-sm">

        <ProductTable
          products={products}
          onView={handleOpenView}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          loading={loading}
        />

        {/* Pagination */}
        <div className="p-4 border-t border-[#252629]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">

          <div>
            Affichage de{' '}
            <span className="font-semibold text-white">
              {products.length}
            </span>{' '}
            sur{' '}
            <span className="font-semibold text-white">
              {totalItems}
            </span>{' '}
            produits (Page {page} sur {totalPages})
          </div>

          <div className="flex items-center gap-2">

            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors border border-white/5 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Précédent</span>
            </button>

            <span className="px-2 font-medium text-white/70">
              {page}
            </span>

            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors border border-white/5 cursor-pointer"
            >
              <span>Suivant</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

          </div>
        </div>
      </div>

      {/* Modal Création / Modification */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => !actionLoading && setIsFormOpen(false)}
        title={
          selectedProduct
            ? 'Modifier le Produit'
            : 'Ajouter un Nouveau Produit'
        }
        subtitle="Ces informations sont utilisées directement par le chatbot WhatsApp pour conseiller les acheteurs."
      >
        <ProductForm
          initialData={selectedProduct}
          onSubmit={handleSaveProduct}
          onCancel={() => setIsFormOpen(false)}
          loading={actionLoading}
        />
      </Modal>

      {/* Modal Détails du Produit */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Détails du Produit"
        subtitle="Spécifications complètes enregistrées dans le catalogue"
      >
        {selectedProduct && (
          <div className="space-y-4">

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Nom du Produit
                </span>

                <p className="text-base font-semibold text-white mt-0.5">
                  {selectedProduct.name}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Description
                </span>

                <p className="text-sm text-white/70 mt-0.5 leading-relaxed">
                  {selectedProduct.description || 'Aucune description disponible.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Prix
                  </span>

                  <p className="text-base font-bold text-[#13F2F8] mt-0.5">
                    {Number(selectedProduct.price).toLocaleString()} MAD
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Stock Actuel
                  </span>

                  <p className="text-base font-semibold text-white mt-0.5">
                    {selectedProduct.stock} unités
                  </p>
                </div>

              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>

          </div>
        )}
      </Modal>

      {/* Confirmation de suppression */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => !actionLoading && setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Supprimer le Produit"
        message={`Êtes-vous sûr de vouloir supprimer "${selectedProduct?.name}" ? Le chatbot WhatsApp cessera immédiatement de le proposer aux clients.`}
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        danger={true}
        loading={actionLoading}
      />

    </div>
  );
};
