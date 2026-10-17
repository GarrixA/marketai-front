import baseAPI from "@/utils/config/api";
import type {
  CreateProductRequest,
  MarketplaceProduct,
  ProductCategory,
  RequestSellBody,
  SellerCatalog,
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
    listSellRequests: builder.query<
      MarketplaceProduct[],
      { excludeOwn?: boolean } | void
    >({
      query: (params) => ({
        url: "/products/sell-requests",
        params: params?.excludeOwn ? { excludeOwn: "true" } : undefined,
      }),
      providesTags: [{ type: "Products", id: "SELL_REQUESTS" }],
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
    getSellerBySlug: builder.query<SellerCatalog, string>({
      query: (slug) => `/products/sellers/${encodeURIComponent(slug)}`,
      providesTags: (_result, _error, slug) => [
        { type: "Products", id: `SELLER-${slug}` },
      ],
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
    requestSell: builder.mutation<
      MarketplaceProduct,
      { id: string; body: RequestSellBody }
    >({
      query: ({ id, body }) => ({
        url: `/products/${id}/sell-request`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Products", id: "MINE" },
        { type: "Products", id: "AVAILABLE" },
        { type: "Products", id: "ALL" },
        { type: "Products", id: "SELL_REQUESTS" },
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
        { type: "Products", id: "SELL_REQUESTS" },
        { type: "Products", id },
      ],
    }),
    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({ url: `/products/${id}`, method: "DELETE" }),
      invalidatesTags: [
        { type: "Products", id: "MINE" },
        { type: "Products", id: "AVAILABLE" },
        { type: "Products", id: "ALL" },
        { type: "Products", id: "SELL_REQUESTS" },
      ],
    }),
  }),
});

export const {
  useListProductCategoriesQuery,
  useListMyProductsQuery,
  useListAllProductsQuery,
  useListSellRequestsQuery,
  useListAvailableProductsQuery,
  useGetSellerBySlugQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useRequestSellMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi;

export default productsApi;
