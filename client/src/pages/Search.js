import React from "react";
import { useSearch } from "../context/search";
import ProductCard from "../components/UI/ProductCard";
import { getColorValue } from "../lib/productColors";
import EmptyState from "../components/UI/EmptyState";
import { useCart } from "../context/cart";
import { useWishlist } from "../context/wishlist";
import toast from "react-hot-toast";

const Search = () => {
  const [values] = useSearch();
  const { cart, setCart } = useCart();
  const [wishlist, setWishlist] = useWishlist();

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

  return (
    <section className="container section">
      <div className="page-heading">
        <h1>Search Results</h1>
        <p>{values?.results?.length || 0} product(s) found</p>
      </div>

      {values?.results?.length === 0 ? (
        <EmptyState
          title="No matching products"
          description="Try another keyword or browse our main collections."
          cta="Browse categories"
          to="/categories"
        />
      ) : (
        <div className="product-grid">
          {values.results.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onAddToCart={addToCart}
              onWishlist={toggleWishlist}
              isWishlisted={isWishlisted(product)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Search;
