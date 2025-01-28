import React from 'react';
import { View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const TransparentViewTop = () => {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(91, 91, 91, 0.3)', 'rgba(91, 91, 91, 0)', 'rgba(91, 91, 91, 0)', 'rgba(91, 91, 91, 0)', 'rgba(91, 91, 91, 0)']}
                style={styles.gradient}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        pointerEvents: "none",
        position: "absolute",
        left: 0,
        right: 0,
        top: 0, // Positioned at the top of the screen
        height: 700, // Set height to a specific value (adjust as necessary)
        zIndex: 10, // High enough to overlay other components
    },
    gradient: {
        flex: 1,
    },
});

export default TransparentViewTop;