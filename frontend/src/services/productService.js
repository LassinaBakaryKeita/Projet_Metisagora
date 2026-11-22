
import api from './api';

// Extraction d'un message d'erreur compréhensible depuis FastAPI ou Axios
const handleApiError = (error) => {
  const detail = error.response?.data?.detail;

  let message = 'Une erreur est survenue. Veuillez réessayer.';

  if (typeof detail === 'string') {
    message = detail;
  } else if (Array.isArray(detail)) {
    message = detail
      .map((item) => item.msg || 'Donnée invalide')
      .join(', ');
  } else if (error.code === 'ECONNABORTED') {
    message = 'Le serveur met trop de temps à répondre.';
  } else if (!error.response) {
    message = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
  }

  return new Error(message);
};

export const productService = {

  // GET /api/v1/products
  // Liste, recherche et pagination
  getProducts: async ({ page = 1, limit = 10, search = '' } = {}) => {
    try {
      const response = await api.get('/products', {
        params: {
          page,
          limit,
          search: search.trim() || undefined,
        },
      });

      const data = response.data;

      return {
        items: data.items,
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: Math.max(data.total_pages, 1),
      };
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // GET /api/v1/products/:id
  getProductById: async (id) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // POST /api/v1/products
  createProduct: async (productData) => {
    try {
      const response = await api.post('/products', productData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // PUT /api/v1/products/:id
  updateProduct: async (id, productData) => {
    try {
      const response = await api.put(`/products/${id}`, productData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // DELETE /api/v1/products/:id
  deleteProduct: async (id) => {
    try {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
