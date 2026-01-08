import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, Modal } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import axiosInstance from "../../api/axiosInstance";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";

interface FormField {
    name: string;
    label?: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    hidden?: boolean;
    value?: any;
    source?: string;
    options?: any[];
    dynamicOptions?: {
        params?: {
            aggregate?: boolean;
            stages?: any[];
            [key: string]: any;
        };
    };
    external?: boolean;
    externalValue?: any;
    accept?: string[];
    gridClass?: string;
    orderKey?: number;
}

interface FormRendererProps {
    fields: FormField[];
    submitButton?: {
        text?: string;
        color?: string;
    };
    onSubmit?: (data: any) => void;
    onChange?: (data: any) => void;
    data?: any;
}

const FormRenderer = ({
    fields = [],
    submitButton,
    onSubmit,
    onChange,
    data = {},
}: FormRendererProps) => {
    const [formData, setFormData] = useState<any>(data);
    const [dynamicOptions, setDynamicOptions] = useState<Record<string, any[]>>({});
    const [dropdownOpen, setDropdownOpen] = useState<Record<string, boolean>>({});
    const [showDate, setShowDate] = useState<Record<string, boolean>>({});
    const [loadingFile, setLoadingFile] = useState(false);

    // init hidden default values
    useEffect(() => {
        const hiddenDefaults: Record<string, any> = {};
        fields.forEach((field) => {
            if (field.hidden && field.value !== undefined) {
                hiddenDefaults[field.name] = field.value;
            }
        });
        setFormData((prev: any) => ({ ...hiddenDefaults, ...prev }));
    }, [fields]);

    // Separate effect for populating AutoComplete options
    useEffect(() => {
        fields.forEach((field) => {
            if (field.type === "AutoComplete" && field.source) {
                handlePopulate(field);
            }
        });
    }, [fields]);

    // 🔥 detect when user changed something
    const update = (name: string, value: any) => {
        setFormData((prev: any) => {
            const updated = { ...prev, [name]: value };
            // only call onChange here
            onChange?.(updated);
            return updated;
        });
    };

    const handlePopulate = async (field: FormField) => {
        try {
            let res;
            if (field.dynamicOptions?.params?.aggregate) {
                // For aggregate queries, send the full params object
                res = await axiosInstance.post(field.source!, field.dynamicOptions.params);
            } else {
                res = await axiosInstance.get(field.source!);
            }

            let dataArr = res?.data?.data || res?.data || [];

            // Handle case where data is a single object instead of array
            if (!Array.isArray(dataArr)) {
                dataArr = [dataArr];
            }


            setDynamicOptions((prev) => ({ ...prev, [field.name]: dataArr }));
        } catch (e) {
            // console.log(`Failed to populate ${field.name}:`, e);
        }
    };

    /* 📌 Pick image/file */
    const pickFile = async (field: FormField) => {
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

    const renderField = (field: FormField) => {
        const value = formData[field.name];
        const options = dynamicOptions[field.name] || field.options || [];

        const formatValue = (val: any, type?: string) => {
            if (!val) return null;

            // If it's a simple time format (HH:mm) and the type is time, return as is
            if (type === "time" && typeof val === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(val)) {
                return val;
            }

            try {
                const date = new Date(val);
                if (isNaN(date.getTime())) return val;

                if (type === "date") {
                    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                }
                if (type === "time") {
                    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                }
                if (type === "datetime-local") {
                    return date.toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', hour12: true
                    });
                }
                return val;
            } catch {
                return val;
            }
        };

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
        if (field.type === "date" || field.type === "time" || field.type === "datetime-local") {
            const mode = field.type === "time" ? "time" : "date";
            const isDateTime = field.type === "datetime-local";

            return (
                <>
                    <TouchableOpacity
                        className="border border-gray-300 p-3 rounded-md"
                        onPress={() => setShowDate((p) => ({ ...p, [field.name]: true }))}
                    >
                        <Text className="text-gray-700">
                            {formatValue(value, field.type) || field.placeholder || `Select ${field.type}`}
                        </Text>
                    </TouchableOpacity>

                    {showDate[field.name] && (
                        <DateTimePicker
                            value={value ? new Date(value) : new Date()}
                            mode={mode}
                            display="default"
                            onChange={(e, selected) => {
                                setShowDate((p) => ({ ...p, [field.name]: false }));
                                if (selected) {
                                    if (field.type === "date") {
                                        update(field.name, selected.toISOString().substring(0, 10));
                                    } else if (field.type === "time") {
                                        // Format as HH:mm
                                        const hh = String(selected.getHours()).padStart(2, '0');
                                        const mm = String(selected.getMinutes()).padStart(2, '0');
                                        update(field.name, `${hh}:${mm}`);
                                    } else if (field.type === "datetime-local") {
                                        update(field.name, selected.toISOString());
                                    }
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
                <View className="bg-blue-50 rounded-xl p-4 border-2 border-dashed border-blue-300">
                    {value?.uri && (
                        <View className="mb-4">
                            {field.accept?.includes('image') || field.type === "image" ? (
                                <Image source={{ uri: value.uri }} className="w-24 h-24 rounded-lg" />
                            ) : (
                                <View className="flex-row items-center gap-2 p-3 bg-white rounded-lg">
                                    <View className="w-6 h-6 bg-blue-500 rounded items-center justify-center">
                                        <Text className="text-white text-xs">📄</Text>
                                    </View>
                                    <Text className="text-sm font-medium text-gray-700">File Selected</Text>
                                </View>
                            )}
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={() => pickFile(field)}
                        className="items-center py-4"
                        disabled={loadingFile}
                    >
                        <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center mb-2">
                            <Text className="text-white text-xl">+</Text>
                        </View>
                        <Text className="text-sm font-medium text-gray-700 mb-1">
                            {loadingFile ? "Uploading..." : value?.uri ? "Change File" : "Upload File"}
                        </Text>
                        <Text className="text-xs text-gray-500">
                            {field.accept || "Any file type"}
                        </Text>
                    </TouchableOpacity>
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

            const selectedValue = formData[field.name];
            const displayText = selectedValue?.name || field.placeholder || field.label;

            return (
                <View className="mb-6">
                    <TouchableOpacity
                        className="border border-gray-300 p-3 rounded-md"
                        onPress={() => {
                            handlePopulate(field);
                            setDropdownOpen((prev) => ({ ...prev, [field.name]: true }));
                        }}
                    >
                        <Text>{displayText}</Text>
                    </TouchableOpacity>

                    <Modal
                        visible={dropdownOpen[field.name] || false}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setDropdownOpen((prev) => ({ ...prev, [field.name]: false }))}
                    >
                        <View className="flex-1 justify-end bg-black/50">
                            <View className="bg-white rounded-t-3xl max-h-96">
                                <View className="p-4 border-b border-gray-200">
                                    <Text className="text-lg font-semibold">{field.label}</Text>
                                    <TouchableOpacity
                                        className="absolute right-4 top-4"
                                        onPress={() => setDropdownOpen((prev) => ({ ...prev, [field.name]: false }))}
                                    >
                                        <Text className="text-xl">×</Text>
                                    </TouchableOpacity>
                                </View>
                                <FlatList
                                    data={options}
                                    keyExtractor={(item, index) => item._id || index.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            className="p-4 border-b border-gray-100"
                                            onPress={() => {
                                                update(field.name, item);
                                                setDropdownOpen((prev) => ({ ...prev, [field.name]: false }));
                                            }}
                                        >
                                            <Text className="text-gray-900">{item.name}</Text>
                                        </TouchableOpacity>
                                    )}
                                    ListEmptyComponent={
                                        <View className="p-8 items-center">
                                            <Text className="text-gray-500">No options available</Text>
                                        </View>
                                    }
                                />
                            </View>
                        </View>
                    </Modal>
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
                        {field.type !== "file" && field.type !== "image" && (
                            <Text className="mb-1 font-semibold text-gray-700">{field.label}</Text>
                        )}
                        {field.type === "file" || field.type === "image" ? (
                            <View className="mb-2">
                                <Text className="mb-2 font-semibold text-gray-700">{field.label}</Text>
                                {renderField(field)}
                            </View>
                        ) : (
                            renderField(field)
                        )}
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
