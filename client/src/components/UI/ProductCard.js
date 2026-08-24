import React, { useEffect, useRef, useState } from "react";

import { Skeleton, Tooltip } from "antd";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getColorQuantity, getColorValue } from "../../lib/productColors";

const ProductCard = ({
  product,
  onAddToCart,
  onWishlist,
  isWishlisted,
  loading = false,
}) => {
  const navigate = useNavigate();

  const colorSliderRef = useRef(null);

  const [imgLoaded, setImgLoaded] = useState(false);

  const [imgVisible, setImgVisible] = useState(false);

  const [activeImage, setActiveImage] = useState(0);

  const [selectedColor, setSelectedColor] = useState("");

  const [selectedSize, setSelectedSize] = useState("");

  const [showColorsSection, setShowColorsSection] = useState(() => {
    const saved = localStorage.getItem(
      `productCardColorsVisible:${product?._id}`,
    );

    return saved === null ? true : saved === "true";
  });

  const showSkeleton = loading || !imgLoaded;

  useEffect(() => {
    if (product?.colors?.length) {
      setSelectedColor(getColorValue(product.colors[0]));
    }

    setActiveImage(0);
    setSelectedSize("");
  }, [product]);

  useEffect(() => {
    const updateVisibility = () => {
      const value = localStorage.getItem(
        `productCardColorsVisible:${product?._id}`,
      );

      if (value !== null) {
        setShowColorsSection(value === "true");
      }
    };

    const handleVisibilityChange = (event) => {
      if (event.detail?.productId === product?._id) {
        setShowColorsSection(event.detail.show);
      }
    };

    window.addEventListener(
      "product-card-colors-toggle",
      handleVisibilityChange,
    );

    window.addEventListener("storage", updateVisibility);

    return () => {
      window.removeEventListener(
        "product-card-colors-toggle",
        handleVisibilityChange,
      );

      window.removeEventListener("storage", updateVisibility);
    };
  }, [product?._id]);

  useEffect(() => {
    if (!product?.photos || product.photos.length <= 1) return;

    const interval = setInterval(() => {
      setActiveImage((prev) =>
        prev === product.photos.length - 1 ? 0 : prev + 1,
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [product]);

  const nextImage = () => {
    if (!product?.photos?.length) return;

    setActiveImage((prev) =>
      prev === product.photos.length - 1 ? 0 : prev + 1,
    );
  };

  const previousImage = () => {
    if (!product?.photos?.length) return;

    setActiveImage((prev) =>
      prev === 0 ? product.photos.length - 1 : prev - 1,
    );
  };

  const scrollColors = (direction) => {
    if (!colorSliderRef.current) return;

    colorSliderRef.current.scrollBy({
      left: direction === "next" ? 120 : -120,

      behavior: "smooth",
    });
  };

  const handleAddToCart = () => {
    const selectedEntry = product?.colors?.find(
      (entry) => getColorValue(entry) === selectedColor,
    );

    if (getColorQuantity(selectedEntry) === 0) {
      toast.error("This color is out of stock");
      return;
    }

    if (product?.sizes?.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }

    onAddToCart(product, selectedColor, selectedSize);
  };


  return (
    <article className="product-card">
      <div className="product-card__media">
        {showSkeleton && (
          <Skeleton.Image
            active
            style={{
              width: "100%",
              height: "260px",
            }}
          />
        )}

        <img
          src={
            product?.photos?.length
              ? product.photos[activeImage].url
              : "/placeholder.png"
          }
          alt={product?.name}
          className={`product-card__image ${imgVisible ? "is-visible" : ""}`}
          style={{
            display: showSkeleton ? "none" : "block",
          }}
          onLoad={() => {
            setImgLoaded(true);
            setImgVisible(true);
          }}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/placeholder.png";
            setImgLoaded(true);
            setImgVisible(true);
          }}
        />

        {!showSkeleton && product?.photos?.length > 0 && (
          <>
            <button
              type="button"
              className="product-card__carousel-btn prev"
              onClick={previousImage}
            >
              &#8249;
            </button>

            <button
              type="button"
              className="product-card__carousel-btn next"
              onClick={nextImage}
            >
              &#8250;
            </button>

            <div className="product-card__dots">
              {product.photos.map((_, index) => (
                <span
                  key={index}
                  className={activeImage === index ? "active" : ""}
                  onClick={() => setActiveImage(index)}
                />
              ))}
            </div>

            {onWishlist && (
              <button
                type="button"
                className={`product-card__wishlist ${
                  isWishlisted ? "is-active" : ""
                }`}
                onClick={() => onWishlist && onWishlist(product)}
              >
                <i className={`bi bi-heart${isWishlisted ? "-fill" : ""}`} />
              </button>
            )}

            {product?.discount > 0 && (
              <span className="product-card__badge">
                {product.discount}% offer
              </span>
            )}
          </>
        )}
      </div>
      {/* PRODUCT BODY */}
      <div className="product-card__body">
        {loading ? (
          <>
            <Skeleton.Input active size="small" style={{ width: 80 }} />

            <Skeleton.Input active style={{ width: "90%" }} />

            <Skeleton active paragraph={{ rows: 2 }} title={false} />
          </>
        ) : (
          <>
            {/* TITLE */}

            <h3 className="product-card__title">{product?.name}</h3>

            {/* DESCRIPTION */}

            <p className="product-card__excerpt">
              {product?.description?.substring(0, 90)}
            </p>

            {/* PRICE */}

            <div className="product-card__meta">
              <span className="product-card__price">
                &#8377; {product?.price}

                <span className="text-decoration-line-through text-muted mx-2 fs-6">
                  &#8377;{" "}
                  {Math.round(
                    product?.price + (product?.price * product?.discount) / 100,
                  )}
                </span>
              </span>
            </div>
              <div className="text-muted ">
                {product?.shipping ? `Shipping Charges:  ₹${product.shippingCost}` : "Free Shipping"}
              </div>

            {/* COLORS */}

            {showColorsSection && product?.colors?.length > 0 && (
              <div className="mb-3">
                <strong className="text-muted">Select Color</strong>

                <div className="d-flex align-items-center mt-2">
                  <button
                    type="button"
                    className="btn btn-light btn--small"
                    onClick={() => scrollColors("prev")}
                  >
                    ‹
                  </button>

                  <div
                    ref={colorSliderRef}
                    style={{
                      display: "flex",
                      gap: "10px",
                      overflowX: "auto",
                      scrollBehavior: "smooth",
                      padding: "5px",
                      maxWidth: "225px",
                      scrollbarWidth: "none",
                    }}
                    className="color-scroll"
                  >
                    {product?.colors?.map((colorEntry) => {
                      const color = getColorValue(colorEntry);
                      const quantity = getColorQuantity(colorEntry);
                      const outOfStock = quantity === 0;

                      const colorButton = (
                        <button
                          key={color}
                          type="button"
                          aria-label={`${color}${outOfStock ? " - Out of stock" : ""}`}
                          disabled={outOfStock}
                          onClick={() => setSelectedColor(color)}
                          style={{
                            minWidth: 35,
                            height: 35,
                            borderRadius: "50%",
                            background: color,
                            cursor: outOfStock ? "not-allowed" : "pointer",
                            flex: "0 0 auto",
                            boxShadow:
                              selectedColor === color
                                ? "rgba(0, 0, 0, 0.25) 0px 54px 55px, rgba(0, 0, 0, 0.12) 0px -12px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px, rgba(0, 0, 0, 0.17) 0px 12px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px"
                                : "rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px ",
                            border:
                              selectedColor === color
                                ? "0.5px solid gray"
                                : "none",
                            opacity:
                              outOfStock
                                ? 0.35
                                : selectedColor === color
                                  ? 1
                                  : 0.8,
                          }}
                        />
                      );

                      return outOfStock ? (
                        <Tooltip key={`tooltip-${color}`} title="Out of stock">
                          {colorButton}
                        </Tooltip>
                      ) : (
                        colorButton
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    className="btn btn-light btn--small"
                    onClick={() => scrollColors("next")}
                  >
                    ›
                  </button>
                </div>
              </div>
            )}

            {product?.sizes?.length > 0 && (
              <div className="mb-3">
                <strong className="text-muted">Select Size</strong>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`btn btn-sm ${selectedSize === size ? "btn-success" : "btn-light"}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}


            {onAddToCart && (
              <div className="product-card__actions">
                <button
                  className="btn btn-outline-primary btn-icon"
                  onClick={() => navigate(`/product/${product.slug}`)}
                >
                  <i className="bi bi-eye-fill" />
                  <span>View</span>
                </button>

                <button
                  className="btn btn-primary btn-icon"
                  onClick={handleAddToCart}
                >
                  <i className="bi bi-cart-plus-fill" />
                  <span>Add</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </article>
  );
};

export default ProductCard;
