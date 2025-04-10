import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const CaptureButtonPanel = ({
    isCaptureLoading,
    onTakePicture,
    onPickImage,
    onToggleFlash,
    torch,
    animatedStyle,
    captureLoadingUse,
    CaptureButtonImage,
    disabled
}) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                activeOpacity={0.6}
                style={styles.sideButton}
                onPress={onPickImage}
                disabled={disabled}
                opacity={disabled ? 0.4 : 1}
            >
                <FontAwesome size={25} color={'#fff'} name='picture-o' />
            </TouchableOpacity>

            {isCaptureLoading ? (
                <View style={{ paddingHorizontal: 45 }}>
                    <Animated.Image
                        source={captureLoadingUse}
                        style={[
                            { width: 75, height: 75 },
                            animatedStyle
                        ]}
                    />
                </View>
            ) : (
                <TouchableOpacity
                    activeOpacity={0.6}
                    onPress={onTakePicture}
                    style={{ paddingHorizontal: 45 }}
                    disabled={disabled}
                    opacity={disabled ? 0.4 : 1}
                >
                    <CaptureButtonImage width={75} height={75} />
                </TouchableOpacity>
            )}

            <TouchableOpacity
                onPress={onToggleFlash}
                activeOpacity={0.6}
                style={styles.sideButton}
                disabled={disabled}
                opacity={disabled ? 0.4 : 1}
            >
                <Ionicons size={25} color={'#fff'} name={torch ? 'flash-off-outline' : "flash-outline"} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sideButton: {
        width: 55,
        height: 55,
        borderRadius: 30,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default CaptureButtonPanel;