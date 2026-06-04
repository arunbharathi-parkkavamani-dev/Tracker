import { useState, useEffect, useRef } from "react";
import axiosInstance from "../../api/axiosInstance";
import toast from "react-hot-toast";
import { ChevronDown, X, Search, Upload, FileText, Plus, Trash2, Check } from "lucide-react";

/* ════════════════════════════════════════════
   FLOATING LABEL INPUT WRAPPER
   — Material-style label that floats on focus
════════════════════════════════════════════ */
const FloatingField = ({ label, required, filled, focused, children, className = "" }) => (
  <div className={`relative ${className}`}>
    {children}
    {label && (
      <span className={`
        absolute left-3 pointer-events-none select-none
        transition-all duration-200 ease-out
        ${filled || focused
          ? '-top-2 text-[10px] font-semibold px-1.5 bg-white'
          : 'top-1/2 -translate-y-1/2 text-[13px] font-normal'}
        ${focused
          ? 'text-[#111111]'
          : filled
            ? 'text-[#626260]'
            : 'text-[#7b7b78]'}
      `}>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
    )}
  </div>
);

/* ════════════════════════════════════════════
   SEARCHABLE DROPDOWN (replaces MUI Autocomplete)
════════════════════════════════════════════ */
const SearchableSelect = ({ options = [], value, onChange, multiple, labelField, fieldName, placeholder, label, required, onOpen }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setIsFocused(false); }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (!open && onOpen) onOpen();
    setOpen(!open);
    setIsFocused(true);
  };

  const getLabel = (opt) => {
    if (typeof opt === 'string') return opt;
    return opt?.[labelField] || opt?.[fieldName] || opt?.name || "";
  };

  const filtered = options.filter((opt) =>
    getLabel(opt).toLowerCase().includes(search.toLowerCase())
  );

  const isFilled = multiple ? (value || []).length > 0 : !!value;

  const isSelected = (opt) => {
    if (multiple) return (value || []).some(v => (v?._id || v) === (opt?._id || opt));
    return (value?._id || value) === (opt?._id || opt);
  };

  const handleSelect = (opt) => {
    if (multiple) {
      const current = value || [];
      const exists = current.some(v => (v?._id || v) === (opt?._id || opt));
      onChange(exists ? current.filter(v => (v?._id || v) !== (opt?._id || opt)) : [...current, opt]);
    } else {
      onChange(opt);
      setOpen(false);
      setSearch("");
    }
  };

  const removeTag = (opt, e) => {
    e.stopPropagation();
    onChange((value || []).filter(v => (v?._id || v) !== (opt?._id || opt)));
  };

  return (
    <div ref={ref} className="relative">
      <FloatingField label={label} required={required} filled={isFilled} focused={open}>
        <button type="button" onClick={handleOpen}
          className={`
            w-full min-h-[48px] pl-3.5 pr-9 py-2 rounded-[8px] text-left flex items-center gap-1.5 flex-wrap
            bg-white cursor-pointer
            border transition-all duration-200 outline-none
            ${open
              ? 'border-[#111111] ring-1 ring-[#111111]'
              : 'border-[#d3cec6] hover:border-[#a8a39d]'}
          `}
        >
          {multiple && (value || []).map((v, i) => (
            <span key={i} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-[6px] bg-[#f5f1ec] text-[#111111] text-[12px] font-medium border border-[#ebe7e1]">
              {getLabel(v)}
              <span onClick={(e) => removeTag(v, e)} className="p-0.5 rounded-[4px] hover:bg-white transition-colors cursor-pointer text-[#7b7b78] hover:text-[#111111]">
                <X className="h-3 w-3" />
              </span>
            </span>
          ))}
          {!multiple && value && <span className="text-[13px] text-[#111111]">{getLabel(value)}</span>}
        </button>
        <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-transform duration-200 ${open ? 'rotate-180 text-[#111111]' : 'text-[#7b7b78]'}`} />
      </FloatingField>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#d3cec6] rounded-[8px] shadow-sm overflow-hidden">
          {options.length > 4 && (
            <div className="p-2 border-b border-[#ebe7e1]">
              <div className="flex items-center gap-2 px-2.5 h-9 bg-[#f5f1ec] rounded-[6px]">
                <Search className="h-3.5 w-3.5 text-[#7b7b78] flex-shrink-0" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..." autoFocus
                  className="flex-1 bg-transparent text-[13px] text-[#111111] placeholder:text-[#7b7b78] focus:outline-none" />
                {search && <X className="h-3 w-3 text-[#7b7b78] cursor-pointer hover:text-[#111111]" onClick={() => setSearch("")} />}
              </div>
            </div>
          )}
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-[13px] text-[#7b7b78] text-center">No results</div>
            ) : filtered.map((opt, idx) => {
              const sel = isSelected(opt);
              return (
                <div key={opt?._id || opt?.value || idx} onClick={() => handleSelect(opt)}
                  className={`flex items-center justify-between px-3.5 py-2.5 cursor-pointer transition-colors text-[13px] ${sel ? 'bg-[#f5f1ec] text-[#111111] font-medium' : 'text-[#626260] hover:bg-[#f5f1ec]/50 hover:text-[#111111]'}`}
                >
                  <span>{getLabel(opt)}</span>
                  {sel && <Check className="h-3.5 w-3.5 text-[#111111] flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════
   FORM RENDERER
════════════════════════════════════════════ */
const FormRenderer = ({ fields = [], submitButton, onSubmit, onChange, data = {}, value }) => {
  const [formData, setFormData] = useState(data);
  const [changedFields, setChangedFields] = useState({});
  const [dynamicOptions, setDynamicOptions] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    const defaults = {};
    fields.forEach((field) => {
      if (field.default !== undefined) defaults[field.name] = field.default;
      if (field.hidden && field.value !== undefined) defaults[field.name] = field.value;
    });
    setFormData((prev) => ({ ...defaults, ...data, ...prev }));
  }, [fields, data]);

  const getNestedValue = (obj, path) => path.split('.').reduce((c, k) => c?.[k], obj);

  const setNestedValue = (obj, path, value) => {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (typeof current[key] === 'string' && (current[key].startsWith('{') || current[key].startsWith('['))) {
        try { current[key] = JSON.parse(current[key]); } catch (e) { current[key] = {}; }
      }
      if (!current[key] || typeof current[key] !== 'object') current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
    return obj;
  };

  const update = (name, value) => {
    setFormData((prev) => {
      const updated = { ...prev };
      setNestedValue(updated, name, value);
      setChangedFields(p => ({ ...p, [name]: value }));
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

  const handleAutoFetch = async (field, value) => {
    try {
      const response = await fetch(`https://ifsc.razorpay.com/${value}`);
      if (response.ok) {
        const data = await response.json();
        if (data.BANK && field.autoFetch.target) {
          setFormData(prev => {
            const updated = { ...prev };
            setNestedValue(updated, field.autoFetch.target, data.BANK);
            onChange?.(updated);
            return updated;
          });
        }
      }
    } catch (error) { /* silent */ }
  };

  const handlePopulate = async (field) => {
    if (dynamicOptions[field.name]?.length > 0) return;
    try {
      let url = field.source;
      if (field.dependsOn) {
        const parentValue = getNestedValue(formData, field.dependsOn);
        if (!parentValue?._id) return;
        url = url.replace(/:\w+/g, parentValue._id);
        if (field.name.includes('city') && field.dependsOn.includes('state')) {
          const countryValue = getNestedValue(formData, field.dependsOn.replace('state', 'country'));
          if (countryValue?._id) url += `?countryCode=${countryValue._id}`;
        }
      }
      const [baseUrl, queryString] = url.split('?');
      let payload = {};
      if (queryString) {
        const sp = new URLSearchParams(queryString);
        for (const [k, v] of sp.entries()) { try { payload[k] = JSON.parse(v); } catch { payload[k] = v; } }
      }
      if (field.dynamicOptions?.params?.aggregate) {
        payload.aggregate = true;
        payload.stages = field.dynamicOptions.params.stages;
      }
      const response = await axiosInstance.post(baseUrl, Object.keys(payload).length > 0 ? payload : undefined);
      let d = response?.data?.data || [];
      if (!Array.isArray(d) && typeof d === "object") {
        const arr = Object.values(d).find(v => Array.isArray(v));
        if (arr) d = arr;
      }
      if (field.transform && typeof field.transform === 'function') d = field.transform(d);
      setDynamicOptions(prev => ({ ...prev, [field.name]: d }));
    } catch (err) { console.error("Autocomplete fetch failed:", err); }
  };

  /* ═════════════ FIELD RENDERER ═════════════ */
  const renderField = (field, value, onFieldChange) => {
    const options = dynamicOptions[field.name] || field.options || [];
    const isFocused = focusedField === field.name;
    const filled = value !== undefined && value !== null && value !== "";

    const inputCls = `
      w-full h-12 px-3.5 pt-4 pb-1 rounded-[8px] text-[13px]
      bg-white
      border transition-all duration-200 outline-none
      text-[#111111]
      ${isFocused
        ? 'border-[#111111] ring-1 ring-[#111111]'
        : 'border-[#d3cec6] hover:border-[#a8a39d]'}
    `;

    /* ── Label (read-only display) ── */
    if (field.type === "label") {
      return (
        <FloatingField label={field.label} required={field.required} filled={true} focused={false}>
          <div className="w-full h-12 px-3.5 pt-5 pb-1 rounded-[8px] text-[13px] font-medium bg-[#f5f1ec] border border-[#d3cec6] text-[#111111]">
            {field.external ? field.externalValue ?? "—" : value ?? "—"}
          </div>
        </FloatingField>
      );
    }

    /* ── Select ── */
    if (field.type === "select") {
      const selectedOpt = field.options?.find(o => (o._id ?? o.value) === value) || null;
      return (
        <SearchableSelect
          options={field.options || []}
          value={selectedOpt}
          onChange={(opt) => onFieldChange(opt?._id ?? opt?.value ?? opt)}
          multiple={false}
          labelField="name"
          fieldName="label"
          label={field.label}
          required={field.required}
        />
      );
    }

    /* ── SubForm ── */
    if (field.type === "SubForm") {
      const subFormValue = field.multiple ? (value || []) : (value || {});

      if (field.multiple) {
        return (
          <div className="space-y-3">
            {subFormValue.map((item, index) => (
              <div key={index} className="rounded-[12px] border border-[#ebe7e1] p-4 bg-white relative group hover:border-[#d3cec6] transition-colors">
                <button type="button" onClick={() => onFieldChange(subFormValue.filter((_, i) => i !== index))}
                  className="absolute top-3 right-3 p-1.5 rounded-[6px] text-[#7b7b78] hover:text-[#c41c1c] hover:bg-[#c41c1c]/10 transition-all opacity-0 group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <div className="grid grid-cols-1 gap-4 pr-8">
                  {field.subFormFields?.map((subField) => (
                    <div key={subField.name}>
                      {renderField(subField, item[subField.name], (val) => {
                        const updated = [...subFormValue];
                        updated[index] = { ...updated[index], [subField.name]: val };
                        onFieldChange(updated);
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button type="button" onClick={() => {
              const newItem = {};
              field.subFormFields?.forEach(sf => { newItem[sf.name] = ""; });
              onFieldChange([...subFormValue, newItem]);
            }}
              className="w-full py-3 rounded-[8px] border border-dashed border-[#d3cec6] text-[13px] font-medium text-[#626260] hover:border-[#111111] hover:text-[#111111] hover:bg-[#f5f1ec] transition-all cursor-pointer flex items-center justify-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add {field.label}
            </button>
          </div>
        );
      } else {
        return (
          <div className="rounded-[12px] border border-[#ebe7e1] p-4 bg-white">
            <div className="grid grid-cols-1 gap-4">
              {field.subFormFields?.map((subField) => (
                <div key={subField.name}>
                  {renderField(subField, subFormValue[subField.name], (val) => onFieldChange({ ...subFormValue, [subField.name]: val }))}
                </div>
              ))}
            </div>
          </div>
        );
      }
    }

    /* ── Textarea ── */
    if (field.type === "textarea") {
      return (
        <FloatingField label={field.label} required={field.required} filled={filled} focused={isFocused}
          className="[&>span]:top-3 [&>span]:translate-y-0"
        >
          <textarea
            rows={field.rows || 3}
            value={value || ""}
            onChange={(e) => onFieldChange(e.target.value)}
            onFocus={() => setFocusedField(field.name)}
            onBlur={() => setFocusedField(null)}
            className={`
              w-full px-3.5 pt-5 pb-2 rounded-[8px] text-[13px] resize-none
              bg-white
              border transition-all duration-200 outline-none
              text-[#111111]
              ${isFocused
                ? 'border-[#111111] ring-1 ring-[#111111]'
                : 'border-[#d3cec6] hover:border-[#a8a39d]'}
            `}
          />
        </FloatingField>
      );
    }

    /* ── File Upload ── */
    if (field.type === "file") {
      const hasFile = !!value;
      return (
        <label htmlFor={`file-${field.name.replace(/\./g, '-')}`}
          className={`flex items-center gap-3 px-3.5 py-3 rounded-[8px] cursor-pointer group transition-all duration-200
            border border-dashed bg-white
            ${hasFile ? 'border-[#111111] bg-[#f5f1ec]' : 'border-[#d3cec6] hover:border-[#111111] hover:bg-[#f5f1ec]'}
          `}
        >
          <input type="file" accept={field.accept} onChange={(e) => onFieldChange(e.target.files[0])} className="hidden" id={`file-${field.name.replace(/\./g, '-')}`} />
          {hasFile && (field.accept?.includes('image')) ? (
            <img src={typeof value === 'string' ? (value.startsWith('http') ? value : (value.includes('serve/') ? `${axiosInstance.defaults.baseURL.replace('/api', '')}/api/files/${value}` : `${axiosInstance.defaults.baseURL.replace('/api', '')}/api/files/render/profile/${value.split('/').pop()}`)) : (value instanceof Blob || value instanceof File) ? URL.createObjectURL(value) : ''}
              alt="" className="w-10 h-10 object-cover rounded-[6px] border border-[#d3cec6]" />
          ) : (
            <div className={`h-10 w-10 rounded-[6px] flex items-center justify-center flex-shrink-0 transition-colors ${hasFile ? 'bg-white border border-[#d3cec6]' : 'bg-[#f5f1ec] group-hover:bg-white border border-transparent group-hover:border-[#d3cec6]'}`}>
              {hasFile ? <FileText className="h-4 w-4 text-[#111111]" /> : <Upload className="h-4 w-4 text-[#7b7b78] group-hover:text-[#111111] transition-colors" />}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-[13px] font-medium truncate transition-colors ${hasFile ? 'text-[#111111]' : 'text-[#626260] group-hover:text-[#111111]'}`}>
              {hasFile ? (typeof value === 'string' ? 'Change file' : value.name) : 'Click to upload'}
            </p>
            <p className="text-[11px] text-[#7b7b78] mt-0.5">{field.accept?.replace('/*', '') || 'Any file'}</p>
          </div>
        </label>
      );
    }

    /* ── AutoComplete ── */
    if (field.type === "AutoComplete") {
      return (
        <SearchableSelect
          options={options}
          value={field.multiple ? (value || []) : (value || null)}
          onChange={onFieldChange}
          multiple={field.multiple}
          labelField={field.labelField}
          fieldName={field.fieldName}
          label={field.label}
          required={field.required}
          placeholder={field.placeholder}
          onOpen={() => handlePopulate(field)}
        />
      );
    }

    /* ── Date ── */
    if (field.type === "date") {
      return (
        <FloatingField label={field.label} required={field.required} filled={filled} focused={isFocused}>
          <input
            type="date"
            value={value || ""}
            onChange={(e) => onFieldChange(e.target.value)}
            onFocus={() => setFocusedField(field.name)}
            onBlur={() => setFocusedField(null)}
            className={`${inputCls} cursor-pointer [color-scheme:light] dark:[color-scheme:dark] ${!filled ? '[&::-webkit-datetime-edit]:text-transparent' : ''}`}
          />
        </FloatingField>
      );
    }

    /* ── Default Text/Number/Email/etc ── */
    return (
      <FloatingField label={field.label} required={field.required} filled={filled} focused={isFocused}>
        <input
          type={field.type || "text"}
          value={typeof value === 'object' && value !== null ? JSON.stringify(value) : (value || "")}
          onChange={(e) => {
            onFieldChange(e.target.value);
            if (field.autoFetch && e.target.value.length === 11) handleAutoFetch(field, e.target.value);
          }}
          onFocus={() => setFocusedField(field.name)}
          onBlur={() => setFocusedField(null)}
          className={inputCls}
        />
      </FloatingField>
    );
  };

  /* ═════════ SUBMIT ═════════ */
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      const { _id, createdAt, updatedAt, __v, ...cleanData } = formData;
      if (onSubmit) await onSubmit(cleanData);
      else console.error('onSubmit function is not provided!');
    } catch (error) {
      console.error('FormRenderer submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to save changes');
    }
  };

  /* ═════════ RENDER ═════════ */
  return (
    <form onSubmit={onSubmitHandler} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
        {fields
          .filter((f) => !f.hidden)
          .sort((a, b) => (a.orderKey ?? 999) - (b.orderKey ?? 999))
          .map((field) => (
            <div key={field.name} className={field.gridClass || 'col-span-1'}>
              {renderField(
                field,
                field.external ? field.externalValue : getNestedValue(formData, field.name),
                (val) => update(field.name, val)
              )}
            </div>
          ))}
      </div>

      <button type="submit"
        className="tracker-btn-primary w-full h-[44px] text-[14px] cursor-pointer"
      >
        {submitButton?.text || "Submit"}
      </button>
    </form>
  );
};

export default FormRenderer;
