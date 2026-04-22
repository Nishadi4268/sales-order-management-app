import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const defaultRow = {
  itemCode: "",
  description: "",
  note: "",
  quantity: "",
  price: "",
  taxRate: ""
};

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function computeLine(item) {
  const quantity = toNumber(item.quantity);
  const price = toNumber(item.price);
  const taxRate = toNumber(item.taxRate);

  const exclAmount = quantity * price;
  const taxAmount = exclAmount * (taxRate / 100);
  const inclAmount = exclAmount + taxAmount;

  return { exclAmount, taxAmount, inclAmount };
}

function fmt(value) {
  return Number(value || 0).toFixed(2);
}

export default function SalesOrderPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [form, setForm] = useState({
    customerName: "",
    address1: "",
    address2: "",
    address3: "",
    suburb: "",
    state: "",
    postCode: "",
    invoiceNo: "",
    invoiceDate: "",
    referenceNo: "",
    note: "",
    items: [
      { ...defaultRow },
      { ...defaultRow },
      { ...defaultRow },
      { ...defaultRow }
    ]
  });

  useEffect(() => {
    async function loadClients() {
      try {
        const response = await api.get("/clients");
        setClients(response.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingClients(false);
      }
    }

    loadClients();
  }, []);

  const totals = useMemo(() => {
    return form.items.reduce(
      (acc, item) => {
        const line = computeLine(item);
        acc.excl += line.exclAmount;
        acc.tax += line.taxAmount;
        acc.incl += line.inclAmount;
        return acc;
      },
      { excl: 0, tax: 0, incl: 0 }
    );
  }, [form.items]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateItem(index, key, value) {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [key]: value };
      return { ...prev, items };
    });
  }

  function handleCustomerChange(customerName) {
    const selectedClient = clients.find(
      (client) => client.customerName === customerName
    );

    setForm((prev) => ({
      ...prev,
      customerName,
      address1: selectedClient?.address1 || "",
      address2: selectedClient?.address2 || "",
      address3: selectedClient?.address3 || "",
      suburb: selectedClient?.suburb || "",
      state: selectedClient?.state || "",
      postCode: selectedClient?.postCode || ""
    }));
  }

  async function onSave() {
    if (!form.customerName) {
      alert("Please select a customer name");
      return;
    }

    setSaving(true);
    try {
      await api.post("/orders", form);
      navigate("/");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save order");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen-frame wide">
      <div className="window-bar">
        <div className="window-dots">
          <span>+</span>
          <span>-</span>
          <span>x</span>
        </div>
        <h1>Sales Order</h1>
      </div>

      <div className="toolbar">
        <button className="primary-btn" onClick={onSave} disabled={saving}>
          {saving ? "Saving..." : "Save Order"}
        </button>
      </div>

      <div className="sales-form">
        <div className="left-col">
          <label>Customer Name</label>
          <select
            value={form.customerName}
            onChange={(e) => handleCustomerChange(e.target.value)}
            disabled={loadingClients}
          >
            <option value="">
              {loadingClients ? "Loading..." : "Select customer"}
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.customerName}>
                {client.customerName}
              </option>
            ))}
          </select>
          <label>Address 1</label>
          <input
            value={form.address1}
            onChange={(e) => updateField("address1", e.target.value)}
          />
          <label>Address 2</label>
          <input
            value={form.address2}
            onChange={(e) => updateField("address2", e.target.value)}
          />
          <label>Address 3</label>
          <input
            value={form.address3}
            onChange={(e) => updateField("address3", e.target.value)}
          />
          <label>Suburb</label>
          <input
            value={form.suburb}
            onChange={(e) => updateField("suburb", e.target.value)}
          />
          <label>State</label>
          <input
            value={form.state}
            onChange={(e) => updateField("state", e.target.value)}
          />
          <label>Post Code</label>
          <input
            value={form.postCode}
            onChange={(e) => updateField("postCode", e.target.value)}
          />
        </div>

        <div className="right-col">
          <label>Invoice No.</label>
          <input
            value={form.invoiceNo}
            onChange={(e) => updateField("invoiceNo", e.target.value)}
          />
          <label>Invoice Date</label>
          <input
            value={form.invoiceDate}
            onChange={(e) => updateField("invoiceDate", e.target.value)}
          />
          <label>Reference no</label>
          <input
            value={form.referenceNo}
            onChange={(e) => updateField("referenceNo", e.target.value)}
          />
          <label>Note</label>
          <textarea
            value={form.note}
            onChange={(e) => updateField("note", e.target.value)}
            rows={5}
          />
        </div>
      </div>

      <table className="grid-table compact">
        <thead>
          <tr>
            <th>Item Code</th>
            <th>Description</th>
            <th>Note</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Tax</th>
            <th>Excl Amount</th>
            <th>Tax Amount</th>
            <th>Incl Amount</th>
          </tr>
        </thead>
        <tbody>
          {form.items.map((row, index) => {
            const line = computeLine(row);
            return (
              <tr key={index}>
                <td>
                  <input
                    value={row.itemCode}
                    onChange={(e) =>
                      updateItem(index, "itemCode", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    value={row.description}
                    onChange={(e) =>
                      updateItem(index, "description", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    value={row.note}
                    onChange={(e) => updateItem(index, "note", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={row.quantity}
                    onChange={(e) =>
                      updateItem(index, "quantity", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    value={row.price}
                    onChange={(e) => updateItem(index, "price", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={row.taxRate}
                    onChange={(e) =>
                      updateItem(index, "taxRate", e.target.value)
                    }
                  />
                </td>
                <td>{fmt(line.exclAmount)}</td>
                <td>{fmt(line.taxAmount)}</td>
                <td>{fmt(line.inclAmount)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="totals">
        <label>Total Excl</label>
        <input value={fmt(totals.excl)} readOnly />
        <label>Total Tax</label>
        <input value={fmt(totals.tax)} readOnly />
        <label>Total Incl</label>
        <input value={fmt(totals.incl)} readOnly />
      </div>
    </div>
  );
}
