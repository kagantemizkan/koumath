import React, { useState, forwardRef } from 'react';
import { View, Dimensions, StyleSheet, Image, Text } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import bottomRightCornerIcon from "../assets/bottom-right2.png";
import plusIcon from "../assets/plusIcon.png";
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';


const { width, height } = Dimensions.get("screen");

const Cropper = (({ onCropChange }) => {
    const initialSize = { width: 300, height: 150 }; // Başlangıç boyutu
    const maxSize = Math.min(width, height) * 0.9; // Maksimum boyut (ekran boyutuna göre ayarlanmış)

    const [cropSize, setCropSize] = useState(initialSize); // Kesim alanının boyutu
    const [activeCorner, setActiveCorner] = useState(null); // Aktif köşe durumunu izlemek için

    const handleResize = (newWidth, newHeight) => {
        // Yeni boyutları güncelle
        const newCropSize = {
            width: Math.max(50, Math.min(newWidth, maxSize)),
            height: Math.max(50, Math.min(newHeight, maxSize)),
        };
        setCropSize(newCropSize);

        // Sol ve üst pozisyonu hesapla
        const cropLeft = (width - cropSize.width) / 2;
        const cropTop = ((height - cropSize.height) / 2) - height / 5;

        // Parent component'e crop bilgilerini aktar
        if (onCropChange) {
            onCropChange({
                width: newCropSize.width,
                height: newCropSize.height,
                left: cropLeft,
                top: cropTop,
            });
        }
    };

    const handleGestureEvent = (event) => {
        const { translationX, translationY, absoluteX, absoluteY } = event.nativeEvent;


        if (activeCorner === null) {
            const cropAreaCenterY = (height / 2) - height / 5; // Merkez Y
            const cropAreaCenterX = width / 2; // Merkez X

            // Dört bölge belirle
            const isTopHalf = absoluteY < cropAreaCenterY;
            const isLeftHalf = absoluteX < cropAreaCenterX;

            // Aktif köşeyi ayarla
            if (isTopHalf) {
                if (isLeftHalf) {
                    setActiveCorner('topLeft');
                    console.log('Active Corner: topLeft');
                } else {
                    setActiveCorner('topRight');
                    console.log('Active Corner: topRight');
                }
            } else {
                if (isLeftHalf) {
                    setActiveCorner('bottomLeft');
                    console.log('Active Corner: bottomLeft');
                } else {
                    setActiveCorner('bottomRight');
                    console.log('Active Corner: bottomRight');
                }
            }
            console.log(`First touch at corner: ${activeCorner}`);
        }

        // Yeni boyutları hesapla
        let newWidth = cropSize.width;
        let newHeight = cropSize.height;



        switch (activeCorner) {
            case 'topLeft':
                newHeight = Math.max(100, cropSize.height - translationY);
                newWidth = Math.max(100, cropSize.width - translationX);
                // console.log('Resizing to topLeft:', { newWidth, newHeight });
                break;
            case 'topRight':
                newHeight = Math.max(100, cropSize.height - translationY);
                newWidth = Math.max(100, cropSize.width + translationX);
                // console.log('Resizing to topRight:', { newWidth, newHeight });
                break;
            case 'bottomLeft':
                newHeight = Math.max(100, cropSize.height + translationY);
                newWidth = Math.max(100, cropSize.width - translationX);
                // console.log('Resizing to bottomLeft:', { newWidth, newHeight });
                break;
            case 'bottomRight':
                newHeight = Math.max(100, cropSize.height + translationY);
                newWidth = Math.max(100, cropSize.width + translationX);
                // console.log('Resizing to bottomRight:', { newWidth, newHeight });
                break;
            default:
                break;
        }

        handleResize(newWidth, newHeight);
    };

    const handleGestureEnd = () => {
        setActiveCorner(null);
    };

    const cropLeft = (width - cropSize.width) / 2;
    const cropTop = ((height - cropSize.height) / 2) - height / 5;

    return (

        <View style={styles.cropperContainer}>
            <PanGestureHandler
                onGestureEvent={handleGestureEvent}
                onEnded={handleGestureEnd}
            >
                <View
                    style={[
                        {
                            width: cropSize.width,
                            height: cropSize.height,
                            left: cropLeft, // Dinamik sol pozisyon
                            top: cropTop,   // Dinamik üst pozisyon
                        },
                    ]}
                >
                    {/* Ortadaki "+" simgesi */}
                    <View style={styles.centerIcon}>
                        <Image source={plusIcon} style={{ height: 20, width: 20 }} />
                    </View>
                    {/* Köşe simgeleri */}
                    <Image source={bottomRightCornerIcon} style={[styles.cornerIcon, styles.topLeft, { transform: [{ rotate: '180deg' }], marginTop: 16, marginLeft: 16 }]} />
                    <Image source={bottomRightCornerIcon} style={[styles.cornerIcon, styles.topRight, { transform: [{ rotate: '270deg' }], marginTop: 16, marginRight: 16 }]} />
                    <Image source={bottomRightCornerIcon} style={[styles.cornerIcon, styles.bottomLeft, { transform: [{ rotate: '90deg' }], marginBottom: 16, marginLeft: 16 }]} />
                    <Image source={bottomRightCornerIcon} style={[styles.cornerIcon, styles.bottomRight, { transform: [{ rotate: '0deg' }], marginBottom: 16, marginRight: 16 }]} />
                </View>
            </PanGestureHandler>
        </View>
    );
});

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