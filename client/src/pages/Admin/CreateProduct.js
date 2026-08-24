import React, { useEffect, useState } from "react";
import AdminMenu from "../../components/Layout/AdminMenu";
import toast from "react-hot-toast";
import axios from "axios";
import { Card, Col, Row, Select, ColorPicker, Button, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import { FaEyeDropper } from "react-icons/fa6";

const { Option } = Select;

const CreateProduct = () => {
  const navigate = useNavigate();

  // State
  const [categories, setCategories] = useState([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");

  const [category, setCategory] = useState("");
  const [dimensions, setDimensions] = useState({ height: "", width: "" });
  const [sizes, setSizes] = useState([]);
  const [sizeInput, setSizeInput] = useState("");

  const [shipping, setShipping] = useState(undefined);
  const [shippingCost, setShippingCost] = useState("");

  // Multiple Images
  const [photo, setPhoto] = useState([]);

  // Colors
  const [color, setColor] = useState("#1677ff");
  const [colorQuantity, setColorQuantity] = useState(0);
  const [colors, setColors] = useState([]);

  // Fetch Categories
  const getAllCategory = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API}/api/v1/category/get-category`,
      );

      if (data?.success) {
        setCategories(data.category);
      }
    } catch (error) {
      console.log(error);
      toast.error("Unable to load categories");
    }
  };

  useEffect(() => {
    getAllCategory();
  }, []);

  // Add Color
  const addColor = () => {
    if (!colors.some((entry) => entry.color === color)) {
      setColors([...colors, { color, quantity: Number(colorQuantity) || 0 }]);
    }
  };

  // Remove Color
  const removeColor = (selectedColor) => {
    setColors(colors.filter((entry) => entry.color !== selectedColor));
  };

  const selectedCategory = categories.find((entry) => entry._id === category);
  const sizeType = selectedCategory?.sizeType || "none";

  const addSize = () => {
    const nextSize = sizeInput.trim().toUpperCase();
    if (nextSize && !sizes.includes(nextSize)) {
      setSizes([...sizes, nextSize]);
      setSizeInput("");
    }
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

  // Create Product
  const handleCreate = async (e) => {
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
      productData.append("sizes", JSON.stringify(sizeType === "apparel" ? sizes : []));
      productData.append("dimensions", JSON.stringify(sizeType === "dimensions" ? dimensions : {}));

      // Append Multiple Images
      photo.forEach((file) => {
        productData.append("photos", file);
      });

      const { data } = await axios.post(
        `${process.env.REACT_APP_API}/api/v1/product/create-product`,
        productData,
      );

      if (data.success) {
        toast.success(data.message);

        // Reset Form
        setName("");
        setDescription("");
        setPrice("");
        setDiscount("");
        setCategory("");
        setDimensions({ height: "", width: "" });
        setSizes([]);
        setSizeInput("");
        setShipping(undefined);
        setShippingCost("");
        setPhoto([]);
        setColors([]);
        setColor("#1677ff");

        navigate("/dashboard/admin/products");
      } else {
        toast.error(data.message);
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
          <Card title="📦 Create Product" className="dashboard-cards">
            <div className="m-1 w-75">
              {/* Category */}
              <Select
                variant="borderless"
                placeholder="Select Category"
                size="large"
                showSearch
                className="form-control mb-3"
                onChange={(value) => {
                  setCategory(value);
                  setDimensions({ height: "", width: "" });
                  setSizes([]);
                }}
              >
                {categories?.map((c) => (
                  <Option key={c._id} value={c._id}>
                    {c.name}
                  </Option>
                ))}
              </Select>

              <div className="text-muted mb-2">
                Size type: {sizeType === "dimensions" ? "Height and width" : sizeType === "apparel" ? "Dress sizes" : "No sizes"}
              </div>

              {sizeType === "dimensions" && (
                <div className="mb-3 d-flex gap-2">
                  <input type="number" min="0" className="form-control" placeholder="Height" value={dimensions.height} onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })} />
                  <input type="number" min="0" className="form-control" placeholder="Width" value={dimensions.width} onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })} />
                </div>
              )}

              {sizeType === "apparel" && (
                <div className="mb-3">
                  <div className="d-flex gap-2 align-items-center">
                    <input className="form-control" placeholder="Enter size (S, M, L, XL)" value={sizeInput} onChange={(e) => setSizeInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSize())} />
                    <button className="btn btn-outline-success btn-sm text-nowrap" onClick={addSize}>Add Size</button>
                  </div>
                  <div className="mt-2">
                    {sizes.map((size) => <Tag key={size} color={"magenta"} variant={"outlined"} className="me-3" closable onClose={() => setSizes(sizes.filter((entry) => entry !== size))}>{size}</Tag>)}
                  </div>
                </div>
              )}

              {/* Product Name */}
              <div className="mb-3">
                <input
                  type="text"
                  value={name}
                  placeholder="Product Name"
                  className="form-control"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="mb-3">
                <textarea
                  rows={4}
                  value={description}
                  placeholder="Description"
                  className="form-control"
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Price */}
              <div className="mb-3">
                <input
                  type="number"
                  value={price}
                  placeholder="Price"
                  className="form-control"
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              {/* Discount */}
              <div className="mb-3">
                <input
                  type="number"
                  value={discount}
                  placeholder="Discount (%)"
                  className="form-control"
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
                  {photo.length > 0
                    ? `${photo.length} Image(s) Selected`
                    : "Upload Product Images"}

                  <input
                    type="file"
                    name="photos"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => setPhoto(Array.from(e.target.files))}
                  />
                </label>
              </div>

              {/* Image Preview */}
              <div className="mb-3">
                {photo.length > 0 && (
                  <div className="d-flex flex-wrap gap-3">
                    {photo.map((img, index) => (
                      <div key={index}>
                        <img
                          src={URL.createObjectURL(img)}
                          alt={`preview-${index}`}
                          width={150}
                          height={150}
                          style={{
                            objectFit: "cover",
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                          }}
                        />
                      </div>
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

              {/* Submit */}
              <div className="mb-3">
                <button className="btn btn-primary" onClick={handleCreate}>
                  Create Product
                </button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CreateProduct;
