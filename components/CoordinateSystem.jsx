import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, Dimensions, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, useDerivedValue, runOnJS } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Skia, Canvas, Line, Path, vec, Circle, DashPathEffect } from '@shopify/react-native-skia';
import { evaluate, index } from 'mathjs';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { MathJaxSvg } from 'react-native-mathjax-html-to-svg';

const numColumns = 34; // Number of columns
const squareSize = 34; // Size of each small square (1x1)

const initialAreaSize = numColumns * squareSize; // Initial area size
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Move outside component - cache for memoization
const calculationCache = new Map();

// Utility functions moved outside
const evaluatePoint = (func, x, y, isYEquation) => {
    try {
        if (isYEquation) {
            return evaluate(func.replace("y=", ""), { x });
        }
        return evaluate(func.replace("x=", ""), { y });
    } catch (error) {
        console.warn('Evaluation error:', error);
        return null;
    }
};

const solveForY = (func, xTarget, tolerance = 0.01, maxIterations = 50) => {
    let yGuess = 0;

    for (let i = 0; i < maxIterations; i++) {
        const xCalculated = evaluatePoint(func, null, yGuess, false);

        if (xCalculated === null) return null;

        const error = xTarget - xCalculated;
        if (Math.abs(error) < tolerance) {
            return yGuess;
        }

        yGuess += error * 0.1;
    }

    return null; // Return null if no solution found
};

const getLinePath = (mathFunction, width, height, squareSize) => {
    // Check cache first
    const cacheKey = mathFunction;
    if (calculationCache.has(cacheKey)) {
        return calculationCache.get(cacheKey);
    }

    const isYEquation = mathFunction.startsWith("y=");
    const path = Skia.Path.Make();
    const points = [];

    // Configuration
    const config = {
        xStart: -30,
        xEnd: 30,
        step: 0.1,
        maxGap: 100
    };

    // For y-equations (y=f(x)), we iterate over x and calculate y
    if (isYEquation) {
        let lastY = null;
        let isDrawing = false;

        for (let x = config.xStart; x <= config.xEnd; x += config.step) {
            const y = evaluatePoint(mathFunction, x, null, true);

            // Skip invalid points
            if (y === null || !isFinite(y)) {
                isDrawing = false;
                continue;
            }

            // Calculate canvas coordinates
            const canvasX = width / 2 + x * squareSize;
            const canvasY = height / 2 - y * squareSize;

            // Handle discontinuities
            if (lastY !== null && Math.abs(y - lastY) > config.maxGap) {
                isDrawing = false;
            }

            // Draw path
            if (!isDrawing) {
                path.moveTo(canvasX, canvasY);
                isDrawing = true;
            } else {
                path.lineTo(canvasX, canvasY);
            }

            // Store point data
            points.push({
                x: canvasX,
                y: canvasY,
                xValue: x.toFixed(2),
                yValue: y.toFixed(2)
            });

            lastY = y;
        }
    }
    // For x-equations (x=f(y)), we iterate over y and calculate x
    else {
        let lastX = null;
        let isDrawing = false;

        // For x=y^2 specifically, we want to render the entire parabola
        // This means we need to iterate through y values instead of x values
        for (let y = config.xStart; y <= config.xEnd; y += config.step) {
            // Calculate x value directly
            const x = evaluatePoint(mathFunction, null, y, false);

            // Skip invalid points
            if (x === null || !isFinite(x)) {
                isDrawing = false;
                continue;
            }

            // Calculate canvas coordinates
            const canvasX = width / 2 + x * squareSize;
            const canvasY = height / 2 - y * squareSize;

            // Handle discontinuities
            if (lastX !== null && Math.abs(x - lastX) > config.maxGap) {
                isDrawing = false;
            }

            // Draw path
            if (!isDrawing) {
                path.moveTo(canvasX, canvasY);
                isDrawing = true;
            } else {
                path.lineTo(canvasX, canvasY);
            }

            // Store point data
            points.push({
                x: canvasX,
                y: canvasY,
                xValue: x.toFixed(2),
                yValue: y.toFixed(2)
            });

            lastX = x;
        }
    }

    const result = { path, points };
    calculationCache.set(cacheKey, result);
    return result;
};


const CoordinateSystem = ({ mathFunction, scaleProp, isGestureActive }) => {
    let isPanning = false;
    const [isLoading, setIsLoading] = useState(true);

    const bottomSheetRef = useRef(null);
    const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });

    const translateX = useSharedValue(-numColumns * 12);
    const translateY = useSharedValue(-415);
    const scale = useSharedValue(scaleProp);
    const lastScale = useSharedValue(1);

    const startX = useSharedValue(0);
    const startY = useSharedValue(0);

    const width = initialAreaSize;
    const height = initialAreaSize;

    const circleCX = useSharedValue(-15)
    const circleCY = useSharedValue(-15)

    const { path: linePath, points: linePoints } = useMemo(() =>
        getLinePath(mathFunction, width, height, squareSize),
        [mathFunction, width, height, squareSize]
    );

    // Add these shared values for parallel lines
    const showParallelLines = useSharedValue(false);
    const parallelX = useSharedValue(0);
    const parallelY = useSharedValue(0);


    // Create derived values for parallel line points
    const axisParallelYP1 = useDerivedValue(() =>
        vec(width / 2, height / 2 + parallelY.value * squareSize)
    );

    const axisParallelYP2 = useDerivedValue(() =>
        vec(width / 2 + parallelX.value * squareSize, height / 2 + parallelY.value * squareSize)
    );

    const axisParallelXP1 = useDerivedValue(() =>
        vec(width / 2 + parallelX.value * squareSize, height / 2)
    );

    const axisParallelXP2 = useDerivedValue(() =>
        vec(width / 2 + parallelX.value * squareSize, height / 2 + parallelY.value * squareSize)
    );

    // Create derived values for the paths
    const parallelYPath = useDerivedValue(() => {
        const path = Skia.Path.Make();
        path.moveTo(axisParallelYP1.value.x, axisParallelYP1.value.y);
        path.lineTo(axisParallelYP2.value.x, axisParallelYP2.value.y);
        return path;
    });

    const parallelXPath = useDerivedValue(() => {
        const path = Skia.Path.Make();
        path.moveTo(axisParallelXP1.value.x, axisParallelXP1.value.y);
        path.lineTo(axisParallelXP2.value.x, axisParallelXP2.value.y);
        return path;
    });

    // pinch gesture
    const pinchGesture = Gesture.Pinch()
        .onStart(() => {
            lastScale.value = scale.value;
        })
        .onUpdate((event) => {
            const scaleChange = lastScale.value * event.scale;
            scale.value = Math.max(2, Math.min(3, scaleChange));
        });

    // pan gesture
    const panGesture = Gesture.Pan()
        .onStart((event) => {
            isPanning = true;
            startX.value = translateX.value;
            startY.value = translateY.value;
        })
        .onUpdate((event) => {

            const halfWidth = (initialAreaSize / 2) * scale.value;

            // Dinamik olarak ayarlanmış x ve y eksenindeki sınırlamalar
            const maxX = halfWidth - initialAreaSize / 2;
            const minX = -maxX - 30 * 17 * (scale.value - 1); // scale değişimine göre karelerin çarpanı
            const maxY = halfWidth - initialAreaSize / 2;
            const minY = -maxY - 30 * 1 * (scale.value - 1); // scale değişimine göre y eksenindeki sınırlama

            // Hareket sınırları içinde kalacak şekilde konumlandırma
            translateX.value = Math.max(
                minX,
                Math.min(maxX, startX.value + event.translationX)
            );
            translateY.value = Math.max(
                minY,
                Math.min(maxY, startY.value + event.translationY)
            );
        })
        .onEnd(() => {
            isPanning = false;
        });

    // Modify the tap gesture to update parallel lines
    const tapGesture = Gesture.Tap()
        .onStart((event) => {
            if (!isPanning) {
                const tapX = event.absoluteX - translateX.value - width / 2;
                const tapY = event.absoluteY - translateY.value - height / 2;

                let closestPoint = null;
                let minDistance = Infinity;
                const distanceThreshold = 1;

                linePoints.forEach((point) => {
                    const distance = Math.sqrt(
                        Math.pow(((tapX / squareSize) / scale.value) - point.xValue, 2) +
                        Math.pow(((tapY / squareSize) / -scale.value) - point.yValue, 2)
                    );
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestPoint = point;
                    }
                });

                if (closestPoint && minDistance <= distanceThreshold) {
                    circleCX.value = closestPoint.xValue;
                    circleCY.value = -closestPoint.yValue;
                    if (showParallelLines.value === false) {
                        showParallelLines.value = true;
                    }
                    parallelX.value = Number(closestPoint.xValue);
                    parallelY.value = -Number(closestPoint.yValue);
                } else {
                    showParallelLines.value = false;
                    console.log("uzak")
                }

                // Force rerender
                requestAnimationFrame(() => {
                    showParallelLines.value = showParallelLines.value;
                });
            }
        });

    const gesture = Gesture.Simultaneous(pinchGesture, panGesture, tapGesture);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value },
            ],
        };
    });

    const renderSquares = useMemo(() =>
        Array(numColumns * numColumns)
            .fill(null)
            .map((_, i) => <View key={i} style={styles.square} />),
        []
    );

    const renderAxisLabels = useMemo(() => {
        const labels = [];
        // Y axis labels
        for (let i = -(numColumns / 2); i <= (numColumns / 2); i++) {
            labels.push(
                <Text key={`y-${i}`} style={[styles.axisLabel, {
                    zIndex: 2,
                    top: initialAreaSize / 2 - (i - 0.15) * squareSize - 10,
                    left: initialAreaSize / 2 - 7,
                    color: "#b0b0b0",
                    fontSize: 8
                }]}>
                    {i === 0 ? "" : i}
                </Text>
            );
        }
        // X axis labels
        for (let i = -(numColumns / 2); i <= (numColumns / 2); i++) {
            labels.push(
                <Text key={`x-${i}`} style={[styles.axisLabel, {
                    zIndex: 2,
                    left: i === 0 ? initialAreaSize / 2 + i * squareSize - 10 : initialAreaSize / 2 + (i - 0.15) * squareSize - 10,
                    bottom: initialAreaSize / 2 + 2,
                    color: "#b0b0b0",
                    fontSize: 8
                }]}>
                    {i}
                </Text>
            );
        }
        return labels;
    }, []);

    const derivedCX = useDerivedValue(() => width / 2 + circleCX.value * squareSize);
    const derivedCY = useDerivedValue(() => width / 2 + circleCY.value * squareSize);

    console.log(derivedCX)

    // Add useEffect to handle initial calculations
    useEffect(() => {
        const initializeSystem = async () => {
            // Allow component to render loading state first
            await new Promise(resolve => setTimeout(resolve, 0));
            setIsLoading(false);
        };

        initializeSystem();
    }, []);

    useDerivedValue(() => {
        runOnJS(setCoordinates)(({
            x: parallelX.value.toFixed(2),
            y: (-parallelY.value).toFixed(2),
        }))
    }, [parallelX, parallelY]);


    if (isLoading && isGestureActive) {
        return (
            <View style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)', height: "100%", width: screenWidth }}>
                <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 10, gap: 24 }}>
                    <Text style={{ color: '#565656', fontSize: 20, fontWeight: 500 }}>Grafik yükleniyor</Text>
                    <ActivityIndicator size={54} color="#09a350" />
                </View>
            </View>
        );
    }


    return (
        <View style={styles.outerContainer}>
            <GestureDetector
                gesture={isGestureActive ? gesture : Gesture.Tap()} // Eğer aktif değilse basit bir Tap gesture
            >
                <Animated.View
                    style={[
                        animatedStyle,
                    ]}
                >
                    <View style={styles.grid}>
                        {renderSquares}
                    </View>
                    <Canvas style={[styles.canvas]}>
                        {/* X ekseni */}
                        <Line
                            p1={vec(0, height / 2)}
                            p2={vec(width, height / 2)}
                            color="#b0b0b0"
                            style="stroke"
                            strokeWidth={1}
                        />
                        {/* Y ekseni */}
                        <Line
                            p1={vec(width / 2, 0)}
                            p2={vec(width / 2, height)}
                            color="#b0b0b0"
                            style="stroke"
                            strokeWidth={1}
                        />

                        <Path
                            path={linePath}
                            color="#52b5cc"
                            strokeWidth={1}
                            style="stroke"
                        />


                        <Path
                            path={parallelYPath}
                            color="rgba(132, 132, 132, 0.45)"
                            style="stroke"
                            strokeWidth={0.5}
                        >
                            <DashPathEffect intervals={[3, 3]} />
                        </Path>
                        <Path
                            path={parallelXPath}
                            color="rgba(132, 132, 132, 0.45)"
                            style="stroke"
                            strokeWidth={0.5}
                        >
                            <DashPathEffect intervals={[3, 3]} />
                        </Path>
                        <Circle
                            cx={derivedCX}
                            cy={derivedCY}
                            r={2.5}
                            color="#4c84c0"
                        />

                    </Canvas>
                    {renderAxisLabels}
                </Animated.View>
            </GestureDetector>



            <BottomSheet
                ref={bottomSheetRef}
                snapPoints={['45%', '55%']}
                onChange={(index, position) => {
                    index === 0 && bottomSheetRef.current?.snapToIndex(1)
                    console.log("index", index)
                    console.log("position", position)
                }}
                index={1}
                style={{
                    backgroundColor: 'rgba(255, 255, 255,0)',
                    width: screenWidth,
                    shadowColor: "#000",
                    shadowOffset: {
                        width: 0,
                        height: 15,
                    },
                    shadowOpacity: 0.60,
                    shadowRadius: 10.68,
                    elevation: 10,
                }}
            >
                <BottomSheetScrollView
                    contentContainerStyle={{
                        width: screenWidth,
                        padding: 16,
                        backgroundColor: '#fff',
                    }}
                >
                    <View style={styles.contentContainer}>
                        <Text style={styles.coordinateTitle}>Coordinates</Text>
                        <MathJaxSvg
                            style={{ marginBottom: 10 }} // Use margin for spacing
                            fontSize={20}
                            color="#000000"
                            fontCache={true}
                        >
                            {`$$${mathFunction}$$`}
                        </MathJaxSvg>

                        {showParallelLines.value && (
                            <View style={styles.coordinateValues}>
                                <Text style={styles.coordinateText}>
                                    x: {coordinates.x}
                                </Text>
                                <Text style={styles.coordinateText}>
                                    y: {coordinates.y}
                                </Text>
                            </View>
                        )}
                    </View>
                </BottomSheetScrollView>
            </BottomSheet>



        </View >
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        width: initialAreaSize,
        height: initialAreaSize,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: 'auto',
        height: 'auto',
    },
    square: {
        width: squareSize,
        height: squareSize,
        backgroundColor: '#ffffff',
        borderWidth: 0.5,
        borderColor: '#e8e8e8',
    },
    canvas: {
        position: 'absolute',
        width: initialAreaSize,
        height: initialAreaSize,
        top: 0,
        left: 0,
        zIndex: 1, // Ensure canvas is on top
    },
    axisLabel: {
        position: 'absolute',
        fontSize: 12,
        color: 'black',
        textAlign: 'center',
        width: squareSize,
    },
    contentContainer: {
        width: screenWidth,
        backgroundColor: '#fff',
        zIndex: 1,
    },
    coordinateTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333',
    },
    coordinateValues: {
        flexDirection: 'row',
        gap: 16,
        padding: 12,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    coordinateText: {
        fontSize: 16,
        color: '#666',
    },
});

export default CoordinateSystem;