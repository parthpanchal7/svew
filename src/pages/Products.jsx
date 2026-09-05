/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Products({ role }) {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [description, setDescription] = useState("");
  const [rate, setRate] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [unit, setUnit] = useState("Pcs");
  const [itemNote, setItemNote] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    description: "",
    rate: "",
    hsn_code: "",
    unit: "Pcs",
    item_note: "",
  });

  const fetchProducts = async () => {
    // Try fetching from products table first
    const { data, error } = await supabase.from("products").select("*").order("description", { ascending: true });
    
    if (!error && data) {
      setProducts(data);
      return;
    }

    // Fallback to invoice_items history if products table doesn't exist yet
    const { data: itemData } = await supabase
      .from("invoice_items")
      .select("id, description, rate, item_note")
      .not("description", "is", null);

    if (itemData) {
      const productMap = new Map();
      itemData.forEach((item) => {
        const name = item.description?.trim();
        if (name && !productMap.has(name.toLowerCase())) {
          productMap.set(name.toLowerCase(), {
            id: item.id,
            description: name,
            rate: item.rate || 0,
            hsn_code: "-",
            unit: "Pcs",
            item_note: item.item_note || "",
            isHistoryFallback: true
          });
        }
      });
      setProducts(Array.from(productMap.values()));
    }
  };

  useEffect(() => {
    if (role) fetchProducts();
  }, [role]);

  const handleAddProduct = async (event) => {
    event.preventDefault();
    if (!description.trim()) return alert("Product description is required.");

    const { error } = await supabase.from("products").insert([
      {
        description: description.trim(),
        rate: Number(rate) || 0,
        hsn_code: hsnCode.trim() || null,
        unit: unit || "Pcs",
        item_note: itemNote.trim() || null,
      },
    ]);

    if (error) {
      alert("Error adding product: " + error.message);
      return;
    }

    setDescription("");
    setRate("");
    setHsnCode("");
    setUnit("Pcs");
    setItemNote("");
    fetchProducts();
  };

  const startEdit = (prod) => {
    setEditingId(prod.id);
    setEditForm({
      description: prod.description || "",
      rate: prod.rate || 0,
      hsn_code: prod.hsn_code || "",
      unit: prod.unit || "Pcs",
      item_note: prod.item_note || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id) => {
    const { error } = await supabase
      .from("products")
      .update({
        description: editForm.description.trim(),
        rate: Number(editForm.rate) || 0,
        hsn_code: editForm.hsn_code.trim() || null,
        unit: editForm.unit || "Pcs",
        item_note: editForm.item_note.trim() || null,
      })
      .eq("id", id);

    if (error) {
      alert("Error updating product: " + error.message);
      return;
    }

    setEditingId(null);
    fetchProducts();
  };

  const handleDelete = async (prod) => {
    if (!window.confirm(`Delete product "${prod.description}"?`)) return;

    if (prod.isHistoryFallback) {
      alert("This item is from past invoice history. To manage master products, run the SQL script to create the 'products' table in Supabase.");
      return;
    }

    const { error } = await supabase.from("products").delete().eq("id", prod.id);
    if (error) return alert(error.message);
    fetchProducts();
  };

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.description?.toLowerCase().includes(q) ||
      p.hsn_code?.toLowerCase().includes(q) ||
      p.item_note?.toLowerCase().includes(q)
    );
  });

  return (
    <section className="page-card">
      <h2 className="page-title">Products & Inventory Master</h2>
      <p className="muted">Manage standard product descriptions, HSN codes, default units, and prices.</p>

      {/* ADD PRODUCT FORM */}
      <form onSubmit={handleAddProduct} className="grid-2" style={{ marginBottom: "2rem", background: "#f8fafd", padding: "1.2rem", borderRadius: "12px", border: "1px solid #eef2f7" }}>
        <h3 style={{ gridColumn: "1 / -1", margin: 0, fontSize: "1.05rem", color: "var(--brand)" }}>Add New Product</h3>

        <div className="field">
          <label>Product Name / Description *</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Hydraulic Valve Assembly"
            required
          />
        </div>

        <div className="field">
          <label>Standard Rate (₹)</label>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="field">
          <label>HSN / SAC Code</label>
          <input
            value={hsnCode}
            onChange={(e) => setHsnCode(e.target.value)}
            placeholder="e.g. 8481"
          />
        </div>

        <div className="field">
          <label>Unit of Measure</label>
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="Pcs">Pcs (Pieces)</option>
            <option value="Nos">Nos (Numbers)</option>
            <option value="Kg">Kg (Kilograms)</option>
            <option value="Mtr">Mtr (Meters)</option>
            <option value="Set">Set</option>
            <option value="Box">Box</option>
          </select>
        </div>

        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Item Note / Sub-description (Optional)</label>
          <input
            value={itemNote}
            onChange={(e) => setItemNote(e.target.value)}
            placeholder="e.g. Grade A High Pressure Steel"
          />
        </div>

        <button style={{ gridColumn: "1 / -1", justifySelf: "start" }} type="submit">
          Add Product to Master
        </button>
      </form>

      {/* SEARCH BAR */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products by name, HSN, or notes..."
          style={{ width: "100%", maxWidth: "400px" }}
        />
      </div>

      {/* PRODUCTS TABLE */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>HSN Code</th>
              <th>Unit</th>
              <th className="num">Standard Rate</th>
              <th>Note</th>
              <th colSpan={2}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "#888", padding: "1.5rem" }}>
                  No products found. Add a product above or create invoices to build history.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const isEditing = editingId === p.id;
                return (
                  <tr key={p.id}>
                    <td>
                      {isEditing ? (
                        <input
                          value={editForm.description}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                        />
                      ) : (
                        <strong>{p.description}</strong>
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <input
                          value={editForm.hsn_code}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, hsn_code: e.target.value }))}
                        />
                      ) : (
                        p.hsn_code || "-"
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <select
                          value={editForm.unit}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, unit: e.target.value }))}
                        >
                          <option value="Pcs">Pcs</option>
                          <option value="Nos">Nos</option>
                          <option value="Kg">Kg</option>
                          <option value="Mtr">Mtr</option>
                          <option value="Set">Set</option>
                          <option value="Box">Box</option>
                        </select>
                      ) : (
                        p.unit || "Pcs"
                      )}
                    </td>

                    <td className="num">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.rate}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, rate: e.target.value }))}
                        />
                      ) : (
                        `₹ ${Number(p.rate || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <input
                          value={editForm.item_note}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, item_note: e.target.value }))}
                        />
                      ) : (
                        <span className="muted" style={{ fontSize: "0.85rem" }}>{p.item_note || "-"}</span>
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <button className="primary" onClick={() => handleSaveEdit(p.id)} style={{ padding: "4px 8px", fontSize: "0.8rem" }}>
                          Save
                        </button>
                      ) : (
                        <button className="secondary" onClick={() => startEdit(p)} style={{ padding: "4px 8px", fontSize: "0.8rem" }}>
                          Edit
                        </button>
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <button className="secondary" onClick={cancelEdit} style={{ padding: "4px 8px", fontSize: "0.8rem" }}>
                          Cancel
                        </button>
                      ) : (
                        <button
                          className="secondary"
                          onClick={() => handleDelete(p)}
                          style={{ padding: "4px 8px", fontSize: "0.8rem", color: "#fa5252", background: "#ffe3e3", borderColor: "transparent" }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
