import { useEffect, useState } from "react";
import api from "../api/api";
import "../styles/InventoryManager.css";

function InventoryManager() {
  const [variants, setVariants] = useState([]);
  const [threshold, setThreshold] = useState(5);

  useEffect(() => {
    fetchLowStock();
  }, [threshold]);

  const fetchLowStock = async () => {
    try {
      const res = await api.get(`/api/admin/alerts/low-stock?threshold=${threshold}`);
      setVariants(res.data);
    } catch (err) {
      console.error("Error fetching low stock alerts", err);
    }
  };

  return (
    <div className="inventory-manager">
      <h2>Inventory Manager</h2>

      <label>
        Threshold:
        <input
          type="number"
          value={threshold}
          min="1"
          onChange={(e) => setThreshold(parseInt(e.target.value))}
        />
      </label>

      {variants.length === 0 ? (
        <p>No variants below threshold.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Color</th>
              <th>Size</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => (
              <tr key={v.id}>
                <td>{v.sku}</td>
                <td>{v.color}</td>
                <td>{v.size}</td>
                <td>{v.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default InventoryManager;
