import { useParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import OrderDetailView from "@/components/orders/OrderDetailView";

const AdminOrderDetail = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) return null;

  return (
    <AdminLayout>
      <OrderDetailView orderId={id} isAdmin={true} backPath="/admin/orders" />
    </AdminLayout>
  );
};

export default AdminOrderDetail;
