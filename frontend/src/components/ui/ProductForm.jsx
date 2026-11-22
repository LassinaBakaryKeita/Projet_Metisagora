import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export const ProductForm = ({ initialData, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        price: initialData.price !== undefined ? String(initialData.price) : '',
        stock: initialData.stock !== undefined ? String(initialData.stock) : '',
      });
    } else {
      setFormData({ name: '', description: '', price: '', stock: '' });
    }
  }, [initialData]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Le nom du produit est requis';
    if (!formData.description.trim()) errs.description = 'La description est requise';
    if (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0) {
      errs.price = 'Veuillez saisir un prix positif valide';
    }
    if (formData.stock === '' || isNaN(formData.stock) || Number(formData.stock) < 0) {
      errs.stock = 'Veuillez saisir une quantité en stock valide (0 ou plus)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      stock: parseInt(formData.stock, 10),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nom du produit */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1.5">
          Nom du Produit <span className="text-[#13F2F8]">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="ex. Samsung Galaxy A36"
          className="w-full bg-[#1A1F1F] border border-[#252629] focus:border-[#13F2F8] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition-colors"
        />
        {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1.5">
          Description <span className="text-[#13F2F8]">*</span>
        </label>
        <textarea
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Caractéristiques et détails utilisés par le chatbot WhatsApp pour répondre aux clients..."
          className="w-full bg-[#1A1F1F] border border-[#252629] focus:border-[#13F2F8] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition-colors resize-none"
        />
        {errors.description && <p className="mt-1 text-xs text-rose-400">{errors.description}</p>}
      </div>

      {/* Prix et Stock */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1.5">
            Prix (MAD) <span className="text-[#13F2F8]">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="0.00"
            className="w-full bg-[#1A1F1F] border border-[#252629] focus:border-[#13F2F8] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition-colors"
          />
          {errors.price && <p className="mt-1 text-xs text-rose-400">{errors.price}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1.5">
            Quantité en Stock <span className="text-[#13F2F8]">*</span>
          </label>
          <input
            type="number"
            step="1"
            min="0"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            placeholder="0"
            className="w-full bg-[#1A1F1F] border border-[#252629] focus:border-[#13F2F8] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition-colors"
          />
          {errors.stock && <p className="mt-1 text-xs text-rose-400">{errors.stock}</p>}
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#252629]/60">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5 cursor-pointer"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#13F2F8] hover:bg-[#279DA1] text-[#0B0F10] transition-colors shadow-[0_0_15px_rgba(19,242,248,0.2)] disabled:opacity-50 cursor-pointer"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {initialData ? 'Mettre à jour' : 'Créer le Produit'}
        </button>
      </div>
    </form>
  );
};
