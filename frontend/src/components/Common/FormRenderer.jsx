// src/components/common/FormRenderer.jsx
import { useState, useEffect } from "react";
import { Autocomplete, TextField } from "@mui/material";
import axiosInstance from "../../api/axiosInstance";

const FormRenderer = ({ fields = [], submitButton, onSubmit, data = {} }) => {
  const [formData, setFormData] = useState(data);
  const [dynamicOptions, setDynamicOptions] = useState({});

  // --- Initialize Hidden Fields ---
  useEffect(() => {
    const hiddenDefaults = {};
    fields.forEach((field) => {
      if (field.hidden) hiddenDefaults[field.name] = field.value || "";
    });
    setFormData((prev) => ({ ...hiddenDefaults, ...prev }));
  }, [fields]);

  // --- Handle Input Changes ---
  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (name, file) => {
    setFormData((prev) => ({ ...prev, [name]: file }));
  };

  // --- Fetch Dynamic Options ---
  const handlePopulate = async (field) => {
    try {
      let url = field.source;

      // Handle dependency (e.g., :clientId in URL)
      if (field.dependsOn && formData[field.dependsOn]) {
        url = url.replace(
          `:${field.dependsOn}Id`,
          formData[field.dependsOn]._id || formData[field.dependsOn]
        );
      }

      const res = await axiosInstance.get(url);
      const list = Array.isArray(res.data.data)
        ? res.data.data
        : res.data.data?.projectTypes || [];

      setDynamicOptions((prev) => ({ ...prev, [field.name]: list }));
    } catch (err) {
      console.error(`Error fetching options for ${field.name}:`, err);
    }
  };

  // --- Handle Multi Group (activities) ---
  const handleGroupChange = (groupName, index, fieldName, value) => {
    setFormData((prev) => {
      const groupArray = prev[groupName] || [];
      const updatedGroup = groupArray.map((item, i) =>
        i === index ? { ...item, [fieldName]: value } : item
      );
      return { ...prev, [groupName]: updatedGroup };
    });
  };

  const handleAddGroup = (groupName, fields) => {
    setFormData((prev) => {
      const groupArray = prev[groupName] || [];
      const newGroup = {};
      fields.forEach((f) => {
        newGroup[f.name] = f.type === "AutoComplete" ? null : "";
      });
      return { ...prev, [groupName]: [...groupArray, newGroup] };
    });
  };

  const handleRemoveGroup = (groupName, index) => {
    setFormData((prev) => {
      const updatedGroup = (prev[groupName] || []).filter((_, i) => i !== index);
      return { ...prev, [groupName]: updatedGroup };
    });
  };

  // --- Submit Handler ---
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);
  };

  // --- Render Helper for Input Types ---
  const renderField = (field, value, onChange) => {
    const options = dynamicOptions[field.name] || field.options || [];

    if (field.type === "textarea") {
      return (
        <textarea
          rows={field.rows || 3}
          placeholder={field.placeholder}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-800 w-full"
        />
      );
    }

    if (field.type === "AutoComplete") {
      return (
        <Autocomplete
          onOpen={() => handlePopulate(field)}
          options={options}
          getOptionLabel={(opt) => opt.name || ""}
          value={value || null}
          onChange={(e, newVal) => onChange(newVal)}
          renderInput={(params) => (
            <TextField
              {...params}
              label={field.placeholder || field.label}
              required={field.required}
            />
          )}
        />
      );
    }

    if (field.type === "file") {
      return (
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileChange(field.name, file);
          }}
          className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-800 w-full"
        />
      );
    }

    return (
      <input
        type={field.type || "text"}
        placeholder={field.placeholder}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-800 w-full"
      />
    );
  };

  // --- Render Full Form ---
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 bg-white p-6 rounded-2xl shadow-md border border-gray-100"
    >
      {fields
        .filter((field) => !field.hidden)
        .map((field) => {
          // 🧱 MultiGroup Section
          if (field.type === "multiGroup") {
            const groupArray = formData[field.name] || [];
            return (
              <div key={field.name} className="space-y-4">
                <h3 className="text-lg font-semibold">{field.label}</h3>

                {groupArray.map((item, index) => (
                  <div
                    key={index}
                    className="relative p-4 bg-gray-50 rounded-md border"
                  >
                    {groupArray.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveGroup(field.name, index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    )}
                    <div className="grid md:grid-cols-2 gap-4">
                      {field.fields.map((subField) => (
                        <div key={subField.name}>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">
                            {subField.label}
                          </label>
                          {renderField(
                            subField,
                            item[subField.name],
                            (val) =>
                              handleGroupChange(
                                field.name,
                                index,
                                subField.name,
                                val
                              )
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => handleAddGroup(field.name, field.fields)}
                  className="text-blue-600 hover:underline"
                >
                  + Add Another {field.label.slice(0, -1)}
                </button>
              </div>
            );
          }

          // 🧩 Normal Field
          return (
            <div key={field.name} className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              {renderField(field, formData[field.name], (val) =>
                handleChange(field.name, val)
              )}
            </div>
          );
        })}

      <div className="flex justify-end">
        <button
          type="submit"
          className={`px-5 py-2 rounded-md text-white font-medium shadow-sm transition-colors duration-200 ${
            submitButton?.color === "green"
              ? "bg-green-500 hover:bg-green-600"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {submitButton?.text || "Submit"}
        </button>
      </div>
    </form>
  );
};

export default FormRenderer;
