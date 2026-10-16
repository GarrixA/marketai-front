import baseAPI from "@/utils/config/api";
import type {
  CreateProductRequest,
  MarketplaceProduct,
  ProductCategory,
  UpdateProductRequest,
} from "@/types/product";

const productsApi = baseAPI.injectEndpoints({
  endpoints: (builder) => ({
    listProductCategories: builder.query<ProductCategory[], void>({
      query: () => "/products/categories",
      providesTags: [{ type: "Products", id: "CATEGORIES" }],
    }),
    listMyProducts: builder.query<MarketplaceProduct[], void>({
      query: () => "/products/mine",
      providesTags: [{ type: "Products", id: "MINE" }],
    }),
    listAllProducts: builder.query<MarketplaceProduct[], void>({
      query: () => "/products/all",
      providesTags: [{ type: "Products", id: "ALL" }],
    }),
    listAvailableProducts: builder.query<
      MarketplaceProduct[],
      { excludeOwn?: boolean } | void
    >({
      query: (params) => ({
        url: "/products",
        params: params?.excludeOwn ? { excludeOwn: "true" } : undefined,
      }),
      providesTags: [{ type: "Products", id: "AVAILABLE" }],
    }),
    getProduct: builder.query<MarketplaceProduct, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Products", id }],
    }),
    createProduct: builder.mutation<MarketplaceProduct, CreateProductRequest>({
      query: (body) => ({ url: "/products", method: "POST", body }),
      invalidatesTags: [
        { type: "Products", id: "MINE" },
        { type: "Products", id: "AVAILABLE" },
        { type: "Products", id: "ALL" },
      ],
    }),
    updateProduct: builder.mutation<
      MarketplaceProduct,
      { id: string; body: UpdateProductRequest }
    >({
      query: ({ id, body }) => ({
        url: `/products/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Products", id: "MINE" },
        { type: "Products", id: "AVAILABLE" },
        { type: "Products", id: "ALL" },
        { type: "Products", id },
      ],
    }),
    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({ url: `/products/${id}`, method: "DELETE" }),
      invalidatesTags: [
        { type: "Products", id: "MINE" },
        { type: "Products", id: "AVAILABLE" },
        { type: "Products", id: "ALL" },
      ],
    }),
  }),
});

export const {
  useListProductCategoriesQuery,
  useListMyProductsQuery,
  useListAllProductsQuery,
  useListAvailableProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi;

export default productsApi;
