import { Card, Col, Row, Pagination, Switch } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import AdminMenu from "../../components/Layout/AdminMenu";
import ProductCard from "../../components/UI/ProductCard";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [colorVisibility, setColorVisibility] = useState({});
  const limit = 12;

  const getColorsVisibility = (productId) => {
    if (Object.prototype.hasOwnProperty.call(colorVisibility, productId)) {
      return colorVisibility[productId];
    }

    const savedValue = localStorage.getItem(
      `productCardColorsVisible:${productId}`,
    );
    return savedValue === null ? true : savedValue === "true";
  };

  const handleColorsVisibilityChange = (productId, checked) => {
    setColorVisibility((current) => ({ ...current, [productId]: checked }));
    localStorage.setItem(
      `productCardColorsVisible:${productId}`,
      String(checked),
    );
    window.dispatchEvent(
      new CustomEvent("product-card-colors-toggle", {
        detail: { productId, show: checked },
      }),
    );
  };

  const getAllProducts = async (currentPage = 1) => {
    try {
      setLoading(true);

      const { data } = await axios.get(
        `${process.env.REACT_APP_API}/api/v1/product/get-product?page=${currentPage}&limit=${limit}`,
      );

      setProducts(data?.products || []);
      setPages(data?.pages || 0);
      setPage(currentPage);
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getAllProducts(1);
  }, []);

  return (
    <div className="container-fluid">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <AdminMenu />
        </Col>

        <Col xs={24} md={18} className="dashboard-content">
          <Card
            title="🛍️ All Products"
            className="dashboard-cards"
          >
            <div className="product-grid">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <ProductCard key={i} loading={true} />
                  ))
                : products.map((product) => (
                    <div className="product-admin-card" key={product._id}>
                      <div className="product-admin-card__controls">
                        <span>Show Colors</span>
                        <Switch
                          aria-label={`Show colors for ${product.name}`}
                          checked={getColorsVisibility(product._id)}
                          onChange={(checked) =>
                            handleColorsVisibilityChange(product._id, checked)
                          }
                        />
                      </div>
                      <Link
                        to={`/dashboard/admin/product/${product.slug}`}
                      >
                        <ProductCard product={product} loading={false} />
                      </Link>
                    </div>
                  ))}
            </div>

            {/* Pagination */}
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <Pagination
                current={page}
                pageSize={limit}
                total={pages * limit}
                onChange={(p) => getAllProducts(p)}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Products;
