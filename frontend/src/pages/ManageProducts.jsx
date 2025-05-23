import React, { useEffect, useState } from "react";
import api from "../api/api";
import "../styles/ManageProducts.css";

function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(defaultForm());
  const [editingId, setEditingId] = useState(null);
  const [imagePreview, setImagePreview] = useState([]);
  const [variants, setVariants] = useState({});
  const [variantForms, setVariantForms] = useState({});
  const [activeVariantForm, setActiveVariantForm] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(null);
  const [visibleCount, setVisibleCount] = useState(3);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  function defaultForm() {
    return { name: "", sku: "", description: "", category: "T-Shirts", image_url: "" };
  }

  async function fetchProducts() {
    const res = await api.get("/api/admin/products");
    const productList = res.data.items || [];
    setProducts(productList);
    for (const p of productList) fetchVariants(p.id);
  }

  function handleChange(evt) {
    const { name, value } = evt.target;
    setFormData((f) => ({ ...f, [name]: value }));
  }

  function handleImageChange(evt) {
    const { value } = evt.target;
    setFormData((f) => ({ ...f, image_url: value }));
    setImagePreview([value]);
  }

  async function handleSubmit(evt) {
    evt.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/products/${editingId}`, formData);
      } else {
        await api.post("/api/admin/products", formData);
      }
      cancelEdit();
      fetchProducts();
      setErrorMessage("");
    } catch (err) {
      if (err.response?.data?.error?.includes("unique constraint")) {
        setErrorMessage("A product with this SKU already exists.");
      } else {
        setErrorMessage("Failed to save product. Please try again.");
      }
    }
  }

  function handleEdit(p) {
    setFormData({ name: p.name, sku: p.sku, description: p.description, category: p.category, image_url: p.image_url });
    setImagePreview(p.image_url ? [p.image_url] : []);
    setEditingId(p.id);
    setShowProductModal(true);
    setErrorMessage("");
  }

  function cancelEdit() {
    setFormData(defaultForm());
    setImagePreview([]);
    setEditingId(null);
    setShowProductModal(false);
    setErrorMessage("");
  }

  async function handleDisable(p) {
    const action = p.is_active ? "disable" : "enable";
    await api.patch(`/api/admin/products/${p.id}/${action}`);
    fetchProducts();
  }

  function initVariantForm(productId) {
    setVariantForms((f) => ({
      ...f,
      [productId]: { id: null, sku: "", size: "", color: "", price: "", quantity: "", image_url: "" }
    }));
  }

  async function fetchVariants(productId) {
    const res = await api.get(`/api/admin/products/${productId}/variants`);
    setVariants((v) => ({ ...v, [productId]: res.data }));
    if (!variantForms[productId]) initVariantForm(productId);
  }

  async function handleVariantSubmit(evt, productId) {
    evt.preventDefault();
    const v = variantForms[productId];
    try {
      if (v.id) {
        await api.put(`/api/admin/variants/${v.id}`, v);
      } else {
        await api.post(`/api/admin/products/${productId}/variants`, v);
      }
      cancelVariantEdit(productId);
      fetchVariants(productId);
      setErrorMessage("");
    } catch (err) {
      if (err.response?.data?.error?.includes("unique constraint")) {
        setErrorMessage("A variant with this SKU already exists.");
      } else {
        setErrorMessage("Failed to save variant. Please try again.");
      }
    }
  }

  function handleAddVariant(productId) {
    initVariantForm(productId);
    setActiveVariantForm(productId);
    setShowVariantModal(productId);
    setErrorMessage("");
  }

  function cancelVariantEdit(productId) {
    initVariantForm(productId);
    setActiveVariantForm(null);
    setShowVariantModal(null);
    setErrorMessage("");
  }

  function handleVariantChange(evt, productId) {
    const { name, value } = evt.target;
    setVariantForms((f) => ({ ...f, [productId]: { ...f[productId], [name]: value } }));
  }

  async function handleEditVariant(productId, variant) {
    setVariantForms((f) => ({ ...f, [productId]: { ...variant } }));
    setActiveVariantForm(productId);
    setShowVariantModal(productId);
    setErrorMessage("");
  }

  async function handleToggleVariant(productId, variant) {
    const action = variant.is_active ? "disable" : "enable";
    await api.patch(`/api/admin/products/${productId}/variants/${variant.id}/${action}`);
    fetchVariants(productId);
  }

  const filteredProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase();
    const status = p.is_active ? "active" : "disabled";
    const variantMatches = variants[p.id]?.some(
      (v) =>
        v.sku?.toLowerCase().includes(query) ||
        v.color?.toLowerCase().includes(query) ||
        v.size?.toLowerCase().includes(query)
    );
    return (
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      status.includes(query) ||
      variantMatches
    );
  });

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  return (
    <div className="manage-products">
      <h2>Manage Products</h2>

      <button className="open-modal" onClick={() => setShowProductModal(true)}>Add Product</button>

      <input
        className="search-input"
        type="text"
        placeholder="Search by name, SKU, color, size..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {showProductModal && (
        <div className="modal-overlay">
          <form onSubmit={handleSubmit} className="modal">
            <h3>{editingId ? "Edit Product" : "Add Product"}</h3>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            <input name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
            <input name="sku" placeholder="SKU" value={formData.sku} onChange={handleChange} required />
            <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} />
            <select name="category" value={formData.category} onChange={handleChange}>
              <option>T-Shirts</option>
              <option>Tank Tops</option>
              <option>Sweatshirts</option>
              <option>Beach Towels</option>
              <option>Tumblers</option>
              <option>Totes</option>
              <option>Accessories</option>
            </select>
            <input name="image_url" placeholder="Image URL" value={formData.image_url} onChange={handleImageChange} />
            {imagePreview.map((url, i) => (
              <img key={i} src={url} alt="preview" className="image-preview" />
            ))}
            <div className="modal-buttons">
              <button type="submit">{editingId ? "Update" : "Add"}</button>
              <button type="button" onClick={cancelEdit}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {visibleProducts.map((p) => (
        <div key={p.id} className="product-card">
          <div className="product-info-row">
            <div>
              <h3>{p.name} <span className="sku">({p.sku})</span></h3>
              <p>{p.description}</p>
              <p>Category: {p.category}</p>
              <p>Status: {p.is_active ? "Active" : "Disabled"}</p>
              <div className="product-buttons-inline">
                <button onClick={() => handleEdit(p)}>Edit</button>
                <button onClick={() => handleDisable(p)}>{p.is_active ? "Disable" : "Enable"}</button>
              </div>
            </div>

            {p.image_url && (
              <img src={p.image_url} alt="product" className="main-product-image" />
            )}

          </div>

          <div className="variants-header">
            <h4>Variants</h4>
            <button className="add-variant-button" onClick={() => handleAddVariant(p.id)}>Add Variant</button>
          </div>

          <div className="variant-list">
            {(variants[p.id] || []).map((v) => (
              <div key={`${p.id}-${v.id}`} className="variant-item">
                <div className="variant-info">
                  {v.sku} | {v.size} | {v.color} | ${v.price} | Qty: {v.quantity} | {v.is_active ? "Active" : "Disabled"}
                </div>
                <div className="variant-buttons">
                  <button onClick={() => handleEditVariant(p.id, v)}>Edit</button>
                  <button onClick={() => handleToggleVariant(p.id, v)}>{v.is_active ? "Disable" : "Enable"}</button>
                </div>
              </div>
            ))}
          </div>

          {showVariantModal === p.id && (
            <div className="modal-overlay">
              <form onSubmit={(e) => handleVariantSubmit(e, p.id)} className="modal">
                <h3>{variantForms[p.id]?.id ? "Edit Variant" : "Add Variant"}</h3>
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                <input name="sku" placeholder="SKU" value={variantForms[p.id]?.sku || ""} onChange={(e) => handleVariantChange(e, p.id)} />
                <input name="size" placeholder="Size" value={variantForms[p.id]?.size || ""} onChange={(e) => handleVariantChange(e, p.id)} />
                <input name="color" placeholder="Color" value={variantForms[p.id]?.color || ""} onChange={(e) => handleVariantChange(e, p.id)} />
                <input name="quantity" placeholder="Qty" type="number" value={variantForms[p.id]?.quantity || ""} onChange={(e) => handleVariantChange(e, p.id)} />
                <input name="price" placeholder="Price" type="number" value={variantForms[p.id]?.price || ""} onChange={(e) => handleVariantChange(e, p.id)} />
                <input name="image_url" placeholder="Image URL" value={variantForms[p.id]?.image_url || ""} onChange={(e) => handleVariantChange(e, p.id)} />
                {variantForms[p.id]?.image_url && <img src={variantForms[p.id].image_url} alt="variant preview" className="image-preview" />}
                <div className="modal-buttons">
                  <button type="submit">{variantForms[p.id]?.id ? "Update" : "Add"}</button>
                  <button type="button" onClick={() => cancelVariantEdit(p.id)}>Cancel</button>
                </div>
              </form>
            </div>
          )}
        </div>
      ))}

      <div className="load-more-wrapper">
        {visibleCount < filteredProducts.length && (
          <button className="load-more-button" onClick={() => setVisibleCount(visibleCount + 3)}>Load More</button>
        )}
        {visibleCount > 3 && (
          <button className="load-more-button" onClick={() => setVisibleCount(3)}>Show Less</button>
        )}
      </div>
    </div>
  );
}

export default ManageProducts;
