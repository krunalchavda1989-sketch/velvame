import { useParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import OrderDetailView from "@/components/orders/OrderDetailView";

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) return null;

  return (
    <DashboardLayout>
      <OrderDetailView orderId={id} isAdmin={false} backPath="/dashboard/orders" />
    </DashboardLayout>
  );
};

export default OrderDetail;
