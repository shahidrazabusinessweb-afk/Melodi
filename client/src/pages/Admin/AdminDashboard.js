import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  Col,
  Row,
  Statistic,
  Button,
  Switch,
  message,
  Upload,
} from "antd";
import { Column } from "@ant-design/plots";

import AdminMenu from "../../components/Layout/AdminMenu";
import { useAuth } from "../../context/auth";
import { UploadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [auth] = useAuth();

  const navigate = useNavigate();

  // Sales
  const [salesData, setSalesData] = useState([]);
  const [totalSales, setTotalSales] = useState(0);

  // Banner
  const [bannerFile, setBannerFile] = useState(null);
  const [title, setTitle] = useState("");
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  // ================= SALES =================

  const getMonthlySales = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API}/api/v1/auth/monthly-sales`,
      );

      if (data?.success) {
        setSalesData(data.sales);

        const total = data.sales.reduce((sum, item) => sum + item.sales, 0);

        setTotalSales(total);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ================= BANNERS =================

  const getBanners = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API}/api/v1/banner/banners`,
      );

      if (data?.success) {
        setBanners(data.banners);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const uploadBanner = async () => {
    try {
      if (!bannerFile) {
        message.error("Please select an image");
        return;
      }

      setLoading(true);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("image", bannerFile);

      const { data } = await axios.post(
        `${process.env.REACT_APP_API}/api/v1/banner/upload-banner`,
        formData,
      );

      if (!data?.success) {
        message.error(data?.message || "Upload failed");
        return;
      }

      message.success("Banner uploaded successfully");

      setBannerFile(null);
      setFileList([]);
      setTitle("");

      getBanners();
    } catch (error) {
      console.log("UPLOAD ERROR:", error);
      message.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const deleteBanner = async (id) => {
    try {
      const { data } = await axios.delete(
        `${process.env.REACT_APP_API}/api/v1/banner/delete-banner/${id}`,
      );

      if (data?.success) {
        message.success("Banner deleted");
        getBanners();
      }
    } catch (error) {
      console.log(error);
      message.error("Delete failed");
    }
  };

  const toggleBanner = async (id) => {
    try {
      const { data } = await axios.put(
        `${process.env.REACT_APP_API}/api/v1/banner/toggle-banner/${id}`,
      );

      if (data?.success) {
        getBanners();
      }
    } catch (error) {
      console.log(error);
      message.error("Update failed");
    }
  };

  const getWhatsappNumber = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API}/api/v1/settings/whatsapp`,
      );

      if (data?.success) {
        setWhatsappNumber(data.whatsappNumber || "");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const saveWhatsappNumber = async () => {
    try {
      setSavingWhatsapp(true);

      const { data } = await axios.put(
        `${process.env.REACT_APP_API}/api/v1/settings/whatsapp`,
        { whatsappNumber },
      );

      if (data?.success) {
        setWhatsappNumber(data.whatsappNumber);
        message.success("WhatsApp number updated");
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Update failed");
    } finally {
      setSavingWhatsapp(false);
    }
  };

  // ================= EFFECT =================

  useEffect(() => {
    if (auth?.token) {
      getMonthlySales();
      getBanners();
      getWhatsappNumber();
    }
  }, [auth?.token]);

  // ================= CHART =================

  const config = {
    data: salesData,
    xField: "month",
    yField: "sales",
    label: {
      position: "top",
    },
  };

  return (
    <div className="container-fluid">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <AdminMenu />
        </Col>

        <Col xs={24} md={18}>
          {/* Admin Info */}
          <Card title="Admin Dashboard">
            <div className="d-flex justify-content-lg-between flex-column flex-md-row align-items-md-center">
              <div className="mb-2">
                <h5 className="text-muted">Admin Name : {auth?.user?.name}</h5>

                <h5 className="text-muted">
                  Admin Email : {auth?.user?.email}
                </h5>

                <h5 className="text-muted">
                  Admin Contact : {auth?.user?.phone}
                </h5>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => navigate("/dashboard/user/profile")}
              >
                Edit
              </button>
            </div>
          </Card>

          <Card title="Chat Support" style={{ marginTop: 20 }}>
            <div className="d-flex flex-column flex-md-row align-items-md-end gap-2 ">
              <div className="flex-grow-1">
                <label htmlFor="whatsapp-number" className="form-label">
                  Admin WhatsApp Number
                </label>
                <input
                  id="whatsapp-number"
                  type="tel"
                  className="form-control"
                  placeholder="91XXXXXXXXXX"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                />
              </div>
              <Button
                type="primary"
                loading={savingWhatsapp}
                onClick={saveWhatsappNumber}
              >
                Save Number
              </Button>
            </div>
          </Card>

          {/* Banner Management */}
          <Card title="Banner Management" style={{ marginTop: 20 }}>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Banner Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <Upload
              accept="image/*"
              fileList={fileList}
              beforeUpload={(file) => {
                setBannerFile(file);
                setFileList([file]); // show in UI
                return false;
              }}
              onRemove={() => {
                setBannerFile(null);
                setFileList([]);
              }}
            >
              <Button icon={<UploadOutlined />}>Select Banner Image</Button>
            </Upload>

            {bannerFile && (
              <div className="mt-3">
                <img
                  src={URL.createObjectURL(bannerFile)}
                  alt="preview"
                  style={{
                    width: "300px",
                    maxWidth: "100%",
                    borderRadius: "10px",
                  }}
                />
              </div>
            )}

            <Button
              type="primary"
              loading={loading}
              className="mt-3"
              onClick={uploadBanner}
            >
              Upload Banner
            </Button>

            <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
              {banners.map((banner) => (
                <Col xs={24} sm={12} lg={8} key={banner._id}>
                  <Card hoverable>
                    <img
                      src={banner.image}
                      alt={banner.title}
                      style={{
                        width: "100%",
                        height: "180px",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />

                    <h6
                      style={{
                        marginTop: 10,
                        minHeight: 40,
                      }}
                    >
                      {banner.title || "Untitled Banner"}
                    </h6>

                    <div className="d-flex justify-content-between align-items-center">
                      <Switch
                        checked={banner.isActive}
                        onChange={() => toggleBanner(banner._id)}
                        className="mx-2"
                      />

                      <Button danger onClick={() => deleteBanner(banner._id)}>
                        Delete
                      </Button>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>

          {/* Sales */}
          <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
            <Col xs={24} md={12}>
              <Card>
                <Statistic
                  title="Total Delivered Sales"
                  value={totalSales}
                  prefix="₹"
                />
              </Card>
            </Col>
          </Row>

          <Card title="Monthly Sales Report" style={{ marginTop: 20 }}>
            <Column {...config} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
