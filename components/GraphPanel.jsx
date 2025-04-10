import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import Feather from 'react-native-vector-icons/Feather';
import CoordinateSystem from './CoordinateSystem';

const GraphPanel = ({
    screenWidth,
    equationType,
    isolatedEquation,
    equationResponse
}) => {
    return (
        <View style={[styles.container, { width: screenWidth / 1.1 }]}>
            <Text style={styles.sectionHeader}>GRAPH</Text>
            <Text style={styles.graphTitle}>{equationType}</Text>

            <CoordinateSystem
                mathFunction={isolatedEquation.replace("**", "^")}
                scaleProp={1.2}
                isGestureActive={false}
            />

            <Link
                push
                href={{
                    pathname: "/mathGraphScreen",
                    params: {
                        isolatedEquation: isolatedEquation,
                        equationResponse: equationResponse
                    },
                }}
                asChild
            >
                <TouchableOpacity style={styles.exploreButton}>
                    <Text style={styles.exploreButtonText}>Explore Graph</Text>
                    <Feather size={19} color={"white"} name='arrow-right' />
                </TouchableOpacity>
            </Link>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: "white",
        overflow: "hidden",
        height: 500,
        borderRadius: 20,
        marginTop: 25,
        marginBottom: 40,
    },
    sectionHeader: {
        backgroundColor: "white",
        color: "#494a4e",
        fontWeight: "700",
        fontSize: 16,
        paddingBottom: 12,
        paddingLeft: 20,
        paddingTop: 15
    },
    graphTitle: {
        backgroundColor: "white",
        color: "black",
        fontWeight: "700",
        fontSize: 24,
        paddingLeft: 20,
        paddingBottom: 20
    },
    exploreButton: {
        bottom: 20,
        alignSelf: "center",
        position: "absolute",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        backgroundColor: "#09a350",
        paddingVertical: 12,
        width: 190,
        borderRadius: 100
    },
    exploreButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "500"
    }
});

export default GraphPanel;