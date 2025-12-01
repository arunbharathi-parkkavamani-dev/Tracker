import React, { useState, useEffect } from 'react';
import { Text, TextInput, TouchableOpacity } from 'react-native';

interface InlineEditProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  canEdit?: boolean;
  multiline?: boolean;
  placeholder?: string;
  textStyle?: object;
}

export default function InlineEdit({ 
  value, 
  onSave, 
  canEdit = true, 
  multiline = false,
  placeholder = "Click to edit",
  textStyle = { color: '#374151' }
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value || '');

  useEffect(() => {
    setInput(value || '');
  }, [value]);

  const save = async () => {
    setEditing(false);
    if (input !== value) {
      try {
        await onSave(input);
      } catch (error) {
        console.error('Error saving:', error);
      }
    }
  };

  const startEdit = () => {
    setInput(value || '');
    setEditing(true);
  };

  if (!canEdit) {
    return <Text style={textStyle}>{value || '—'}</Text>;
  }

  if (editing) {
    return (
      <TextInput
        style={{
          ...textStyle,
          borderBottomWidth: 1,
          borderBottomColor: '#D1D5DB'
        }}
        value={input}
        onChangeText={setInput}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        autoFocus
        onBlur={save}
        onSubmitEditing={save}
        placeholder={placeholder}
      />
    );
  }

  return (
    <TouchableOpacity onPress={startEdit}>
      <Text style={textStyle}>{value || placeholder}</Text>
    </TouchableOpacity>
  );
}