import React from 'react';
import { View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const TransparentViewBottom = () => {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(91, 91, 91, 0)', 'rgba(91, 91, 91, 0)', 'rgba(91, 91, 91, 0)', 'rgba(91, 91, 91, 0)', 'rgba(91, 91, 91, 0.25)']}
                style={styles.gradient}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        pointerEvents: "none",
        position: "absolute",
        top: 0, // Adjust as needed
        left: 0, // Adjust as needed
        right: 0, // Ensures it stretches across the screen
        bottom: 0, // Ensures it stretches down the screen
        zIndex: 1, // Optional: ensure it's above other components
    },
    gradient: {
        flex: 1,
    },
});

export default TransparentViewBottom;