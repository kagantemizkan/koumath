import { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { divide, subtract, parse, multiply, evaluate } from 'mathjs';
import { useNavigation, useRouter, useLocalSearchParams } from "expo-router";
import AntDesign from 'react-native-vector-icons/AntDesign';
import { router } from 'expo-router';
import CoordinateSystem from '../components/CoordinateSystem';

const screenWidth = Dimensions.get('screen').width;
const screenHeight = Dimensions.get('screen').height;

export default function MathGraphScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const { isolatedEquation, equationResponse } = params;
    console.log("@SecondScreen isolatedEquation: ", isolatedEquation)


    return (
        <View style={styles.container}>

            <TouchableOpacity
                onPress={() => router.back()}
                style={{
                    zIndex: 2,
                    borderColor: "#c0c0c0",
                    borderWidth: 1,
                    top: screenHeight / 16,
                    right: 18,
                    position: "absolute",
                    backgroundColor: "white",
                    borderRadius: 30
                }}>

                <AntDesign style={{ padding: 5 }} size={20} color={'#71797E'} name='close' />
            </TouchableOpacity>
            {isolatedEquation && (
                <CoordinateSystem
                    mathFunction={isolatedEquation.replace("**", "^")}
                    scaleProp={2}
                    isGestureActive={true}
                />
            )}
        </View>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});