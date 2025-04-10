import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const ManualInputPanel = ({ screenWidth, onSubmit }) => {
    const [manualInput, setManualInput] = useState("");

    const handleSubmit = () => {
        if (manualInput.trim()) {
            onSubmit(manualInput);
        }
    };

    return (
        <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={[styles.container, { width: screenWidth - 40 }]}
        >
            <Text style={styles.title}>
                Enter a math function (e.g., y=x^2, x+y=5)
            </Text>
            <TextInput
                style={styles.input}
                value={manualInput}
                onChangeText={setManualInput}
                placeholder="e.g., x=y^2, 2x+3=9"
                autoCapitalize="none"
                autoCorrect={false}
            />
            <TouchableOpacity
                onPress={handleSubmit}
                style={styles.button}
            >
                <Text style={styles.buttonText}>
                    Calculate
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 80,
        backgroundColor: "#FFF",
        borderRadius: 15,
        padding: 15,
        alignSelf: "center",
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    title: {
        marginBottom: 10,
        fontWeight: "600",
        color: "#333"
    },
    input: {
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
    },
    button: {
        backgroundColor: "#09a350",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    buttonText: {
        color: "white",
        fontWeight: "600",
        fontSize: 16
    }
});

export default ManualInputPanel;