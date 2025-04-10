import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MathJaxSvg } from 'react-native-mathjax-html-to-svg';
import Feather from 'react-native-vector-icons/Feather';

const ResultsPanel = ({
    screenWidth,
    equationType,
    equationResponse,
    equationTypeLetter,
    isolatedEquation,
    equationResponseSolution,
    toLatex,
    arrowImg,
    onRetry
}) => {
    // Helper function to get appropriate instruction text
    const getInstructionText = () => {
        if (equationTypeLetter !== "") {
            return `Solve for ${equationTypeLetter}`;
        } else if (equationType === "Two-variable equation") {
            return "Simplify the expression";
        } else {
            return "Calculate";
        }
    };

    // Helper function to handle isolating a variable when equationResponseSolution is empty
    const renderSolution = () => {
        // If we have solutions, render them as before
        if (equationResponseSolution && equationResponseSolution.length > 0) {
            if (equationType === "Two-variable equation") {
                return (
                    <MathJaxSvg
                        fontSize={24}
                        color="#000000"
                        fontCache={true}
                    >
                        {`$$${toLatex(isolatedEquation)}$$`}
                    </MathJaxSvg>
                );
            } else {
                return equationResponseSolution.map((solution, index) => {
                    const prefix = equationTypeLetter
                        ? (equationResponseSolution.length > 1
                            ? `${equationTypeLetter}_{${index + 1}} =`
                            : `${equationTypeLetter} =`)
                        : '';

                    return (
                        <MathJaxSvg
                            key={index}
                            fontSize={24}
                            color="#000000"
                            fontCache={true}
                        >
                            {`$$${prefix} ${toLatex(solution)}$$`}
                        </MathJaxSvg>
                    );
                });
            }
        }
        // If equationResponseSolution is empty, but we have an isolatedEquation
        else if (isolatedEquation) {
            return (
                <MathJaxSvg
                    fontSize={24}
                    color="#000000"
                    fontCache={true}
                >
                    {`$$${equationTypeLetter ? `` : ''}${toLatex(isolatedEquation)}$$`}
                </MathJaxSvg>
            );
        }
        // Fallback for when both equationResponseSolution and isolatedEquation are empty
        else {
            // Extract variable to isolate from equationTypeLetter or default to 'x'
            const variableToIsolate = equationTypeLetter || 'y';

            // Default message when we can't generate a solution
            const defaultMessage = `${variableToIsolate} = \\text{Expression could not be isolated}`;

            // Try to extract an isolation from the equation response
            let isolatedVariable = defaultMessage;

            // Simple parsing to attempt isolating the variable from equation
            try {
                // For example, if equation is "x^2 + y = 2", to isolate x: "x^2 = 2 - y" then "x = \\pm\\sqrt{2 - y}"
                if (equationResponse && equationResponse.includes(variableToIsolate)) {
                    if (equationResponse.includes(`${variableToIsolate}^2`)) {
                        // Handle quadratic case
                        isolatedVariable = `${variableToIsolate} = \\pm\\sqrt{\\text{expression}}`;
                    } else {
                        // Handle linear case
                        isolatedVariable = `${variableToIsolate} = \\text{rearranged expression}`;
                    }
                }
            } catch (error) {
                console.error("Error attempting to isolate variable:", error);
            }

            return (
                <MathJaxSvg
                    fontSize={24}
                    color="#000000"
                    fontCache={true}
                >
                    {`$$${isolatedVariable}$$`}
                </MathJaxSvg>
            );
        }
    };

    return (
        <View style={[styles.container, { width: screenWidth / 1.1 }]}>
            <Text style={styles.sectionHeader}>SOLUTION STEPS</Text>
            <Text style={styles.equationType}>{equationType}</Text>

            <MathJaxSvg
                style={styles.mathJax}
                fontSize={20}
                color="#000000"
                fontCache={true}
            >
                {`$$${equationResponse}$$`}
            </MathJaxSvg>

            <View style={styles.instructionRow}>
                <Image source={arrowImg} style={styles.arrowImage} />
                <Text style={styles.instructionText}>
                    {getInstructionText()}
                </Text>
            </View>

            <View style={styles.solutionContainer}>
                {renderSolution()}
            </View>

            <TouchableOpacity
                style={styles.retryButton}
                onPress={onRetry}
            >
                <Text style={styles.retryButtonText}>Recalculate</Text>
                <Feather size={19} color={"white"} name='refresh-ccw' />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        backgroundColor: "white",
        paddingVertical: 15,
        paddingBottom: 25,
    },
    sectionHeader: {
        color: "#494a4e",
        fontWeight: "700",
        fontSize: 16,
        marginBottom: 12,
        paddingLeft: 20
    },
    equationType: {
        color: "black",
        fontWeight: "700",
        fontSize: 24,
        marginBottom: 24,
        paddingLeft: 20
    },
    mathJax: {
        marginBottom: 10,
        paddingLeft: 20
    },
    instructionRow: {
        flexDirection: "row",
        alignItems: "center"
    },
    arrowImage: {
        height: 70,
        width: 20,
        resizeMode: "contain",
        marginVertical: 10,
        marginLeft: 20
    },
    instructionText: {
        color: "#4c4c4e",
        fontWeight: "400",
        paddingLeft: 12,
        fontSize: 15
    },
    solutionContainer: {
        borderLeftColor: "#09a350",
        borderLeftWidth: 8,
        paddingLeft: 12,
        justifyContent: "center",
        gap: 2
    },
    retryButton: {
        alignSelf: "center",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        backgroundColor: "#09a350",
        paddingVertical: 12,
        marginHorizontal: 80,
        marginTop: 30,
        width: 190,
        borderRadius: 100
    },
    retryButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "500"
    }
});

export default ResultsPanel;