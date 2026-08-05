import axios from "axios";
import DropIn from "braintree-web-drop-in-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/UI/EmptyState";
import SectionHeader from "../components/UI/SectionHeader";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";

const CartPage = () => {
  const { cart, setCart } = useCart();
  const [auth, setAuth] = useAuth();
  const [clientToken, setClientToken] = useState("");
  const [instance, setInstance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(
    auth?.user?.currentAddress || "",
  );
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [newAddress, setNewAddress] = useState("");

  const [couponCode, setCouponCode] = useState(
    localStorage.getItem("coupon") || "",
  );

  const [couponInput, setCouponInput] = useState(
    localStorage.getItem("coupon") || "",
  );

  const navigate = useNavigate();

  const handleAddAddress = async () => {
    if (!newAddress.trim()) {
      toast.error("Please enter an address");
      return;
    }

    try {
      const { data } = await axios.put(
        `${process.env.REACT_APP_API}/api/v1/auth/profile`,
        {
          address: newAddress,
        },
        {
          headers: {
            Authorization: auth.token,
          },
        },
      );

      if (data.success) {
        toast.success("Address added successfully");

        const updatedAuth = {
          ...auth,
          user: data.updatedUser,
        };

        setAuth(updatedAuth);

        localStorage.setItem("auth", JSON.stringify(updatedAuth));

        setSelectedAddress(newAddress);
        setNewAddress("");
        setShowAddressInput(false);
      }
    } catch (err) {
      toast.error("Unable to add address");
    }
  };

  const getSubtotal = () => {
    return cart.reduce(
      (sum, item) => sum + Number(item.price) * (item.quantity || 1),
      0,
    );
  };

  const getShippingTotal = () => {
    return cart.reduce((sum, item) => {
      if (item.shipping) {
        return sum + Number(item.shippingCost || 0);
      }
      return sum;
    }, 0);
  };

  const getGrandTotal = () => {
    return getSubtotal() + getShippingTotal();
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });
  };

  const finalTotal = Math.max(getGrandTotal() - discount, 0);

  const removeCartItem = (pid, color) => {
    const updatedCart = cart.filter(
      (item) => !(item._id === pid && item.selectedColor === color),
    );
    toast.success("Removed Item Successfully");
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };
  const updateQuantity = (pid, color, qty) => {
    if (qty < 1) return;

    const updated = cart.map((item) =>
      item._id === pid && item.selectedColor === color
        ? { ...item, quantity: qty }
        : item,
    );

    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const validateCoupon = async (code) => {
    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_API}/api/v1/coupon/validate`,
        { code },
        {
          headers: {
            Authorization: auth?.token,
          },
        },
      );

      if (!data.success) {
        toast.error("Invalid coupon");
        return;
      }

      const subtotal = cart.reduce(
        (sum, item) => sum + Number(item.price) * (item.quantity || 1),
        0,
      );

      const shipping = cart.reduce((sum, item) => {
        if (item.shipping) {
          return sum + Number(item.shippingCost || 0);
        }
        return sum;
      }, 0);

      const total = subtotal + shipping;

      const discountAmount = total * (data.coupon.percentage / 100);

      setDiscount(discountAmount);

      setCouponCode(code);
      localStorage.setItem("coupon", code);

      setAppliedCoupon(code);

      toast.success("Coupon applied successfully!");
    } catch (error) {
      toast.error("Coupon validation failed");
    }
  };

  const applyCoupon = async () => {
    if (!couponInput.trim()) {
      toast.error("Enter coupon code");
      return;
    }

    await validateCoupon(couponInput.trim().toUpperCase());
  };

  const removeCoupon = () => {
    localStorage.removeItem("coupon");

    setCouponCode("");

    setCouponInput("");

    setDiscount(0);

    toast.success("Coupon removed");
  };

  const handleAddressChange = async (address) => {
    setSelectedAddress(address);

    await axios.put(
      `${process.env.REACT_APP_API}/api/v1/auth/profile`,
      {
        address,
      },
      {
        headers: {
          Authorization: auth.token,
        },
      },
    );
  };

  const getToken = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API}/api/v1/product/braintree/token`,
      );
      setClientToken(data?.clientToken);
    } catch (error) {}
  };

  useEffect(() => {
    getToken();
  }, [auth?.token]);

  useEffect(() => {
    const code = localStorage.getItem("coupon");

    if (code) {
      setCouponCode(code);
      setCouponInput(code);
    }
  }, []);

  useEffect(() => {
    if (couponCode && cart.length > 0 && appliedCoupon !== couponCode) {
      validateCoupon(couponCode);
    }
  }, [couponCode, cart]);

  useEffect(() => {
    setCouponInput(couponCode);
  }, [couponCode]);

  useEffect(() => {
    if (auth?.user?.currentAddress) {
      setSelectedAddress(auth.user.currentAddress);
    }
  }, [auth?.user?.currentAddress]);

  const handlePayment = async () => {
    try {
      setLoading(true);
      const { nonce } = await instance.requestPaymentMethod();
      await axios.post(
        `${process.env.REACT_APP_API}/api/v1/product/braintree/payment`,
        {
          nonce,
          cart,
          couponCode,
          deliveryAddress: selectedAddress,
        },
      );
      setLoading(false);
      localStorage.removeItem("cart");
      setCart([]);
      navigate("/dashboard/user/orders");
      toast.success("Payment Completed successfully");
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col-md-12">
          <h1
            className="text-center p-2 mb-4"
            style={{ background: "#b3def5be", color: "#4a386c" }}
          >
            {`Hi ${auth?.token && auth?.user?.name}`}
          </h1>
        </div>
      </div>
      <div className="d-flex align-items-center justify-content-between">
        <SectionHeader title="Cart" subtitle="Checkout Now" />
        <p className="text-center p-0 m-0 text-success">
          You have {cart.length} items in your cart
        </p>
      </div>
      {cart.length === 0 ? (
        <EmptyState
          title="Your Cart is empty"
          description="Browse products and Checkout Now."
          cta="Browse categories"
          to="/categories"
        />
      ) : (
        <div className="row">
          <div className="col-md-8">
            <AnimatePresence>
              {cart?.map((p) => (
                <motion.div
                  key={`${p._id}-${p.selectedColor}`}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    x: 100,
                    transition: { duration: 0.3 },
                  }}
                  transition={{
                    layout: {
                      duration: 0.3,
                      ease: "easeInOut",
                    },
                  }}
                >
                  <div
                    key={`${p._id}-${p.selectedColor}`}
                    className={`row m-2 p-2 card flex-row align-items-center cart-item 
                    `}
                  >
                    <div className="col-3 col-md-2">
                      <img
                        src={p.photos?.[0]?.url}
                        alt={p.name}
                        className="cart-item__image"
                      />
                    </div>
                    <div className="col-9 col-md-7">
                      <h5>{p.name}</h5>
                      <p className="muted">{p.description.substring(0, 60)}</p>

                      <div className="mb-3">
                        <div className="d-flex gap-2 mt-2">
                          <strong className="text-muted">Color</strong>
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: "50%",
                              background: p.selectedColor,
                              cursor: "pointer",
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="mb-2">
                        <div className="quantity-control">
                          <button
                            className="btn btn-light"
                            onClick={() =>
                              updateQuantity(
                                p._id,
                                p.selectedColor,
                                (p.quantity || 1) - 1,
                              )
                            }
                            disabled={(p.quantity || 1) <= 1}
                          >
                            -
                          </button>
                          <span className="mx-2">{p.quantity || 1}</span>
                          <button
                            className="btn btn-light"
                            onClick={() =>
                              updateQuantity(
                                p._id,
                                p.selectedColor,
                                (p.quantity || 1) + 1,
                              )
                            }
                          >
                            +
                          </button>
                        </div>

                        <strong className="ms-3 text-danger">
                          {(
                            Number(p.price) * (p.quantity || 1) +
                            p.shippingCost
                          ).toLocaleString("en-US", {
                            style: "currency",
                            currency: "INR",
                          })}
                        </strong>
                      </div>
                      <div className="mb-2">
                        <small>
                          Product Price: {formatCurrency(Number(p.price))}
                        </small>

                        {p.shipping && (
                          <small className="text-muted d-block">
                            Shipping: ₹{p.shippingCost || 0}
                          </small>
                        )}
                      </div>
                    </div>
                    <div className="col-12 col-md-3 text-end">
                      <button
                        className="btn btn-danger"
                        onClick={() => removeCartItem(p._id, p.selectedColor)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {cart?.length >= 1 ? (
            <div className="col-md-4 text-center">
              <h2>Cart Summary</h2>
              <p>Total | Checkout | Payment</p>
              <hr />
              <h5>
                Subtotal :
                {getSubtotal().toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                })}
              </h5>

              <h5>
                Shipping :
                {getShippingTotal().toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                })}
              </h5>

              <hr />
              <div className="card p-3 mb-3">
                <h5>Have a Coupon?</h5>

                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter coupon code"
                    value={couponInput}
                    onChange={(e) =>
                      setCouponInput(e.target.value.toUpperCase())
                    }
                  />

                  <button className="btn btn-success" onClick={applyCoupon}>
                    Apply
                  </button>
                </div>

                {couponCode && (
                  <div className="mt-2">
                    <small className="text-success">
                      Applied Coupon: <strong>{couponCode}</strong>
                    </small>

                    <br />

                    <button
                      className="btn btn-link text-danger p-0 mt-1"
                      onClick={removeCoupon}
                    >
                      Remove Coupon
                    </button>
                  </div>
                )}
              </div>

              <h4>
                Total:{" "}
                {getGrandTotal().toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                })}
              </h4>
              <h5>Discount: {formatCurrency(discount)}</h5>

              <h3 className="text-danger">Pay: {formatCurrency(finalTotal)}</h3>
              {auth?.user?.currentAddress ? (
                <>
                  <div className="mb-3">
                    <h5>Select Delivery Address</h5>

                    <select
                      className="form-select"
                      value={selectedAddress}
                      onChange={(e) => handleAddressChange(e.target.value)}
                    >
                      {auth?.user?.addresses?.length > 0 ? (
                        auth.user.addresses.map((address, index) => (
                          <option key={index} value={address}>
                            {address}
                          </option>
                        ))
                      ) : (
                        <option value="">No address found</option>
                      )}
                    </select>
                    <button
                      className="btn btn-outline-success mt-3"
                      onClick={() => setShowAddressInput(!showAddressInput)}
                    >
                      + Add New Address
                    </button>
                    {showAddressInput && (
                      <div className="mt-3">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter new address"
                          value={newAddress}
                          onChange={(e) => setNewAddress(e.target.value)}
                        />

                        <button
                          className="btn btn-primary mt-2"
                          onClick={handleAddAddress}
                        >
                          Save Address
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="mb-3">
                  {auth?.token ? (
                    <button
                      className="btn btn-outline-warning mt-2"
                      onClick={() => navigate("/dashboard/user/profile")}
                    >
                      Update Address
                    </button>
                  ) : (
                    <button
                      className="btn btn-outline-warning mt-2"
                      onClick={() => navigate("/login", { state: "/cart" })}
                    >
                      Please Login to Checkout
                    </button>
                  )}
                </div>
              )}
              <div className="mt-2">
                {!clientToken || !cart?.length ? (
                  ""
                ) : (
                  <>
                    <h3 className="text-danger text-underline">Pay Now</h3>
                    <img src="./payQR.png" alt="payment QR" className="my-2" />
                    <DropIn
                      options={{
                        authorization: clientToken,
                        paypal: {
                          flow: "vault",
                        },
                      }}
                      onInstance={(instance) => setInstance(instance)}
                    />

                    <button
                      className="btn btn-primary mb-3"
                      disabled={loading || !instance || !selectedAddress}
                      onClick={handlePayment}
                    >
                      {loading ? "Processing ..." : "Make Payment"}
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            ""
          )}
        </div>
      )}
    </div>
  );
};

export default CartPage;
