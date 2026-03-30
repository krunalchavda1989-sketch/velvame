import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrandProvider } from "@/contexts/BrandContext";
import { CartProvider } from "@/contexts/CartContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Shop from "./pages/Shop";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import MyTeam from "./pages/dashboard/MyTeam";
import GenealogyTree from "./pages/dashboard/GenealogyTree";
import Wallet from "./pages/dashboard/Wallet";
import Earnings from "./pages/dashboard/Earnings";
import InviteLink from "./pages/dashboard/InviteLink";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductForm from "./pages/admin/AdminProductForm";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCommissions from "./pages/admin/AdminCommissions";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminBrandSettings from "./pages/admin/AdminBrandSettings";
import AdminTitleRoadmap from "./pages/admin/AdminTitleRoadmap";
import AdminCommissionLevels from "./pages/admin/AdminCommissionLevels";
import AdminAwards from "./pages/admin/AdminAwards";
import AdminOffers from "./pages/admin/AdminOffers";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminPages from "./pages/admin/AdminPages";
import AdminLogin from "./pages/admin/AdminLogin";

import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminManualOrder from "./pages/admin/AdminManualOrder";
import AdminMenus from "./pages/admin/AdminMenus";
import AdminTestimonials from "./pages/admin/AdminTestimonials";
import AdminHeroStats from "./pages/admin/AdminHeroStats";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminGenealogyTree from "./pages/admin/AdminGenealogyTree";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQPage from "./pages/FAQ";
import Settings from "./pages/dashboard/Settings";
import MyTitle from "./pages/dashboard/MyTitle";
import RazorpaySettings from "./pages/dashboard/RazorpaySettings";
import Orders from "./pages/dashboard/Orders";
import OrderDetail from "./pages/dashboard/OrderDetail";
import Addresses from "./pages/dashboard/Addresses";
// KYC is now a tab inside Settings
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import ProductDetail from "./pages/ProductDetail";
import Offers from "./pages/Offers";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import AdminReports from "./pages/admin/AdminReports";
import AdminBulkSms from "./pages/admin/AdminBulkSms";
import AdminNewsletter from "./pages/admin/AdminNewsletter";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminSocialMedia from "./pages/admin/AdminSocialMedia";
import AdminWalletManagement from "./pages/admin/AdminWalletManagement";
import AdminFooterSettings from "./pages/admin/AdminFooterSettings";
import AdminBreadcrumbSettings from "./pages/admin/AdminBreadcrumbSettings";
import AdminContactForm from "./pages/admin/AdminContactForm";
import AdminContactSubmissions from "./pages/admin/AdminContactSubmissions";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminCustomCode from "./pages/admin/AdminCustomCode";
import AdminDefaultPlacement from "./pages/admin/AdminDefaultPlacement";
import AdminSubUsers from "./pages/admin/AdminSubUsers";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminSystemColors from "./pages/admin/AdminSystemColors";
import AdminFeaturedSections from "./pages/admin/AdminFeaturedSections";
import AdminCategorySection from "./pages/admin/AdminCategorySection";
import CustomCodeInjector from "./components/CustomCodeInjector";
import DynamicPage from "./pages/DynamicPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <BrandProvider>
          <CartProvider>
          <CustomCodeInjector />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/team"
              element={
                <ProtectedRoute>
                  <MyTeam />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/genealogy"
              element={
                <ProtectedRoute>
                  <GenealogyTree />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/wallet"
              element={
                <ProtectedRoute>
                  <Wallet />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/earnings"
              element={
                <ProtectedRoute>
                  <Earnings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/invite"
              element={
                <ProtectedRoute>
                  <InviteLink />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/title"
              element={
                <ProtectedRoute>
                  <MyTitle />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/payment"
              element={
                <ProtectedRoute>
                  <RazorpaySettings />
                </ProtectedRoute>
              }
            />
            {/* Redirect old route to /dashboard/payment */}
            <Route
              path="/dashboard/orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/orders/:id"
              element={
                <ProtectedRoute>
                  <OrderDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/addresses"
              element={
                <ProtectedRoute>
                  <Addresses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/kyc"
              element={<Navigate to="/dashboard/settings?tab=kyc" replace />}
            />
            <Route path="/admin" element={<AdminRoute><AdminOverview /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/users/:userId" element={<AdminRoute><AdminUserDetail /></AdminRoute>} />
            <Route path="/admin/genealogy" element={<AdminRoute><AdminGenealogyTree /></AdminRoute>} />
            <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
            <Route path="/admin/products/new" element={<AdminRoute><AdminProductForm /></AdminRoute>} />
            <Route path="/admin/products/:id/edit" element={<AdminRoute><AdminProductForm /></AdminRoute>} />
            <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
            <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
            <Route path="/admin/orders/:id" element={<AdminRoute><AdminOrderDetail /></AdminRoute>} />
            <Route path="/admin/commissions" element={<AdminRoute><AdminCommissions /></AdminRoute>} />
            <Route path="/admin/withdrawals" element={<AdminRoute><AdminWithdrawals /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
            <Route path="/admin/brand-settings" element={<AdminRoute><AdminBrandSettings /></AdminRoute>} />
            <Route path="/admin/system-colors" element={<AdminRoute><AdminSystemColors /></AdminRoute>} />
            <Route path="/admin/pages" element={<AdminRoute><AdminPages /></AdminRoute>} />
            <Route path="/admin/title-roadmap" element={<AdminRoute><AdminTitleRoadmap /></AdminRoute>} />
            <Route path="/admin/commission-levels" element={<AdminRoute><AdminCommissionLevels /></AdminRoute>} />
            <Route path="/admin/awards" element={<AdminRoute><AdminAwards /></AdminRoute>} />
            <Route path="/admin/offers" element={<AdminRoute><AdminOffers /></AdminRoute>} />
            <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
            <Route path="/admin/testimonials" element={<AdminRoute><AdminTestimonials /></AdminRoute>} />
            <Route path="/admin/hero-stats" element={<AdminRoute><AdminHeroStats /></AdminRoute>} />
            <Route path="/admin/login" element={<AdminLogin />} />
            
            <Route path="/admin/menus" element={<AdminRoute><AdminMenus /></AdminRoute>} />
            <Route path="/admin/transactions" element={<AdminRoute><AdminTransactions /></AdminRoute>} />
            <Route path="/admin/manual-order" element={<AdminRoute><AdminManualOrder /></AdminRoute>} />
            <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
            <Route path="/admin/bulk-sms" element={<AdminRoute><AdminBulkSms /></AdminRoute>} />
            <Route path="/admin/newsletter" element={<AdminRoute><AdminNewsletter /></AdminRoute>} />
            <Route path="/admin/announcements" element={<AdminRoute><AdminAnnouncements /></AdminRoute>} />
            <Route path="/admin/social-media" element={<AdminRoute><AdminSocialMedia /></AdminRoute>} />
            <Route path="/admin/wallet-management" element={<AdminRoute><AdminWalletManagement /></AdminRoute>} />
            <Route path="/admin/footer-settings" element={<AdminRoute><AdminFooterSettings /></AdminRoute>} />
            <Route path="/admin/breadcrumb-settings" element={<AdminRoute><AdminBreadcrumbSettings /></AdminRoute>} />
            <Route path="/admin/contact-form" element={<AdminRoute><AdminContactForm /></AdminRoute>} />
            <Route path="/admin/contact-submissions" element={<AdminRoute><AdminContactSubmissions /></AdminRoute>} />
            <Route path="/admin/banners" element={<AdminRoute><AdminBanners /></AdminRoute>} />
            <Route path="/admin/custom-code" element={<AdminRoute><AdminCustomCode /></AdminRoute>} />
            <Route path="/admin/default-placement" element={<AdminRoute><AdminDefaultPlacement /></AdminRoute>} />
            <Route path="/admin/sub-users" element={<AdminRoute><AdminSubUsers /></AdminRoute>} />
            <Route path="/admin/featured-sections" element={<AdminRoute><AdminFeaturedSections /></AdminRoute>} />
            <Route path="/admin/category-section" element={<AdminRoute><AdminCategorySection /></AdminRoute>} />
            <Route path="/admin/profile" element={<AdminRoute><AdminProfile /></AdminRoute>} />
            <Route path="/:slug" element={<DynamicPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </CartProvider>
          </BrandProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
