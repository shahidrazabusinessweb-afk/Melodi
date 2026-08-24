import { Modal, Table, Button, Space, Card, Popconfirm, Row, Col } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

import CategoryForm from "../../components/Form/CategoryForm";
import AdminMenu from "../../components/Layout/AdminMenu";
import Loader from "../../components/UI/Loader";

const CreateCategory = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [sizeType, setSizeType] = useState("none");
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const [updatedName, setUpdatedName] = useState("");
  const [updatedBrandName, setUpdatedBrandName] = useState("");
  const [updatedSizeType, setUpdatedSizeType] = useState("none");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [updatedImage, setUpdatedImage] = useState(null);

  // Get All Categories
  const getAllCategory = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(
        `${process.env.REACT_APP_API}/api/v1/category/get-category`,
      );

      if (data?.success) {
        setCategories(data.category);
      }
    } catch (error) {
      toast.error("Can't get categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllCategory();
  }, []);

  // Create Category
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const categoryData = new FormData();

      categoryData.append("name", name);
      categoryData.append("brandName", brandName);
      categoryData.append("sizeType", sizeType);

      if (image) {
        categoryData.append("image", image);
      }

      const { data } = await axios.post(
        `${process.env.REACT_APP_API}/api/v1/category/create-category`,
        categoryData,
      );

      if (data.success) {
        toast.success("Category created");
        setName("");
        setBrandName("");
        setSizeType("none");
        setImage(null);
        getAllCategory();
      }
    } catch (error) {
      toast.error("Error creating category");
    }
  };

  // Update Category
  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const categoryData = new FormData();

      categoryData.append("name", updatedName);
      categoryData.append("brandName", updatedBrandName);
      categoryData.append("sizeType", updatedSizeType);

      if (updatedImage) {
        categoryData.append("image", updatedImage);
      }

      const { data } = await axios.put(
        `${process.env.REACT_APP_API}/api/v1/category/update-category/${selected._id}`,
        categoryData,
      );

      if (data.success) {
        toast.success("Category updated");
        setVisible(false);
        setUpdatedImage(null);
        setUpdatedBrandName("");
        getAllCategory();
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  // Delete Category
  const handleDelete = async (id) => {
    try {
      const { data } = await axios.delete(
        `${process.env.REACT_APP_API}/api/v1/category/delete-category/${id}`,
      );

      if (data.success) {
        toast.success("Category deleted");
        getAllCategory();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  // Table Columns
  const columns = [
    {
      title: "#",
      key: "index",
      width: 70,
      responsive: ["md"],
      render: (_, __, index) => index + 1,
    },
    {
      title: "Image",
      key: "image",
      width: 50,
      render: (_, record) => (
        <img
          src={`${process.env.REACT_APP_API}/api/v1/category/category-photo/${record._id}?v=${record.updatedAt}`}
          alt={record.name}
          style={{
            width: 60,
            height: 60,
            objectFit: "cover",
            borderRadius: 8,
          }}
        />
      ),
    },
    {
      title: "Category Name",
      dataIndex: "name",
      key: "name",
      width: 100,
    },
    {
      title: "Brand Name",
      dataIndex: "brandName",
      key: "brandName",
      width: 100,
      render: (value) => value || "-",
    },
    {
      title: "Size Type",
      dataIndex: "sizeType",
      key: "sizeType",
      width: 150,
      render: (value) =>
        value === "dimensions"
          ? "Height and width"
          : value === "apparel"
            ? "Dress sizes"
            : "No sizes",
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space wrap>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setVisible(true);
              setSelected(record);
              setUpdatedName(record.name);
              setUpdatedBrandName(record.brandName || "");
              setUpdatedSizeType(record.sizeType || "none");
              setUpdatedImage(null);
            }}
          >
            Edit
          </Button>

          <Popconfirm
            title="Delete Category"
            description="Are you sure you want to delete this category?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="container-fluid">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <AdminMenu />
        </Col>

        <Col xs={24} md={18}>
          <Card title="📂 Manage Categories">
            <div className="mb-3">
              <label className="btn btn-outline-secondary w-100">
                {image ? image.name : "Upload Image"}

                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                />
              </label>
            </div>

            {image && (
              <div className="text-center mb-3">
                <img
                  src={URL.createObjectURL(image)}
                  alt="preview"
                  style={{
                    width: "100%",
                    maxWidth: "250px",
                    height: "auto",
                    borderRadius: "8px",
                  }}
                />
              </div>
            )}

            <CategoryForm
              handleSubmit={handleSubmit}
              value={name}
              setValue={setName}
              brandName={brandName}
              setBrandName={setBrandName}
              sizeType={sizeType}
              setSizeType={setSizeType}
            />
          </Card>

          {/* Categories Table */}
          <Card className="mt-3">
            {loading ? (
              <Loader />
            ) : (
              <Table
                rowKey="_id"
                columns={columns}
                dataSource={categories}
                scroll={{ x: 700 }}
                pagination={{
                  pageSize: 8,
                  showSizeChanger: false,
                }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Edit Modal */}
      <Modal
        open={visible}
        footer={null}
        onCancel={() => {
          setVisible(false);
          setUpdatedImage(null);
        }}
        width={window.innerWidth < 768 ? "95%" : 520}
        centered
      >
        <div className="mb-3">
          <label className="btn btn-outline-secondary w-100">
            {updatedImage?.name || "Upload Image"}

            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => setUpdatedImage(e.target.files[0])}
            />
          </label>
        </div>

        {updatedImage && (
          <div className="text-center mb-3">
            <img
              src={URL.createObjectURL(updatedImage)}
              alt="preview"
              style={{
                width: "100%",
                maxWidth: "250px",
                height: "auto",
                borderRadius: "8px",
              }}
            />
          </div>
        )}

        <CategoryForm
          value={updatedName}
          setValue={setUpdatedName}
          brandName={updatedBrandName}
          setBrandName={setUpdatedBrandName}
          sizeType={updatedSizeType}
          setSizeType={setUpdatedSizeType}
          handleSubmit={handleUpdate}
          editForm
        />
      </Modal>
    </div>
  );
};

export default CreateCategory;
