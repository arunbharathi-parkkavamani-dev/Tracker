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
        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 font-semibold rounded-xl border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white">
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
          className="w-full border border-gray-200 dark:border-gray-600 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-800 dark:text-white resize-none"
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
            <TextField 
              {...params} 
              label={field.label}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: 'rgb(249 250 251)',
                  '&:hover': {
                    backgroundColor: 'white',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white',
                  }
                }
              }}
            />
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
        className="w-full border border-gray-200 dark:border-gray-600 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-800 dark:text-white"
      />
    );
  };

  const onSubmitHandler = (e) => {
    e.preventDefault();
    onSubmit && onSubmit(formData);
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-white/20">
      <form onSubmit={onSubmitHandler} className="space-y-6">
        {fields
          .filter((f) => !f.hidden)
          .sort((a, b) => (a.orderKey ?? 999) - (b.orderKey ?? 999))
          .map((field) => (
            <div key={field.name} className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block uppercase tracking-wide">
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
          className={`w-full px-6 py-4 rounded-xl text-white font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl ${
            submitButton?.color === "green"
              ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          }`}
        >
          {submitButton?.text || "Submit"}
        </button>
      </form>
    </div>
  );
};

export default FormRenderer;
