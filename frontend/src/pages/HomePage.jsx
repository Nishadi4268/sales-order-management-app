import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const columns = [
  { key: "invoiceNo", label: "Col 1" },
  { key: "invoiceDate", label: "Col 2" },
  { key: "customerName", label: "Col 3" },
  { key: "state", label: "Col 4" },
  { key: "suburb", label: "Col 5" },
  { key: "totalExcl", label: "Col 6" },
  { key: "totalIncl", label: "Col 7" }
];

function formatNumber(value) {
  return Number(value || 0).toFixed(2);
}

export default function HomePage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await api.get("/orders");
        setOrders(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  return (
    <div className="screen-frame">
      <div className="window-bar">
        <div className="window-dots">
          <span>+</span>
          <span>-</span>
          <span>x</span>
        </div>
        <h1>Home</h1>
      </div>

      <div className="toolbar">
        <button
          className="primary-btn"
          onClick={() => navigate("/sales-order")}
        >
          Add New
        </button>
      </div>

      <div className="table-wrap">
        <table className="grid-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>Loading...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7}>No records yet</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.invoiceNo || '"'}</td>
                  <td>{order.invoiceDate || '"'}</td>
                  <td>{order.customerName || '"'}</td>
                  <td>{order.state || '"'}</td>
                  <td>{order.suburb || '"'}</td>
                  <td>{formatNumber(order.totalExcl)}</td>
                  <td>{formatNumber(order.totalIncl)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
