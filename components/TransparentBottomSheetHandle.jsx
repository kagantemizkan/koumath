import React from 'react';
import { View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const TransparentBottomSheetHandle = () => {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(91, 91, 91, 0)', 'rgba(91, 91, 91, 0.99)']}
                style={styles.gradient}
            />
            <View style={styles.handle} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center', // Center the handle horizontally
    },
    gradient: {
        width: '100%',
        height: 30,
        top: -29,
    },
    handle: {
        width: 40, // Adjust the width of the handle as needed
        height: 5, // Adjust the height of the handle as needed
        backgroundColor: 'rgba(255, 255, 255, 0.7)', // Color of the handle
        borderRadius: 2.5, // To make the edges rounded
        position: 'absolute', // Positioning the handle over the gradient
        top: -10, // Position the handle above the gradient
    },
});

export default TransparentBottomSheetHandle;
