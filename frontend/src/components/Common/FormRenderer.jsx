import { useState, useEffect } from "react";
import { Autocomplete, TextField } from "@mui/material";
import axiosInstance from "../../api/axiosInstance";

const FormRenderer = ({ fields = [], submitButton, onSubmit, onChange, data = {}, value }) => {
  const [formData, setFormData] = useState(data);
  const [dynamicOptions, setDynamicOptions] = useState({});

  // init hidden default fields
  useEffect(() => {
    const hiddenDefaults = {};
    fields.forEach((field) => {
      if (field.hidden && field.value !== undefined) {
        hiddenDefaults[field.name] = field.value;
      }
    });
    setFormData((prev) => ({ ...hiddenDefaults, ...prev }));
  }, [fields]);

  const update = (name, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      onChange?.(updated);
      return updated;
    });
  };

  // fetching dynamic autocomplete options
  const handlePopulate = async (field) => {
    try {
      let url = field.source;

      // ⬇ Detect dependency
      if (field.dependsOn) {
        const parentValue = formData[field.dependsOn];
        if (!parentValue?._id) {
          console.warn(`[Populate skipped] '${field.name}' depends on '${field.dependsOn}' but value missing`);
          return;
        }

        // ⬇ Replace ANY ":something" placeholder with parentValue._id automatically
        url = url.replace(/:\w+/g, parentValue._id);
      }

      let response;
      if (field.dynamicOptions?.params?.aggregate) {
        response = await axiosInstance.post(url, field.dynamicOptions.params);
      } else {
        response = await axiosInstance.get(url);
      }

      let data = response?.data?.data || [];

      // If backend returns {_id, projectTypes: [...]}, extract the array
      if (Array.isArray(data) === false && typeof data === "object") {
        const values = Object.values(data);
        const firstArray = values.find((v) => Array.isArray(v));
        if (firstArray) data = firstArray;
      }

      setDynamicOptions((prev) => ({ ...prev, [field.name]: data }));
    } catch (err) {
      console.error("Autocomplete fetch failed:", err);
    }
  };


  const renderField = (field, value, onChange) => {
    const options = dynamicOptions[field.name] || field.options || [];

    if (field.type === "label") {
      return (
        <div className="p-2 bg-gray-100 font-semibold rounded">
          {field.external ? field.externalValue ?? "—" : value ?? "—"}
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <textarea
          rows={field.rows || 3}
          placeholder={field.placeholder}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border p-2 rounded"
        />
      );
    }

    if (field.type === "AutoComplete") {
      return (
        <Autocomplete
          fullWidth
          onOpen={() => handlePopulate(field)}
          options={options}
          getOptionLabel={(opt) => opt.name || ""}
          value={value || null}
          onChange={(e, newValue) => onChange(newValue)}
          renderInput={(params) => (
            <TextField {...params} label={field.label} />
          )}
        />
      );
    }

    return (
      <input
        type={field.type || "text"}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="w-full border p-2 rounded"
      />
    );
  };

  const onSubmitHandler = (e) => {
    e.preventDefault();
    onSubmit && onSubmit(formData);
  };

  return (
    <form onSubmit={onSubmitHandler} className="space-y-5">
      {fields
        .filter((f) => !f.hidden)
        .sort((a, b) => (a.orderKey ?? 999) - (b.orderKey ?? 999))
        .map((field) => (
          <div key={field.name}>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              {field.label}
            </label>
            {renderField(
              field,
              field.external ? field.externalValue : formData[field.name],
              (val) => update(field.name, val)
            )}
          </div>
        ))}

      <button
        type="submit"
        className={`px-4 py-2 rounded text-white ${submitButton?.color === "green"
          ? "bg-green-500"
          : "bg-blue-500"
          }`}
      >
        {submitButton?.text || "Submit"}
      </button>
    </form>
  );
};

export default FormRenderer;
