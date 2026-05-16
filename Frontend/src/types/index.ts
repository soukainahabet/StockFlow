export type Role = "ADMIN" | "STOCK_MANAGER" | "SELLER" | "MANAGER" | "USER" | string;

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  roleName?: Role;
}

export interface CategoryResponse {
  id: number;
  name: string;
}

export interface CategoryRequest {
  name: string;
}

export interface ProductResponse {
  id: number;
  name: string;
  /** EAN-13, UPC, Code-128 ou QR — null si non renseigné. */
  barcode: string | null;
  price: number;
  /** Prix d'achat / coût unitaire — null sur les lignes legacy. */
  buyPrice: number | null;
  quantity: number;
  alertThreshold: number;
  categoryName: string;
  categoryId: number;
  lowStock: boolean;
}

export interface ProductRequest {
  name: string;
  barcode?: string | null;
  price: number;
  buyPrice: number;
  quantity: number;
  alertThreshold: number;
  categoryId: number;
}

// ---------- Analytics ----------

export interface TopProductDto {
  productId: number;
  productName: string;
  categoryName: string;
  quantitySold: number;
  salesCount: number;
  revenue: number;
}

export interface ProfitProductDto {
  productId: number;
  productName: string;
  categoryName: string;
  buyPrice: number | null;
  sellPrice: number;
  quantitySold: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number | null;
}

export interface ProfitSummaryDto {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalQuantitySold: number;
  productCount: number;
  overallMarginPercent: number | null;
  items: ProfitProductDto[];
}

export interface LigneVenteRequest {
  productId: number;
  quantite: number;
}

export interface LigneVenteResponse {
  id: number;
  productId: number;
  productName: string;
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
}

export interface VenteRequest {
  lignes: LigneVenteRequest[];
}

export interface VenteResponse {
  id: number;
  date: string;
  total: number;
  userId: number;
  userName: string;
  lignes: LigneVenteResponse[];
}

export type StockMovementType = "IN" | "OUT";

export interface StockMovementRequest {
  type: StockMovementType;
  quantity: number;
  productId: number;
}

export interface StockMovementResponse {
  id: number;
  type: StockMovementType;
  quantity: number;
  date: string;
  productName: string;
  productId: number;
  userName: string;
  userId: number;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface UserUpdateRequest {
  name?: string;
  email?: string;
  password?: string;
  roleName?: Role;
}

export interface RoleResponse {
  id: number;
  name: string;
  systemRole: boolean;
}

export interface RoleRequest {
  name: string;
}

export interface DashboardTotals {
  today: number;
  week: number;
  month: number;
  total: number;
  count: number;
  [key: string]: number | string;
}

export interface DashboardSummary {
  totalVentes: DashboardTotals;
  lowStockCount: number;
  topProducts: Array<{ productName: string; totalQuantity: number; [k: string]: unknown }>;
  recentVentes: VenteResponse[];
  [key: string]: unknown;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}

// ---------- Invoices ----------

export interface InvoiceResponse {
  id: number;
  invoiceNumber: string;
  venteId: number;
  issueDate: string;
  totalAmount: number;
  issuedByName: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
  customerPhone: string | null;
  notes: string | null;
  lignes: LigneVenteResponse[];
  hasCustomerInfo: boolean;
}

export interface InvoiceUpdateRequest {
  customerName?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
}
