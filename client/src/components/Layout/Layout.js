import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import { Helmet } from "react-helmet";
import { Toaster } from "react-hot-toast";
import { useLocation } from "react-router-dom";
import ChatWidget from "../ChatWidget";

const Layout = ({
  children,
  title = "Sweetie Ayman - Shop Now",
  description = "Premium bag marketplace",
  keywords = "bag, handbag, wallet, accessories",
  author = "Sweetie Ayman",
}) => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/dashboard/admin");

  return (
    <div className="app-shell">
      <Helmet>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content={author} />
        <title>{title}</title>
      </Helmet>
      <Header />
      <main className="app-main">
        <Toaster position="top-center" />
        {children}
      </main>
      {!isAdminPage && <ChatWidget />}
      <Footer />
    </div>
  );
};

export default Layout;
