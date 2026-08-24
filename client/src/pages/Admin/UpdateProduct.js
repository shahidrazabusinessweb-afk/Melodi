import React, { useEffect, useState } from "react";
import AdminMenu from "../../components/Layout/AdminMenu";
import { Button, Card, Col, ColorPicker, Row, Select, Tag } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FaEyeDropper } from "react-icons/fa6";

const { Option } = Select;

const UpdateProduct = () => {
  const navigate = useNavigate();
  const params = useParams();

  // =======================
  // State
  // =======================

  const [categories, setCategories] = useState([]);

  const [id, setId] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");

  const [category, setCategory] = useState("");

  const [shipping, setShipping] = useState(false);
  const [shippingCost, setShippingCost] = useState("");

  // Newly selected images
  const [photos, setPhotos] = useState([]);

  // Existing Cloudinary images
  const [existingPhotos, setExistingPhotos] = useState([]);

  // Colors
  const [color, setColor] = useState("#1677ff");
  const [colorQuantity, setColorQuantity] = useState(0);
  const [colors, setColors] = useState([]);

  // =======================
  // Load Categories
  // =======================

  const getAllCategory = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API}/api/v1/category/get-category`,
      );

      if (data.success) {
        setCategories(data.category);
      }
    } catch (error) {
      console.log(error);
      toast.error("Unable to load categories");
    }
  };

  // =======================
  // Load Product
  // =======================

  const getSingleProduct = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API}/api/v1/product/get-product/${params.slug}`,
      );

      const product = data.product;

      setId(product._id);

      setName(product.name);
      setDescription(product.description);
      setPrice(product.price);
      setDiscount(product.discount);

      setCategory(product.category._id);

      setShipping(product.shipping);
      setShippingCost(product.shippingCost || "");

      setColors(
        (product.colors || []).map((entry) =>
          typeof entry === "string"
            ? { color: entry, quantity: 0 }
            : { color: entry.color, quantity: entry.quantity ?? 0 },
        ),
      );

      // Cloudinary images
      setExistingPhotos(product.photos || []);
    } catch (error) {
      console.log(error);
      toast.error("Unable to load product");
    }
  };

  useEffect(() => {
    getAllCategory();
    getSingleProduct();
    // eslint-disable-next-line
  }, []);

  // =======================
  // Color Functions
  // =======================

  const addColor = () => {
    if (!colors.some((entry) => entry.color === color)) {
      setColors([...colors, { color, quantity: Number(colorQuantity) || 0 }]);
    }
  };

  const removeColor = (selectedColor) => {
    setColors(colors.filter((entry) => entry.color !== selectedColor));
  };

  const pickColor = async () => {
    if (!window.EyeDropper) {
      toast.error("Eye dropper is not supported by this browser");
      return;
    }

    try {
      const eyeDropper = new window.EyeDropper();
      const { sRGBHex } = await eyeDropper.open();
      setColor(sRGBHex);
    } catch (error) {
      if (error.name !== "AbortError") {
        toast.error("Unable to pick a color");
      }
    }
  };

  // =======================
  // Update Product
  // =======================

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const productData = new FormData();

      productData.append("name", name);
      productData.append("description", description);
      productData.append("price", price);
      productData.append("discount", discount);
      productData.append("category", category);
      productData.append("shipping", shipping);
      productData.append("shippingCost", shippingCost);
      productData.append("colors", JSON.stringify(colors));

      // Upload multiple images
      photos.forEach((file) => {
        productData.append("photos", file);
      });

      const { data } = await axios.put(
        `${process.env.REACT_APP_API}/api/v1/product/update-product/${id}`,
        productData,
      );

      if (data.success) {
        toast.success("Product Updated Successfully");
        navigate("/dashboard/admin/products");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  // =======================
  // Delete Product
  // =======================

  const handleDelete = async () => {
    try {
      const { data } = await axios.delete(
        `${process.env.REACT_APP_API}/api/v1/product/delete-product/${id}`,
      );

      if (data.success) {
        toast.success(data.message);
        navigate("/dashboard/admin/products");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="container-fluid">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <AdminMenu />
        </Col>

        <Col xs={24} md={18} className="dashboard-content">
          <Card title="📦 Update Product" className="dashboard-cards">
            <div className="m-1 w-75">
              {/* Category */}
              <Select
                variant="borderless"
                placeholder="Select Category"
                size="large"
                showSearch
                className="form-control mb-3"
                value={category}
                onChange={(value) => setCategory(value)}
              >
                {categories.map((c) => (
                  <Option key={c._id} value={c._id}>
                    {c.name}
                  </Option>
                ))}
              </Select>


              {/* Product Name */}
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Product Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="mb-3">
                <textarea
                  rows={4}
                  className="form-control"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Price */}
              <div className="mb-3">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              {/* Discount */}
              <div className="mb-3">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Discount (%)"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>

              {/* Shipping */}
              <div className="mb-3 d-flex align-items-center">
                <Select
                  value={shipping}
                  size="large"
                  placeholder="Shipping Available?"
                  className="form-control w-50"
                  onChange={(value) => setShipping(value)}
                  options={[
                    {
                      value: false,
                      label: "No",
                    },
                    {
                      value: true,
                      label: "Yes",
                    },
                  ]}
                />

                {shipping === true && (
                  <div className="ms-3 w-50">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Shipping Cost"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(e.target.value)}
                    />
                  </div>
                )}
              </div>


                 {/* Upload Images */}
              <div className="mb-3">
                <label className="btn btn-outline-secondary col-md-12">
                  {photos.length > 0
                    ? `${photos.length} Image(s) Selected`
                    : "Upload New Product Images"}

                  <input
                    type="file"
                    name="photos"
                    multiple
                    accept="image/*"
                    hidden
                    onChange={(e) => setPhotos(Array.from(e.target.files))}
                  />
                </label>
              </div>

              {/* Preview */}
              <div className="mb-4">
                {photos.length > 0 ? (
                  <div className="d-flex flex-wrap gap-3">
                    {photos.map((image, index) => (
                      <img
                        key={index}
                        src={URL.createObjectURL(image)}
                        alt={`preview-${index}`}
                        width={150}
                        height={150}
                        style={{
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid #ddd",
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="d-flex flex-wrap gap-3">
                    {existingPhotos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo.url}
                        alt={`product-${index}`}
                        width={150}
                        height={150}
                        style={{
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid #ddd",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Colors */}

              <div className="mb-3">
                <h6>Available Colors</h6>

                <div className="d-flex align-items-center gap-2">
                  <ColorPicker
                    value={color}
                    onChange={(value) => setColor(value.toHexString())}
                  />

                  <Button
                    type="default"
                    icon={<FaEyeDropper />}
                    aria-label="Pick color from screen"
                    title="Pick color from screen"
                    onClick={pickColor}
                  />

                  <span>Quantity</span>

                  <input
                    type="number"
                    min="0"
                    value={colorQuantity}
                    onChange={(e) => setColorQuantity(e.target.value)}
                    className="form-control"
                    style={{ width: 100 }}
                  />

                  <Button onClick={addColor}>Add Color</Button>
                </div>

                <div className="mt-3">
                  {colors.map(({ color: selectedColor, quantity }) => (
                    <Tag
                      key={selectedColor}
                      closable
                      onClose={() => removeColor(selectedColor)}
                      style={{
                        background: selectedColor,
                        color: "#fff",
                        border: "none",
                        margin: 5,
                      }}
                    >
                      {selectedColor} ({quantity})
                    </Tag>
                  ))}
                </div>
              </div>

              {/* Buttons */}

              <div className="d-flex gap-3">
                <button className="btn btn-primary" onClick={handleUpdate}>
                  Update Product
                </button>

                <button className="btn btn-danger" onClick={handleDelete}>
                  Delete Product
                </button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UpdateProduct;
