import { useState, useEffect } from "react";
import { Autocomplete, TextField } from "@mui/material";
import axiosInstance from "../../api/axiosInstance";
import toast from "react-hot-toast";

const FormRenderer = ({ fields = [], submitButton, onSubmit, onChange, data = {}, value }) => {
  const [formData, setFormData] = useState(data);
  const [changedFields, setChangedFields] = useState({});
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

  // Helper function to get nested values
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Helper function to set nested values
  const setNestedValue = (obj, path, value) => {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
    return obj;
  };

  const update = (name, value) => {
    setFormData((prev) => {
      const updated = { ...prev };
      setNestedValue(updated, name, value);
      
      // Track changed fields
      setChangedFields(prevChanged => {
        return {
          ...prevChanged,
          [name]: value
        };
      });
      
      // Clear dependent fields when parent changes
      if (name.includes('country')) {
        setNestedValue(updated, name.replace('country', 'state'), null);
        setNestedValue(updated, name.replace('country', 'city'), null);
      } else if (name.includes('state')) {
        setNestedValue(updated, name.replace('state', 'city'), null);
      }
      
      onChange?.(updated);
      return updated;
    });
  };

  // Auto-fetch functionality for fields like IFSC code
  const handleAutoFetch = async (field, value) => {
    try {
      // Use public IFSC API directly from frontend
      const response = await fetch(`https://ifsc.razorpay.com/${value}`);
      if (response.ok) {
        const data = await response.json();
        const bankName = data.BANK;
        
        if (bankName && field.autoFetch.target) {
          setFormData(prev => {
            const updated = { ...prev };
            setNestedValue(updated, field.autoFetch.target, bankName);
            onChange?.(updated);
            return updated;
          });
        }
      }
    } catch (error) {
      console.log('IFSC lookup failed:', error.message);
    }
  };

  // fetching dynamic autocomplete options
  const handlePopulate = async (field) => {
    try {
      let url = field.source;

      // ⬇ Detect dependency
      if (field.dependsOn) {
        const parentValue = getNestedValue(formData, field.dependsOn);
        if (!parentValue?._id) {
          console.warn(`[Populate skipped] '${field.name}' depends on '${field.dependsOn}' but value missing`);
          return;
        }

        // ⬇ Replace ANY ":something" placeholder with parentValue._id automatically
        url = url.replace(/:\w+/g, parentValue._id);
        
        // Add country code for cities endpoint
        if (field.name.includes('city') && field.dependsOn.includes('state')) {
          const countryValue = getNestedValue(formData, field.dependsOn.replace('state', 'country'));
          if (countryValue?._id) {
            url += `?countryCode=${countryValue._id}`;
          }
        }
      }

      let response;
      if (field.dynamicOptions?.params?.aggregate) {
        // For aggregate queries, send as query params
        const params = new URLSearchParams();
        params.append('aggregate', 'true');
        params.append('stages', JSON.stringify(field.dynamicOptions.params.stages));
        response = await axiosInstance.get(`${url}?${params.toString()}`);
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

    if (field.type === "file") {
      return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 border-2 border-dashed border-blue-300 dark:border-gray-500 transition-all duration-200 hover:border-blue-400 dark:hover:border-gray-400">
          {value && (
            <div className="mb-4">
              {(field.accept?.includes('image') || field.type === 'image') ? (
                <img 
                  src={typeof value === 'string' ? value : URL.createObjectURL(value)} 
                  alt="Preview" 
                  className="w-24 h-24 object-cover rounded-lg shadow-md"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {typeof value === 'string' ? 'Current file' : value.name}
                  </span>
                </div>
              )}
            </div>
          )}
          <input
            type="file"
            accept={field.accept}
            onChange={(e) => {
              onChange(e.target.files[0]);
            }}
            className="hidden"
            id={`file-${field.name.replace(/\./g, '-')}`}
          />
          <label 
            htmlFor={`file-${field.name.replace(/\./g, '-')}`}
            className="flex flex-col items-center justify-center cursor-pointer group"
          >
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-600 transition-colors">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {value ? 'Change File' : 'Upload File'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {field.accept?.replace('/*', ' files') || 'Any file type'}
            </p>
          </label>
        </div>
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
        onChange={(e) => {
          onChange(e.target.value);
          // Auto-fetch functionality for IFSC codes
          if (field.autoFetch && e.target.value.length === 11) {
            handleAutoFetch(field, e.target.value);
          }
        }}
        placeholder={field.placeholder}
        className="w-full border border-gray-200 dark:border-gray-600 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-800 dark:text-white"
      />
    );
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      await onSubmit?.(changedFields);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save changes');
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-white/20">
      <form onSubmit={onSubmitHandler} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {fields
            .filter((f) => !f.hidden)
            .sort((a, b) => (a.orderKey ?? 999) - (b.orderKey ?? 999))
            .map((field) => (
              <div key={field.name} className={`space-y-2 ${field.gridClass || 'col-span-1'}`}>
                {field.type === "file" ? (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block uppercase tracking-wide mb-3">
                      {field.label}
                    </label>
                    {renderField(
                      field,
                      field.external ? field.externalValue : getNestedValue(formData, field.name),
                      (val) => update(field.name, val)
                    )}
                  </div>
                ) : (
                  <>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block uppercase tracking-wide">
                      {field.label}
                    </label>
                    {renderField(
                      field,
                      field.external ? field.externalValue : getNestedValue(formData, field.name),
                      (val) => update(field.name, val)
                    )}
                  </>
                )}
              </div>
            ))}
        </div>

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
