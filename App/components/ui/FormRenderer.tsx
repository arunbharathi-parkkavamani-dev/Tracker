import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import axiosInstance from "../../api/axiosInstance";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";

const FormRenderer = ({
    fields = [],
    submitButton,
    onSubmit,
    onChange,
    data = {},
}) => {
    const [formData, setFormData] = useState(data);
    const [dynamicOptions, setDynamicOptions] = useState({});
    const [dropdownOpen, setDropdownOpen] = useState({});
    const [showDate, setShowDate] = useState({});
    const [loadingFile, setLoadingFile] = useState(false);

    // init hidden default values
    useEffect(() => {
        const hiddenDefaults = {};
        fields.forEach((field) => {
            if (field.hidden && field.value !== undefined) {
                hiddenDefaults[field.name] = field.value;
            }
        });
        setFormData((prev) => ({ ...hiddenDefaults, ...prev }));
    }, [fields]);

    // 🔥 detect when user changed something
    const update = (name, value) => {
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };
            // only call onChange here
            onChange?.(updated);
            return updated;
        });
    };

    const handlePopulate = async (field) => {
        try {
            let res;
            if (field.dynamicOptions?.params?.aggregate) {
                res = await axiosInstance.post(field.source, field.dynamicOptions.params);
            } else {
                res = await axiosInstance.get(field.source);
            }
            const data = res?.data?.data || [];
            setDynamicOptions((prev) => ({ ...prev, [field.name]: data }));
        } catch (e) {
            console.log("Failed", e);
        }
    };

    /* 📌 Pick image/file */
    const pickFile = async (field) => {
        setLoadingFile(true);
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                base64: true,
            });

            if (!result.canceled) {
                const fileData = {
                    uri: result.assets[0].uri,
                    base64: result.assets[0].base64,
                    mime: result.assets[0].mimeType,
                    name: field.name,
                };
                update(field.name, fileData);
            }
        } finally {
            setLoadingFile(false);
        }
    };

    const renderField = (field) => {
        const value = formData[field.name];
        const options = dynamicOptions[field.name] || field.options || [];

        /** Label Field */
        if (field.type === "label") {
            return (
                <View className="p-2 bg-gray-200 rounded-md">
                    <Text className="font-semibold">
                        {field.external ? field.externalValue ?? "—" : value ?? "—"}
                    </Text>
                </View>
            );
        }

        /** Date Picker */
        if (field.type === "date") {
            return (
                <>
                    <TouchableOpacity
                        className="border border-gray-300 p-3 rounded-md"
                        onPress={() => setShowDate((p) => ({ ...p, [field.name]: true }))}
                    >
                        <Text>{value || field.placeholder || "Select date"}</Text>
                    </TouchableOpacity>

                    {showDate[field.name] && (
                        <DateTimePicker
                            value={value ? new Date(value) : new Date()}
                            mode="date"
                            display="calendar"
                            onChange={(e, selected) => {
                                setShowDate((p) => ({ ...p, [field.name]: false }));
                                if (selected) {
                                    update(field.name, selected.toISOString().substring(0, 10));
                                }
                            }}
                        />
                    )}
                </>
            );
        }

        /** File / Image upload */
        if (field.type === "file" || field.type === "image") {
            return (
                <View className="gap-y-2">
                    {value?.uri && field.type === "image" && (
                        <Image source={{ uri: value.uri }} className="w-24 h-24 rounded-md" />
                    )}

                    <TouchableOpacity
                        onPress={() => pickFile(field)}
                        className="bg-gray-200 p-3 rounded-md"
                    >
                        <Text>{loadingFile ? "Uploading..." : field.placeholder || "Choose File"}</Text>
                    </TouchableOpacity>

                    {value?.uri && (
                        <Text className="text-xs text-gray-500">Selected</Text>
                    )}
                </View>
            );
        }

        /** Dropdown + Multi-select support */
        if (field.type === "AutoComplete") {
            const options = Array.isArray(dynamicOptions[field.name])
                ? dynamicOptions[field.name]
                : Array.isArray(field.options)
                    ? field.options
                    : [];

            const items = options.map((o) => ({ label: o.name, value: o }));

            return (
                <View className="mb-6 z-50">
                    <DropDownPicker
                        open={dropdownOpen[field.name] || false}
                        setOpen={(open) =>
                            setDropdownOpen((prev) => ({ ...prev, [field.name]: open }))
                        }
                        items={items}
                        multiple={field.multi || false}
                        value={formData[field.name] || (field.multi ? [] : null)}
                        setValue={(cb) => update(field.name, cb(formData[field.name]))}
                        searchable
                        placeholder={field.placeholder || field.label}
                        onOpen={() => handlePopulate(field)}
                        loading={!options.length}   // optional
                    />
                </View>
            );
        }


        /** Default input */
        return (
            <TextInput
                value={value || ""}
                onChangeText={(t) => update(field.name, t)}
                placeholder={field.placeholder}
                className="border border-gray-300 p-3 rounded-md text-base"
            />
        );
    };

    return (
        <View className="gap-y-6">
            {fields
                .filter((f) => !f.hidden)
                .sort((a, b) => (a.orderKey ?? 999) - (b.orderKey ?? 999))
                .map((field) => (
                    <View key={field.name}>
                        <Text className="mb-1 font-semibold text-gray-700">{field.label}</Text>
                        {renderField(field)}
                    </View>
                ))}

            <TouchableOpacity
                onPress={() => onSubmit && onSubmit(formData)}
                className={`px-4 py-3 rounded-md items-center ${submitButton?.color === "green" ? "bg-green-600" : "bg-blue-600"
                    }`}
            >
                <Text className="text-white font-semibold">{submitButton?.text || "Submit"}</Text>
            </TouchableOpacity>
        </View>
    );
};

export default FormRenderer;
