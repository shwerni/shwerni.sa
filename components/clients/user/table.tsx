import {
  Consultant,
  Order,
  Payment,
  PaymentState,
} from "@/lib/generated/prisma/client";
import { findPayment } from "@/utils";

type OrderWithRelations = Order & {
  consultant: Consultant;
  payment: Payment | null;
};

export function OrderTable({ orders }: { orders: OrderWithRelations[] }) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="p-3">رقم الطلب</th>
              <th className="p-3">اسم المستشار</th>
              <th className="p-3">التاريخ</th>
              <th className="p-3">الساعة</th>
              <th className="p-3">المبلغ</th>
              <th className="p-3">الحالة</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => {
              const date = new Date(order.due_at);

              return (
                <tr
                  key={order.id}
                  className="border-t hover:bg-muted/30 transition"
                >
                  <td className="p-3">#{order.oid}</td>
                  <td className="p-3">{order.consultant.name}</td>
                  <td className="p-3">{date.toLocaleDateString("ar-EG")}</td>
                  <td className="p-3">
                    {date.toLocaleTimeString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="p-3">{order.payment?.total ?? 0} ر.س</td>
                  <td className="p-3">
                    <StatusBadge state={order.payment?.payment} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="hidden space-y-3 p-3">
        {orders.map((order) => (
          <div key={order.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span>#{order.oid}</span>
              <StatusBadge state={order.payment?.payment} />
            </div>
            <div>{order.consultant.name}</div>
            <div className="text-sm text-muted-foreground">
              {new Date(order.due_at).toLocaleString("ar-EG")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ state }: { state?: PaymentState }) {
  if (!state) return;
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs ${findPayment(state)?.style}`}
    >
      {findPayment(state)?.label}
    </span>
  );
}
