import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import EmptyState from "../components/UI/EmptyState";
import Loader from "../components/UI/Loader";
import ProductCard from "../components/UI/ProductCard";
import SectionHeader from "../components/UI/SectionHeader";
import { useCart } from "../context/cart";
import { useChat } from "../context/chat";
import { useWishlist } from "../context/wishlist";
import { Badge } from "antd";
import { getColorQuantity, getColorValue } from "../lib/productColors";

const ProductDetails = () => {
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { cart, setCart } = useCart();
  const [wishlist, setWishlist] = useWishlist();
  const [activeImage, setActiveImage] = useState(0);
  const { setChatProduct, selectedColor, setSelectedColor } = useChat();
  const [showColorsSection, setShowColorsSection] = useState(() => {
    if (typeof window === "undefined") return true;

    const savedValue = localStorage.getItem(
      `productCardColorsVisible:${product?._id}`,
    );
    return savedValue === null ? true : savedValue === "true";
  });

  useEffect(() => {
    if (params?.slug) getProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.slug]);

  useEffect(() => {
    if (product) {
      setChatProduct(product);
    }
  }, [product, setChatProduct]);

  useEffect(() => {
    if (product?.colors?.length) {
      const nextColor = selectedColor || getColorValue(product.colors[0]);
      setSelectedColor(nextColor);
    }
  }, [product, selectedColor, setSelectedColor]);

  useEffect(() => {
    return () => {
      setChatProduct(null);
      setSelectedColor("");
    };
  }, [setChatProduct, setSelectedColor]);

  useEffect(() => {
    setActiveImage(0);
  }, [product]);

  useEffect(() => {
    const readVisibility = () => {
      if (typeof window === "undefined") return true;

      const savedValue = localStorage.getItem(
        `productCardColorsVisible:${product?._id}`,
      );
      return savedValue === null ? true : savedValue === "true";
    };

    const syncVisibility = () => {
      setShowColorsSection(readVisibility());
    };

    syncVisibility();

    const handleVisibilityChange = (event) => {
      if (event?.detail?.productId === product?._id) {
        setShowColorsSection(event.detail.show);
      }
    };

    window.addEventListener(
      "product-card-colors-toggle",
      handleVisibilityChange,
    );

    return () => {
      window.removeEventListener(
        "product-card-colors-toggle",
        handleVisibilityChange,
      );
    };
  }, [product?._id]);

  const getProduct = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${process.env.REACT_APP_API}/api/v1/product/get-product/${params.slug}`,
      );
      setProduct(data?.product);
      if (data?.product?._id && data?.product?.category?._id) {
        getSimilarProduct(data.product._id, data.product.category._id);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error(error);
    }
  };

  const getSimilarProduct = async (pid, cid) => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API}/api/v1/product/related-product/${pid}/${cid}`,
      );
      setRelatedProducts(data?.products || []);
    } catch (error) {
      console.error(error);
    }
  };

  const addToCart = () => {
    if (!product) return;
    const selectedEntry = product.colors?.find(
      (entry) => getColorValue(entry) === selectedColor,
    );
    const availableQuantity = getColorQuantity(selectedEntry);

    if (availableQuantity === 0) {
      toast.error("This color is out of stock");
      return;
    }

    if (availableQuantity !== null && quantity > availableQuantity) {
      toast.error(`Only ${availableQuantity} available in this color`);
      return;
    }
    const existing = cart.find(
      (cartItem) =>
        cartItem._id === product._id &&
        cartItem.selectedColor === selectedColor,
    );
    const updatedCart = existing
      ? cart.map((item) =>
          item._id === product._id && item.selectedColor === selectedColor
            ? {
                ...item,
                quantity: item.quantity + quantity,
              }
            : item,
        )
      : [
          ...cart,
          {
            ...product,
            quantity,
            selectedColor,
          },
        ];
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    toast.success("Product added to cart");
  };

  const toggleWishlist = (product) => {
    const exists = wishlist.some((item) => item._id === product._id);
    const updated = exists
      ? wishlist.filter((item) => item._id !== product._id)
      : [...wishlist, { ...product, quantity: 1 }];
    setWishlist(updated);
    localStorage.setItem("wishlist", JSON.stringify(updated));
  };

  const isWishlisted = (product) =>
    wishlist.some((item) => item._id === product._id);

  if (loading || !product) {
    return (
      <div className="container section">
        <Loader />
      </div>
    );
  }

  const ribbonStyles = {
    indicator: {
      boxShadow: "4px 4px 4px 1px rgb(0 0 0 / 65%)",
      padding: "calc(-0.7rem + 1.5625vw) calc(1.2rem + 1.5625vw)",
    },
    content: {
      color: "#f7b538",
      fontWeight: "bold",
      letterSpacing: "5px",
    },
  };

  return (
    <>
      <section className="container product-detail section">
        <div className="product-detail__grid">
          <div className="product-detail-gallery">
            {/* Main Image */}
            <Badge.Ribbon
              text="MELODI"
              color="rgba(7, 70, 49, 0.90)"
              styles={ribbonStyles}
              placement="start"
            >
              <div className="product-detail__visual">
                <img
                  src={
                    product?.photos?.[activeImage]?.url ||
                    product?.photos?.[0]?.url
                  }
                  alt={product.name}
                  className="product-detail__image"
                />
              </div>
            </Badge.Ribbon>
            {product?.photos?.length > 1 && (
              <div className="product-detail-thumbnails">
                {product.photos.map((photo, index) => (
                  <div
                    key={photo.public_id}
                    className={`thumbnail ${
                      activeImage === index ? "active" : ""
                    }`}
                    onClick={() => setActiveImage(index)}
                  >
                    <img src={photo.url} alt={`${product.name}-${index}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="product-detail__info">
            <p className="eyebrow">New arrival</p>
            <h1>{product.name}</h1>
            <p className="product-detail__tagline">
              Premium quality in every stitch, perfect for daily use.
            </p>
            <div className="product-detail__pricing">
              <span className="product-detail__price">
                &#8377; {product.price}
              </span>
              <span className="product-detail__status">
                {product.shipping ? "Fast shipping" : "No Shipping charges"}
              </span>
            </div>
            <div className="product-detail__specs">
              <p>{product.description}</p>
              <p>
                <strong>Category:</strong> {product.category?.name}
              </p>
            </div>
            <div className="product-detail__controls">
              <div className="quantity-control">
                <button
                  className="btn btn-light"
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((qty) => Math.max(1, qty - 1))}
                >
                  -
                </button>
                <span>{quantity}</span>
                <button
                  className="btn btn-light"
                  type="button"
                  onClick={() => setQuantity((qty) => qty + 1)}
                >
                  +
                </button>
              </div>

              <button
                className="btn btn-primary"
                type="button"
                onClick={addToCart}
              >
                Add to cart
              </button>
            </div>

            {showColorsSection && (
              <div className="mb-3">
                <strong className="text-muted">Select Color</strong>

                <div className="d-flex gap-2 mt-2">
                  {product?.colors?.map((colorEntry) => {
                    const color = getColorValue(colorEntry);
                    const outOfStock = getColorQuantity(colorEntry) === 0;

                    return (
                    <div
                      key={color}
                      onClick={() => !outOfStock && setSelectedColor(color)}
                      aria-label={`${color}${outOfStock ? " - Out of stock" : ""}`}
                      style={{
                        width: 35,
                        height: 35,
                        borderRadius: "50%",
                        background: color,
                        cursor: outOfStock ? "not-allowed" : "pointer",
                        boxShadow:
                          selectedColor === color
                            ? "rgba(0, 0, 0, 0.25) 0px 54px 55px, rgba(0, 0, 0, 0.12) 0px -12px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px, rgba(0, 0, 0, 0.17) 0px 12px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px"
                            : "rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px ",
                        border:
                          selectedColor === color
                            ? `6px solid ${color}`
                            : "1px solid #ddd",
                        opacity: outOfStock ? 0.35 : selectedColor === color ? 1 : 0.8,
                      }}
                    >
                      {outOfStock && <span>Out of stock</span>}
                    </div>
                  );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container section">
        <SectionHeader title="You may also like" subtitle="Related products" />
        {relatedProducts.length === 0 ? (
          <EmptyState
            title="No related products"
            description="Explore other items in this category."
            cta="Browse categories"
            to="/categories"
          />
        ) : (
          <div className="product-grid">
            {relatedProducts.map((product) => (
              <ProductCard
                key={`${product._id}-${product.selectedColor}`}
                product={product}
                onAddToCart={(item, color) => {
                  const updated = [
                    ...cart,
                    {
                      ...item,
                      quantity: 1,
                      selectedColor: color || getColorValue(item.colors?.[0]),
                    },
                  ];

                  setCart(updated);
                  localStorage.setItem("cart", JSON.stringify(updated));
                  toast.success("Added best match to cart");
                }}
                onWishlist={toggleWishlist}
                isWishlisted={isWishlisted(product)}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
};

export default ProductDetails;
