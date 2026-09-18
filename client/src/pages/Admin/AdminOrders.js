import React, { useEffect, useState } from "react";
import AdminMenu from "../../components/Layout/AdminMenu";
import axios from "axios";
import moment from "moment";
import { useAuth } from "../../context/auth";

import {
  Table,
  Select,
  Tag,
  Card,
  Space,
  Typography,
  Avatar,
  Collapse,
  Row,
  Col,
  message,
  Grid,
} from "antd";

import Loader from "../../components/UI/Loader";

const { useBreakpoint } = Grid;
const { Option } = Select;
const { Text } = Typography;

const AdminOrders = () => {
  const screens = useBreakpoint();

  const isMobile = screens.xs && !screens.sm;
  const isTablet = screens.sm && !screens.lg;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [auth] = useAuth();

  const statusList = [
    "Pending Payment",
    "Not Process",
    "Processing",
    "Shipped",
    "Delivered",
    "Canceled",
  ];

  const paymentStatusList = [
    "Pending",
    "Processing",
    "Success",
    "Failed",
    "Canceled",
  ];

  const getOrders = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${process.env.REACT_APP_API}/api/v1/auth/all-orders?page=1&limit=20`
      );

      setOrders(data?.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      message.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth?.token) {
      getOrders();
    }
  }, [auth?.token]);

  const handleChange = async (orderId, status) => {
    try {
      const { data } = await axios.put(
        `${process.env.REACT_APP_API}/api/v1/auth/order-status/${orderId}`,
        { status }
      );

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId ? { ...order, status: data?.status || status } : order
        )
      );
      message.success("Order status updated");
    } catch (error) {
      console.error("Error updating order status:", error);
      message.error("Failed to update order status");
    }
  };

  const handlePaymentChange = async (orderId, paymentStatus) => {
    try {
      const { data } = await axios.put(
        `${process.env.REACT_APP_API}/api/v1/auth/payment-status/${orderId}`,
        { paymentStatus }
      );

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId
            ? { ...order, paymentStatus: data?.paymentStatus || paymentStatus }
            : order
        )
      );
      message.success("Payment status updated");
    } catch (error) {
      console.error("Error updating payment status:", error);
      message.error("Failed to update payment status");
    }
  };

  const getPaymentStatus = (order) =>
    order?.paymentStatus ||
    (order?.payment?.[0]
      ? order.payment[0].success
        ? "Success"
        : "Failed"
      : "Pending");

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

  const getProductImageSrc = (product) => {
    if (product.photos && product.photos.length > 0) {
      return product.photos[0].url || product.photos[0];
    }
    return `${process.env.REACT_APP_API}/api/v1/product/product-photo/${product._id}`;
  };

  const columns = [
    {
      title: "#",
      render: (_, __, index) => index + 1,
      width: 40,
    },
    {
      title: "Order ID",
      dataIndex: "_id",
      render: (id) => <Text copyable>{id ? id.slice(-8) : ""}</Text>,
    },
    {
      title: "Buyer",
      render: (_, record) => record?.buyer?.name || "N/A",
    },
    {
      title: "Date",
      render: (_, record) =>
        record?.createdAt
          ? moment(record.createdAt).format("DD MMM YYYY HH:mm")
          : "N/A",
    },
    {
      title: "Payment",
      render: (_, record) => (
        <Select
          value={getPaymentStatus(record)}
          style={{ width: 115 }}
          onChange={(value) => handlePaymentChange(record._id, value)}
        >
          {paymentStatusList.map((paymentStatus) => (
            <Option key={paymentStatus} value={paymentStatus}>
              {paymentStatus}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Products",
      render: (_, record) => record?.products?.length || 0,
    },
    {
      title: "Status",
      render: (_, record) => (
        <Select
          value={record?.status}
          style={{ width: 120 }}
          onChange={(value) => handleChange(record._id, value)}
        >
          {statusList.map((status) => (
            <Option key={status} value={status}>
              {status}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Current Status",
      render: (_, record) => (
        <Tag color={getStatusColor(record?.status)}>{record?.status || "N/A"}</Tag>
      ),
    },
  ];

  const expandedRowRender = (record) => (
    <Space orientation="vertical" style={{ width: "100%" }}>
      {record?.products?.map((product) => (
        <Card key={product._id} size="small">
          <Space align="start">
            <Avatar shape="square" size={80} src={getProductImageSrc(product)} />
            <div>
              <h5>{product.name}</h5>
              <p>{product.description?.substring(0, 100)}...</p>
              <Tag color="gold">&#8377; {product.price}</Tag>
            </div>
          </Space>
        </Card>
      ))}
    </Space>
  );

  return (
    <div className="container-fluid">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <AdminMenu />
        </Col>

        <Col xs={24} md={18} className="dashboard-content">
          <Card
            title="🛒 All Orders"
            variant="borderless"
            className="dashboard-cards"
          >
            {loading ? (
              <Loader />
            ) : (
              <>
                {isMobile || isTablet ? (
                  <Space
                    orientation="vertical"
                    size="middle"
                    style={{ width: "100%" }}
                  >
                    {orders?.map((order, index) => (
                      <Card
                        key={order._id}
                        title={`Order #${index + 1}`}
                        size="small"
                      >
                        <Space orientation="vertical" style={{ width: "100%" }}>
                          <div>
                            <strong>Buyer:</strong> {order?.buyer?.name || "N/A"}
                          </div>

                          <div>
                            <strong>Date:</strong>{" "}
                            {order?.createdAt
                              ? moment(order.createdAt).fromNow()
                              : "N/A"}
                          </div>

                          <div>
                            <strong>Payment Status:</strong>{" "}
                            <Select
                              value={getPaymentStatus(order)}
                              style={{ width: "100%", marginTop: 8 }}
                              onChange={(value) =>
                                handlePaymentChange(order._id, value)
                              }
                            >
                              {paymentStatusList.map((paymentStatus) => (
                                <Option key={paymentStatus} value={paymentStatus}>
                                  {paymentStatus}
                                </Option>
                              ))}
                            </Select>
                          </div>

                          <div>
                            <strong>Order Status:</strong>
                            <Select
                              value={order?.status}
                              style={{ width: "100%", marginTop: 8 }}
                              onChange={(value) =>
                                handleChange(order._id, value)
                              }
                            >
                              {statusList.map((status) => (
                                <Option key={status} value={status}>
                                  {status}
                                </Option>
                              ))}
                            </Select>
                          </div>

                          <Collapse
                            items={[
                              {
                                key: "1",
                                label: `Products (${order?.products?.length || 0})`,
                                children: (
                                  <Space
                                    orientation="vertical"
                                    style={{ width: "100%" }}
                                  >
                                    {order?.products?.map((product) => (
                                      <Card key={product._id} size="small">
                                        <Space align="start">
                                          <Avatar
                                            shape="square"
                                            size={70}
                                            src={getProductImageSrc(product)}
                                          />
                                          <div>
                                            <strong>{product.name}</strong>
                                            <div>
                                              {product.description?.substring(
                                                0,
                                                50
                                              )}
                                            </div>
                                            <Tag color="gold">
                                              &#8377; {product.price}
                                            </Tag>
                                          </div>
                                        </Space>
                                      </Card>
                                    ))}
                                  </Space>
                                ),
                              },
                            ]}
                          />
                        </Space>
                      </Card>
                    ))}
                  </Space>
                ) : (
                  <Table
                    rowKey="_id"
                    columns={columns}
                    dataSource={orders}
                    expandable={{
                      expandedRowRender,
                    }}
                    pagination={{
                      pageSize: 10,
                    }}
                  />
                )}
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminOrders;