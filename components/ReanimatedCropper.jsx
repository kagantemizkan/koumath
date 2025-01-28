import React, { useState, useEffect } from 'react';
import { View, Dimensions, StyleSheet, Image } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    runOnJS,
    withTiming,
    useAnimatedGestureHandler,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import bottomRightCornerIcon from "../assets/bottom-right2.png";
import plusIcon from "../assets/plusIcon.png";
import resizerIcon from "../assets/resizerIcon.png";

const { width, height } = Dimensions.get('screen');


const Cropper = ({ onCropChange }) => {
    const [initialSize] = useState({ width: 300, height: 150 });
    const maxSize = Math.min(width, height) * 0.9;

    const isGestureStarted = useSharedValue(false)

    const cropAreaCenterY = (height / 2) - height / 6; // Merkez Y
    const cropAreaCenterX = width / 2; // Merkez X

    const cropSize = useSharedValue({
        width: initialSize.width,
        height: initialSize.height,
    });

    const activeCorner = useSharedValue(null)

    const panGestureHandler = useAnimatedGestureHandler({
        onStart: (event, ctx) => {
            isGestureStarted.value = true;
            const { translationX, translationY, absoluteX, absoluteY } = event;
            // Dört bölge belirle
            const isTopHalf = absoluteY < cropAreaCenterY;
            const isLeftHalf = absoluteX < cropAreaCenterX;
            if (isTopHalf) {
                if (isLeftHalf) {
                    activeCorner.value = 'topLeft';
                } else {
                    activeCorner.value = 'topRight';
                }
            } else {
                if (isLeftHalf) {
                    activeCorner.value = 'bottomLeft';
                } else {
                    activeCorner.value = 'bottomRight';
                }
            }

            ctx.startX = cropSize.value.width;
            ctx.startY = cropSize.value.height;
        },
        onActive: (event, ctx) => {
            const { translationX, translationY, absoluteX, absoluteY } = event;

            let newWidth = cropSize.value.width;
            let newHeight = cropSize.value.height;

            switch (activeCorner.value) {
                case 'topLeft':
                    newWidth = Math.max(75, Math.min(ctx.startX - translationX, maxSize));
                    newHeight = Math.max(75, Math.min(ctx.startY - translationY, maxSize));
                    break;
                case 'topRight':
                    newWidth = Math.max(75, Math.min(ctx.startX + translationX, maxSize));
                    newHeight = Math.max(75, Math.min(ctx.startY - translationY, maxSize));
                    break;
                case 'bottomLeft':
                    newWidth = Math.max(75, Math.min(ctx.startX - translationX, maxSize));
                    newHeight = Math.max(75, Math.min(ctx.startY + translationY, maxSize));
                    break;
                case 'bottomRight':
                    newWidth = Math.max(75, Math.min(ctx.startX + translationX, maxSize));
                    newHeight = Math.max(75, Math.min(ctx.startY + translationY, maxSize));
                    break;
                default:
                    break;
            }
            cropSize.value = { width: newWidth, height: newHeight };
        },
        onEnd: () => {
            isGestureStarted.value = false;
            runOnJS(onCropChange)({
                width: cropSize.value.width,
                height: cropSize.value.height,
                left: (width - cropSize.value.width) / 2,
                top: ((height - cropSize.value.height) / 2) - height / 6,
            });
        },
    });

    useEffect(() => {
        onCropChange({
            width: cropSize.value.width,
            height: cropSize.value.height,
            left: (width - cropSize.value.width) / 2,
            top: ((height - cropSize.value.height) / 2) - height / 6,
        })
    }, [])

    const resizerIconStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(isGestureStarted.value ? 1 : 0, { duration: 300 }), // 300ms fade-in/out
        };
    });

    const cropStyle = useAnimatedStyle(() => {
        const cropLeft = (width - cropSize.value.width) / 2;
        const cropTop = ((height - cropSize.value.height) / 2) - height / 6;
        return {
            width: cropSize.value.width,
            height: cropSize.value.height,
            left: cropLeft,
            top: cropTop,
        };
    });

    return (

        <View style={styles.cropperContainer}>
            <PanGestureHandler
                onGestureEvent={panGestureHandler}
            >
                <Animated.View style={[styles.cropArea, cropStyle]}>
                    <View style={styles.centerIcon}>
                        <Image source={plusIcon} style={{ height: 20, width: 20 }} />
                        <Animated.Image
                            source={resizerIcon}
                            style={[
                                { height: 50, width: 50, position: "absolute", alignSelf: "center" },
                                resizerIconStyle
                            ]}
                        />
                    </View>
                    <Image source={bottomRightCornerIcon} style={[styles.cornerIcon, styles.topLeft, { transform: [{ rotate: '180deg' }], marginTop: 16, marginLeft: 16 }]} />
                    <Image source={bottomRightCornerIcon} style={[styles.cornerIcon, styles.topRight, { transform: [{ rotate: '270deg' }], marginTop: 16, marginRight: 16 }]} />
                    <Image source={bottomRightCornerIcon} style={[styles.cornerIcon, styles.bottomLeft, { transform: [{ rotate: '90deg' }], marginBottom: 16, marginLeft: 16 }]} />
                    <Image source={bottomRightCornerIcon} style={[styles.cornerIcon, styles.bottomRight, { transform: [{ rotate: '0deg' }], marginBottom: 16, marginRight: 16 }]} />
                </Animated.View>
            </PanGestureHandler>
        </View>
    );
};

const styles = StyleSheet.create({
    cropperContainer: {
        flex: 1,
    },
    cornerIcon: {
        position: "absolute",
        width: 30,
        height: 30,
    },
    centerIcon: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
        top: "50%",
        left: "50%",
        transform: [{ translateX: -10 }, { translateY: -10 }], // "+" ikonu ortalanacak şekilde
    },
    topLeft: {
        top: -15,
        left: -15,
    },
    topRight: {
        top: -15,
        right: -15,
    },
    bottomLeft: {
        bottom: -15,
        left: -15,
    },
    bottomRight: {
        bottom: -15,
        right: -15,
    },
});

export default Cropper;