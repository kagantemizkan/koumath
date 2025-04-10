import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const BASIC_FUNCTIONS = [
    { label: 'Linear', equation: 'y = 2x + 3' },
    { label: 'Quadratic', equation: 'y = x^2 - 4' },
    { label: 'Cubic', equation: 'y = x^3' },
    { label: 'Simple Equation', equation: '2x + 3 = 15' },
];

const COMPLEX_FUNCTIONS = [
    { label: 'Sine', equation: 'y = sin(x)' },
    { label: 'Tan (have issue)', equation: 'y = tan(x)' },
    { label: 'Exponential', equation: 'y = e^x' },
    { label: 'Square Root', equation: 'y = sqrt(x)' },
    { label: 'Logarithmic', equation: 'y = log(x)' },
    { label: 'Quadratic Formula', equation: 'y = x^2 + 5x + 6' },
];

const FunctionPresets = ({ screenWidth, onPresetSelected }) => {
    return (
        <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={[styles.container, { width: screenWidth - 40 }]}
        >
            <Text style={styles.title}>Function Presets</Text>

            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Basic Functions</Text>
                <ScrollView
                    contentContainerStyle={styles.presetGrid}
                    showsVerticalScrollIndicator={false}
                >
                    {BASIC_FUNCTIONS.map((func, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.presetButton}
                            onPress={() => onPresetSelected(func.equation)}
                        >
                            <Text style={styles.presetLabel}>{func.label}</Text>
                            <Text style={styles.presetEquation}>{func.equation}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Complex Functions</Text>
                <ScrollView
                    contentContainerStyle={styles.presetGrid}
                    showsVerticalScrollIndicator={false}
                >
                    {COMPLEX_FUNCTIONS.map((func, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.presetButton}
                            onPress={() => onPresetSelected(func.equation)}
                        >
                            <Text style={styles.presetLabel}>{func.label}</Text>
                            <Text style={styles.presetEquation}>{func.equation}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
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
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 15,
        color: "#333",
    },
    sectionContainer: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 10,
        color: "#555",
    },
    presetGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    presetButton: {
        width: '48%',
        backgroundColor: '#f0f8ff',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    presetLabel: {
        fontWeight: "600",
        fontSize: 14,
        marginBottom: 5,
        color: "#444",
    },
    presetEquation: {
        fontSize: 13,
        color: "#666",
    },
});

export default FunctionPresets;