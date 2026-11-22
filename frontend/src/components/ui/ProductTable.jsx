import React from 'react';
import { Eye, Edit3, Trash2, PackageOpen, AlertCircle } from 'lucide-react';

export const ProductTable = ({
  products,
  onView,
  onEdit,
  onDelete,
  loading,
}) => {
  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#13F2F8] border-t-transparent rounded-full animate-spin" />
        <span className="mt-3 text-xs text-white/50">Chargement des articles du catalogue...</span>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40">
          <PackageOpen className="w-6 h-6" />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-white">Aucun produit trouvé</h3>
        <p className="mt-1 text-xs text-white/50 max-w-sm mx-auto">
          Aucun article ne correspond à votre recherche. Ajoutez un produit ou effacez vos filtres.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[#252629] text-[11px] font-semibold uppercase tracking-wider text-white/40">
            <th className="py-3.5 px-4">Nom du Produit</th>
            <th className="py-3.5 px-4 hidden md:table-cell">Description</th>
            <th className="py-3.5 px-4">Prix</th>
            <th className="py-3.5 px-4">Stock</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#252629]/50">
          {products.map((product) => {
            const isLowStock = product.stock <= 5;
            const isOutOfStock = product.stock === 0;

            return (
              <tr
                key={product.id}
                className="hover:bg-white/[0.02] transition-colors group"
              >
                {/* Nom */}
                <td className="py-4 px-4 font-medium text-white">
                  <div className="font-semibold text-white group-hover:text-[#13F2F8] transition-colors">
                    {product.name}
                  </div>
                  <div className="text-xs text-white/40 md:hidden mt-0.5 line-clamp-1">
                    {product.description}
                  </div>
                </td>

                {/* Description */}
                <td className="py-4 px-4 text-white/60 max-w-xs truncate hidden md:table-cell">
                  {product.description}
                </td>

                {/* Prix */}
                <td className="py-4 px-4 font-semibold text-white">
                  {Number(product.price).toLocaleString()} <span className="text-xs text-white/40 font-normal">MAD</span>
                </td>

                {/* Quantité en stock */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        isOutOfStock
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : isLowStock
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {isLowStock && <AlertCircle className="w-3 h-3" />}
                      <span>{product.stock} unités</span>
                    </span>
                  </div>
                </td>

                {/* Actions */}
                <td className="py-4 px-4 text-right">
                  <div className="inline-flex items-center gap-1">
                    {onView && (
                      <button
                        onClick={() => onView(product)}
                        title="Consulter les détails"
                        className="p-1.5 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(product)}
                        title="Modifier le produit"
                        className="p-1.5 text-white/50 hover:text-[#13F2F8] hover:bg-[#13F2F8]/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(product)}
                        title="Supprimer le produit"
                        className="p-1.5 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
