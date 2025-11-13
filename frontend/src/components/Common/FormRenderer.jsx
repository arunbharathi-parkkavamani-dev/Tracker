// src/components/common/FormRenderer.jsx
import { useState, useEffect } from "react";
import { Autocomplete, TextField } from "@mui/material";
import axiosInstance from "../../api/axiosInstance";

const FormRenderer = ({ fields = [], submitButton, onSubmit, data = {}, userData }) => {
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

      if(userData?.id){
        url = url.field(":userId", userData.id)
      }
      let options = [];
      const dependencyName = field.dependsOn;
      const dependencyValue = dependencyName ? formData[dependencyName] : null;

      // 🛑 Skip if dependency not selected yet
      if (dependencyName && !dependencyValue) {
        console.warn(`Skipping populate for ${field.name}: depends on ${dependencyName}`);
        return;
      }

      // 🧩 Replace dynamic placeholders if needed
      if (dependencyName && dependencyValue) {
        const depId =
          typeof dependencyValue === "object" && dependencyValue._id
            ? dependencyValue._id
            : dependencyValue;
        url = url.replace(/:clientId|:depId|:id/g, depId);
      }

      console.log("🔗 Final URL for populate:", url);

      // 🧠 Handle dynamicOptions (POST with aggregation params)
      const dynamicOptions = field.dynamicOptions || {};

      let response;
      if (dynamicOptions.params?.aggregate) {
        response = await axiosInstance.post(url, dynamicOptions.params);
      } else {
        response = await axiosInstance.get(url, { params: dynamicOptions.params });
      }

      const data = response?.data?.data || [];

      // 🧾 Normalize list
      options = Array.isArray(data)
        ? data
        : data?.items || data?.projectTypes || [];

      console.log(options)

      // 💾 Store options dynamically
      setDynamicOptions((prev) => ({ ...prev, [field.name]: options }));

      console.log(`✅ Populated ${field.name}:`, options.length, "items");
    } catch (err) {
      console.error(`❌ Error fetching options for ${field.name}:`, err);
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
          className="w-full border border-gray-400 p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-800 block"
        />
      );
    }

    if (field.type === "AutoComplete") {
      return (
        <Autocomplete
          fullWidth // ✅ ensures it stretches to parent width
          onOpen={() => handlePopulate(field)}
          options={options}
          getOptionLabel={(opt) => opt.name || ""}
          value={value || null}
          onChange={(e, newVal) => onChange(newVal)}
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth // ✅ MUI input expands full width
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
          className="w-full rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-800 block"
        />
      );
    }

    return (
      <div className="flex flex-col">
        <input
          type={field.type || "text"}
          placeholder={field.placeholder}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-800"
        />
      </div>
    );
  };

  // --- Render Full Form ---
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 bg-white p-6 rounded-2xl shadow-md"
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
                    className="relative p-4 bg-gray-50 rounded-md"
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
                    <div className="flex flex-col gap-4">
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
