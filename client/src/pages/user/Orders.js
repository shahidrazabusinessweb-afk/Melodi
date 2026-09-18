import React, { useEffect, useState } from "react";
import UserMenu from "../../components/Layout/UserMenu";
import axios from "axios";
import { useAuth } from "../../context/auth";
import moment from "moment";
import Loader from "../../components/UI/Loader";

import { Table, Tag, Card, Row, Col, Typography, Avatar, Space } from "antd";

const { Text } = Typography;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [auth] = useAuth();

  const getOrders = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(
        `${process.env.REACT_APP_API}/api/v1/auth/user-orders?page=1&limit=10`,
      );

      setOrders(data?.orders || []);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth?.token) getOrders();
  }, [auth?.token]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered":
        return "green";
      case "Shipped":
        return "blue";
      case "Processing":
        return "orange";
      case "Canceled":
        return "red";
      case "Pending Payment":
        return "gold";
      default:
        return "default";
    }
  };

  const getPaymentStatus = (order) =>
    order?.paymentStatus ||
    (order?.payment?.[0]
      ? order.payment[0].success
        ? "Success"
        : "Failed"
      : "Pending");

  const getPaymentColor = (paymentStatus) => {
    switch (paymentStatus) {
      case "Pending":
        return "gold";
      case "Processing":
        return "blue";
      case "Success":
        return "green";
      case "Canceled":
      case "Failed":
        return "red";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "#",
      render: (_, __, index) => index + 1,
      width: 60,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: "Buyer",
      render: (_, record) => record?.buyer?.name,
    },
    {
      title: "Date",
      render: (_, record) => moment(record?.createdAt).fromNow(),
    },
    {
      title: "Payment",
      render: (_, record) => {
        const paymentStatus = getPaymentStatus(record);
        return (
          <Tag color={getPaymentColor(paymentStatus)}>{paymentStatus}</Tag>
        );
      },
    },
    {
      title: "Products",
      render: (_, record) => record?.products?.length,
    },
  ];

  const expandedRowRender = (record) => {
    return (
      <Space orientation="vertical" style={{ width: "100%" }}>
        {record?.products?.map((p) => (
          <Card key={p._id} size="small">
            <Space>
              <Avatar shape="square" size={70} src={p.photos?.[0]?.url} />

              <div>
                <Text strong>{p.name}</Text>
                <br />
                <Text type="secondary">
                  {p.description?.substring(0, 60)}...
                </Text>
                <br />
                <Text type="secondary">
                  Color:
                </Text>
                <span
                  title={p.selectedColor || "Default"}
                  style={{
                    display: "inline-block",
                    width: 18,
                    height: 18,
                    marginLeft: 6,
                    borderRadius: "50%",
                    verticalAlign: "middle",
                    background: p.selectedColor || "#d9d9d9",
                    border: "1px solid #999",
                  }}
                />
                {p.selectedSize && (
                  <>
                    <br />
                    <Text type="secondary">Size: {p.selectedSize}</Text>
                  </>
                )}
                <br />
                <Tag color="gold">₹{p.price}</Tag>
              </div>
            </Space>
          </Card>
        ))}
      </Space>
    );
  };

  return (
    <div className="container-fluid p-3">
      <Row gutter={[16, 16]}>
        {/* Sidebar */}
        <Col xs={24} md={6}>
          <UserMenu />
          <div
            className="mt-4 text-center"
            style={{
              width: "100%",
              padding: "28px 16px 8px",
              borderTop: "1px solid #e8edf2",
            }}
          >
            <h5 className="mb-2">Scan & Pay</h5>
            <p className="text-muted mb-3">Use your phone to scan the QR code</p>
            <img
              src="/payQR.png"
              alt="Payment QR code"
              className="d-block mx-auto"
              style={{
                width: "min(220px, 100%)",
                height: "auto",
                borderRadius: "8px",
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.12)",
              }}
            />
          </div>
        </Col>

        {/* Content */}
        <Col xs={24} md={18} className="dashboard-content">
          <Card
            title="🧾 Your Orders"
            variant="borderless"
            className="dashboard-cards"
          >
            {loading ? (
              <Loader />
            ) : (
              <Table
                rowKey="_id"
                columns={columns}
                expandable={{
                  expandedRowRender,
                }}
                dataSource={orders}
                pagination={{
                  pageSize: 5,
                }}
                scroll={{ x: 800 }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Orders;
