// src/components/common/FormRenderer.jsx
import React, { useState, useEffect } from "react";

const FormRenderer = ({
  fields = [],
  submitButton,
  onSubmit,
  data = {},
  dynamicOptions = {},
}) => {
  const [formData, setFormData] = useState(data);

  // Initialize hidden fields (so they exist in formData)
  useEffect(() => {
    const hiddenDefaults = {};
    fields.forEach((field) => {
      if (field.hidden) hiddenDefaults[field.name] = field.value || "";
    });
    setFormData((prev) => ({ ...hiddenDefaults, ...prev }));
  }, [fields]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (name, file) => {
    setFormData((prev) => ({ ...prev, [name]: file }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 bg-white p-6 rounded-2xl shadow-md border border-gray-100"
    >
      {fields
        .filter((field) => !field.hidden)
        .map((field) => {
          const options =
            field.optionsKey && dynamicOptions[field.optionsKey]
              ? dynamicOptions[field.optionsKey]
              : field.options || [];

          return (
            <div key={field.name} className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.type === "select" ? (
                <select
                  value={formData[field.name] || ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-800"
                >
                  <option value="">
                    {field.placeholder || "Select option"}
                  </option>
                  {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  rows={field.rows || 3}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-800"
                />
              ) : field.type === "file" ? (
                <input
                  type="file"
                  onChange={(e) => handleFileChange(field.name, e.target.files[0])}
                  className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-800"
                />
              ) : (
                <input
                  type={field.type || "text"}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-800"
                />
              )}
            </div>
          );
        })}

      <div className="flex justify-end">
        <button
          type="submit"
          className={`px-5 py-2 rounded-md text-white font-medium shadow-sm transition-colors duration-200 ${
            submitButton.color === "green"
              ? "bg-green-500 hover:bg-green-600"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {submitButton.text}
        </button>
      </div>
    </form>
  );
};

export default FormRenderer;
