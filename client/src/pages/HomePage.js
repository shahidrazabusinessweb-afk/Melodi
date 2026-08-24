import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import AdSlider from "../components/AdSlider";
import EmptyState from "../components/UI/EmptyState";
import ProductCard from "../components/UI/ProductCard";
import { getColorValue } from "../lib/productColors";
import SectionHeader from "../components/UI/SectionHeader";
import { useCart } from "../context/cart";
import { useWishlist } from "../context/wishlist";
import { useRef } from "react";
import { motion } from "framer-motion";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [checked] = useState([]);
  const [radio] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const { cart, setCart } = useCart();
  const [wishlist, setWishlist] = useWishlist();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const scrollPosition = useRef(0);

  const handleLoadMore = () => {
    scrollPosition.current = window.scrollY;
    setPage((prev) => prev + 1);
  };

  const getAllCategory = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API}/api/v1/category/get-category?page=1&limit=20`,
      );
      setCategories(data?.category || []);
    } catch (error) {
      console.error(error);
    }
  };

  const getAllProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${process.env.REACT_APP_API}/api/v1/product/product-list/${page}`,
      );
      setLoading(false);
      if (page === 1) {
        setProducts(data.products || []);
      } else {
        setProducts((prev) => [...prev, ...(data.products || [])]);
      }
      // setTotal(data?.total || 0);
    } catch (error) {
      setLoading(false);
      console.error(error);
    }
  };

  const getTotal = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API}/api/v1/product/product-count`,
      );
      setTotal(data?.total || 0);
    } catch (error) {
      console.error(error);
    }
  };

  const filterProduct = async () => {
    try {
      setLoading(true);
      const { data } = await axios.post(
        `${process.env.REACT_APP_API}/api/v1/product/product-filters`,
        { checked, radio, page: 1, limit: 6 },
      );
      setProducts(data?.products || []);
      setTotal(data?.total || 0);
      setPage(1);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error(error);
    }
  };

  const addToCart = (product, selectedColor, selectedSize) => {
    const item = {
      ...product,
      quantity: 1,
      selectedColor: selectedColor || getColorValue(product.colors?.[0]),
      selectedSize: selectedSize || "",
    };
    const existing = cart.find(
      (cartItem) =>
        cartItem._id === product._id &&
        cartItem.selectedColor === item.selectedColor &&
        cartItem.selectedSize === item.selectedSize,
    );
    const updatedCart = existing
      ? cart.map((cartItem) =>
          cartItem._id === product._id &&
          cartItem.selectedColor === item.selectedColor &&
          cartItem.selectedSize === item.selectedSize
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        )
      : [...cart, item];
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    toast.success("Added to cart");
  };

  const toggleWishlist = (product) => {
    const exists = wishlist.some((item) => item._id === product._id);
    const updated = exists
      ? wishlist.filter((item) => item._id !== product._id)
      : [...wishlist, { ...product, quantity: 1 }];
    setWishlist(updated);
    localStorage.setItem("wishlist", JSON.stringify(updated));
    toast.success(exists ? "Removed from wishlist" : "Added to wishlist");
  };

  const isWishlisted = (product) =>
    wishlist.some((item) => item._id === product._id);

  useEffect(() => {
    getTotal();
    getAllCategory();
  }, []);

  useEffect(() => {
    if (!checked.length && !radio) {
      getAllProducts();
    } else {
      filterProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (checked.length || radio) {
      filterProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, radio]);

  useEffect(() => {
    if (page > 1) {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: scrollPosition.current,
          behavior: "instant", // or "auto"
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  return (
    <>
      <AdSlider />
      <section className="hero container">
        <div className="hero__copy">
          <p className="eyebrow">New arrivals</p>
          <h1>Shop premium bags, wallets and accessories.</h1>
          <p className="hero__text">
            Discover elegant designs crafted for comfort, style and everyday
            luxury.
          </p>
          <div className="hero__actions">
            <button
              className="btn btn-primary hero__btn"
              onClick={() => navigate("/categories")}
            >
              Explore categories
            </button>
            <button
              className="btn btn-outline-primary hero__btn"
              onClick={() => navigate("/cart")}
            >
              View cart
            </button>
          </div>
        </div>
        <div className="hero__visual">
          <div className="hero__badge">Best Seller</div>
          <img
            src="/hero-bag.png"
            alt="Premium bag collection"
            className="hero__image"
          />
        </div>
      </section>

      <section className="container section">
        <SectionHeader
          title="Trending products"
          subtitle="Handpicked for you"
          children={
            <span className="section-header__meta">
              {total} items available
            </span>
          }
        />

        {!loading && products.length === 0 && (
          <EmptyState
            title="No products available"
            description="Try changing your filters or visit categories for more items."
            cta="Browse categories"
            to="/categories"
          />
        )}

        <div className="product-grid">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <ProductCard key={i} loading={true} />
              ))
            : products.map((product) => (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  key={product._id}
                >
                  <ProductCard
                    key={product._id}
                    product={product}
                    onAddToCart={addToCart}
                    onWishlist={toggleWishlist}
                    isWishlisted={isWishlisted(product)}
                    loading={false}
                  />
                </motion.div>
              ))}
        </div>
        {products.length < total && (
          <div className="text-center mt-4">
            <button className="btn btn-light" onClick={handleLoadMore}>
              Load More
            </button>
          </div>
        )}
      </section>
    </>
  );
};

export default HomePage;
