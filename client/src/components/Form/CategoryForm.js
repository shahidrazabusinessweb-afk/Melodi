import React from "react";

const CategoryForm = ({
  handleSubmit,
  value,
  setValue,
  brandName,
  setBrandName,
  sizeType,
  setSizeType,
  editForm,
}) => {
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            className="form-control"
            placeholder="Enter the new category"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <select
            className="form-select mt-2"
            value={sizeType}
            onChange={(e) => setSizeType(e.target.value)}
          >
            <option value="none">No sizes</option>
            <option value="dimensions">Height and width</option>
            <option value="apparel">Dress sizes (S, M, L, XL, XXL)</option>
          </select>
          <input
            type="text"
            className="form-control mt-2"
            placeholder="Enter the brand name"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
          />
          <button className="btn btn-primary btn-icon mt-3" type="submit">
            <i className="bi bi-plus-circle-fill" />
            <span>{editForm ? "Update Category" : "Add Category"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;
