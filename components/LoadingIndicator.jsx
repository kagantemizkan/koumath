import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing
} from 'react-native-reanimated';

const LoadingIndicator = () => {
    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360, {
                duration: 1000,
                easing: Easing.linear
            }),
            -1
        );

        return () => {
            rotation.value = 0;
        };
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${rotation.value}deg` }],
        };
    });

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.spinner, animatedStyle]} />
            <Text style={styles.text}>Processing mathematics...</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    spinner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 4,
        borderColor: '#09a350',
        borderTopColor: 'transparent',
        marginBottom: 20,
    },
    text: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    }
});

export default LoadingIndicator;