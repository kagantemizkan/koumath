import { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View, Dimensions, Image, BackHandler, AppState, Text, Pressable } from 'react-native';
import { useCameraDevice, Camera, useCameraFormat, useCameraPermission } from 'react-native-vision-camera';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, cancelAnimation, FadeIn, FadeOut } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Link } from 'expo-router';
import { MathJaxSvg } from 'react-native-mathjax-html-to-svg';

// Components
import TransparentViewBottom from '../components/TransparentViewBottom';
import TransparentViewTop from '../components/TransparentViewTop';
import ReanimatedCropper from '../components/ReanimatedCropper';
import TransparentBottomSheetHandle from '../components/TransparentBottomSheetHandle';
import ManualInputPanel from '../components/ManualInputPanel';
import FunctionPresets from '../components/FunctionPresets';
import LoadingIndicator from '../components/LoadingIndicator';
import CaptureButtonPanel from '../components/CaptureButtonPanel';
import ResultsPanel from '../components/ResultsPanel';
import GraphPanel from '../components/GraphPanel';

// Utils
import { analyzeFunction, toLatex } from '../utils/mathUtils';
import { predictAPI, predictLimitAPI } from '../utils/apiService';
import { handleCropPicture } from '../utils/imageUtils';
import { ERRORS, API_STATUS } from '../utils/constants';

// Images and assets
import CaptureButtonImage from "../assets/captureButton.svg";
import captureLoadingUse from "../assets/captureLoadingUse.png";
import arrowImg from "../assets/arrow.png";

const screenWidth = Dimensions.get('screen').width;
const screenHeight = Dimensions.get('screen').height;


export default function HomeScreen() {
    const screenAspectRatio = screenHeight / screenWidth;

    // Camera setup
    const device = useCameraDevice('back');
    const format = useCameraFormat(device, [
        { autoFocusSystem: true },
        { photoAspectRatio: screenAspectRatio },
        { photoResolution: 'max' },
        { pixelFormat: 'native' },
    ]);
    const { hasPermission, requestPermission } = useCameraPermission();

    // Refs
    const bottomSheetRef = useRef(null);
    const cameraRef = useRef(null);


    const [apiUrl, setApiUrl] = useState("http://127.0.0.1:8000");
    // Camera state
    const [torch, setTorch] = useState(false);
    const [cropInfo, setCropInfo] = useState(null);
    const [photoUri, setPhotoUri] = useState(null);
    const [preview, setPreview] = useState(true);
    const [useCamera, setUseCamera] = useState(true);
    const [isImageFromCamera, setIsImageFromCamera] = useState(true);

    // UI state
    const [isCaptureLoading, setIsCaptureLoading] = useState(false);
    const [showModels, setShowModels] = useState(false);
    const [modelName, setModelName] = useState("predict");
    const [showManualInput, setShowManualInput] = useState(false);
    const [showFunctionPresets, setShowFunctionPresets] = useState(false);
    const [apiStatus, setApiStatus] = useState(API_STATUS.IDLE);
    const [error, setError] = useState(null);

    // Math processing state
    const [equationType, setEquationType] = useState("");
    const [equationTypeLetter, setEquationTypeLetter] = useState("");
    const [equationResponse, setEquationResponse] = useState("");
    const [equationResponseSolution, setEquationResponseSolution] = useState([]);
    const [isolatedEquation, setIsolatedEquation] = useState("");
    const [debugImage, setDebugImage] = useState("");

    // Animation values
    const rotation = useSharedValue(0);

    // Effects
    useEffect(() => {
        if (hasPermission === false) {
            requestPermission();
        }

        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                console.log('App has come to the foreground!');
                if (!showManualInput && !showFunctionPresets) {
                    setUseCamera(true);
                }
            } else if (nextAppState === 'background') {
                console.log('App has gone to the background!');
                setUseCamera(false);
            }
        });

        return () => {
            subscription.remove();
        };
    }, [showManualInput, showFunctionPresets]);

    useEffect(() => {
        if (isCaptureLoading) {
            rotation.value = withRepeat(
                withTiming(-360, { duration: 1200, easing: Easing.linear }),
                -1
            );
        } else {
            cancelAnimation(rotation);
            rotation.value = 0;
        }
    }, [isCaptureLoading]);

    useEffect(() => {
        const backAction = () => {
            if (showManualInput) {
                setShowManualInput(false);
                setUseCamera(true);
                return true;
            }

            if (showFunctionPresets) {
                setShowFunctionPresets(false);
                setUseCamera(true);
                return true;
            }

            if (preview) {
                BackHandler.exitApp();
                return true;
            } else {
                handleBackToCamera();
                return true;
            }
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove();
    }, [preview, showManualInput, showFunctionPresets]);

    // Callbacks and handlers
    const handleSheetChanges = useCallback((index) => {
        if (index === -1 && !showManualInput && !showFunctionPresets) {
            handleBackToCamera();
        }
    }, [showManualInput, showFunctionPresets]);

    const handleBackToCamera = () => {
        setError(null);
        setApiStatus(API_STATUS.IDLE);
        setIsImageFromCamera(true);
        setPreview(true);
        setPhotoUri(null);
        bottomSheetRef.current?.close();
        setIsCaptureLoading(false);
        setEquationTypeLetter("");
        setEquationType("");
        setIsolatedEquation("");
        if (!showManualInput && !showFunctionPresets) {
            setUseCamera(true);
        }
    };

    const toggleFlash = () => {
        setTorch(!torch);
    };

    const handleCropChange = (newCropInfo) => {
        setCropInfo(newCropInfo);
    };

    const handleTakePicture = async () => {
        try {
            setIsCaptureLoading(true);
            setApiStatus(API_STATUS.LOADING);

            if (cameraRef.current && cropInfo) {
                const photo = await cameraRef.current.takePhoto({
                    quality: 85,
                    skipMetadata: true,
                });

                setTimeout(() => {
                    setPreview(false);
                }, 600);

                setPhotoUri(photo.path);
                setIsImageFromCamera(true);

                const croppedImageBase64 = await handleCropPicture(
                    photo.path,
                    cropInfo,
                    photo.width,
                    photo.height,
                    screenWidth,
                    screenHeight
                );

                setDebugImage(croppedImageBase64);
                processImage(croppedImageBase64);
                bottomSheetRef.current.snapToIndex(1);
            }
        } catch (error) {
            console.error("Error taking picture:", error);
            setError(ERRORS.CAMERA_ERROR);
            setApiStatus(API_STATUS.ERROR);
            setIsCaptureLoading(false);
        }
    };

    const processImage = async (base64Image) => {
        try {
            setApiStatus(API_STATUS.LOADING);

            const response = await predictAPI(
                base64Image,
                modelName,
                apiUrl,
                predictLimitAPI
            );

            if (!response) {
                setError(ERRORS.PROCESSING_ERROR);
                setApiStatus(API_STATUS.ERROR);
                return;
            }

            const { formatted_equation, solution, isolated_solution } = response;

            console.log("Equation detected:", formatted_equation);

            // Analyze and set equation type
            const analysisResult = analyzeFunction(formatted_equation);
            setEquationType(analysisResult.type);
            setEquationTypeLetter(analysisResult.letter || "");

            // Format and set equation response
            setEquationResponse(toLatex(formatted_equation));

            // Handle solution
            if (Array.isArray(solution)) {
                const formattedSolutions = solution.map((sol) => {
                    if (sol === null) return "No solution";
                    const num = parseFloat(sol);
                    return Number.isInteger(num) ? num.toString() : num.toFixed(3);
                });
                setEquationResponseSolution(formattedSolutions);
            } else if (solution) {
                setEquationResponseSolution([solution.toString()]);
            } else {
                setEquationResponseSolution([]);
            }

            // Set isolated equation for graphing if available
            if (isolated_solution) {
                setIsolatedEquation(isolated_solution);
            }

            setApiStatus(API_STATUS.SUCCESS);
        } catch (error) {
            console.error("Error processing image:", error);
            setError(ERRORS.PROCESSING_ERROR);
            setApiStatus(API_STATUS.ERROR);
        } finally {
            setIsCaptureLoading(false);
        }
    };

    const pickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.granted === false) {
                setError(ERRORS.PERMISSION_DENIED);
                return;
            }

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 1,
            });

            if (!result.canceled) {
                setIsCaptureLoading(true);
                setApiStatus(API_STATUS.LOADING);

                setPreview(false);
                setPhotoUri(result.assets[0].uri);
                setIsImageFromCamera(false);

                // Convert the image to base64
                const manipResult = await ImageManipulator.manipulateAsync(
                    result.assets[0].uri,
                    [],
                    { base64: true }
                );

                setDebugImage(manipResult.base64);
                processImage(manipResult.base64);
                bottomSheetRef.current.snapToIndex(1);
            }
        } catch (error) {
            console.error("Error picking image:", error);
            setError(ERRORS.GALLERY_ERROR);
            setApiStatus(API_STATUS.ERROR);
            setIsCaptureLoading(false);
        }
    };

    const handleManualInputSubmit = (inputText) => {
        console.log(inputText)
        if (!inputText.trim()) return;

        try {
            setPreview(false);
            setIsImageFromCamera(false);
            setIsCaptureLoading(true);
            setApiStatus(API_STATUS.LOADING);

            // Format the input equation
            const formattedEquation = inputText.trim().replace(/ /g, "");
            console.log("Manual input equation:", formattedEquation);

            // Process equation
            setEquationResponse(toLatex(formattedEquation));

            // Analyze equation type
            const analysisResult = analyzeFunction(formattedEquation);
            setEquationType(analysisResult.type);
            setEquationTypeLetter(analysisResult.letter || "");

            // Handle equation for graphing if it contains equals sign
            if (formattedEquation.includes("=")) {
                setIsolatedEquation(formattedEquation);

                // For simple equations, try to solve
                if (!formattedEquation.includes("y")) {
                    try {
                        const parts = formattedEquation.split("=");
                        if (parts.length === 2) {
                            // This is a simplified solver for basic equations
                            const solution = eval(parts[1] + "-(" + parts[0] + ")");
                            setEquationResponseSolution([solution.toString()]);
                        }
                    } catch (error) {
                        console.error("Error solving equation:", error);
                        setEquationResponseSolution(["Unable to solve"]);
                    }
                }
            } else {
                // For expressions without equals sign
                setIsolatedEquation(formattedEquation);
                setEquationResponseSolution([formattedEquation]);
            }

            setApiStatus(API_STATUS.SUCCESS);

            // Important: We need to open the bottom sheet AFTER setting all the data
            setTimeout(() => {
                bottomSheetRef.current?.snapToIndex(1);
            }, 100);

        } catch (error) {
            console.error("Error processing manual input:", error);
            setError(ERRORS.PROCESSING_ERROR);
            setApiStatus(API_STATUS.ERROR);
        } finally {
            setIsCaptureLoading(false);
            // Don't hide the manual input yet
        }
    };

    const handlePresetSelected = (preset) => {
        handleManualInputSubmit(preset);
        // Don't hide the presets yet - we'll do that after the bottom sheet is shown
    };

    const toggleManualInput = () => {
        // Close the other panel if open
        if (showFunctionPresets) {
            setShowFunctionPresets(false);
        }

        // Close bottom sheet if it's open
        if (!showManualInput) {
            bottomSheetRef.current?.close();
        }

        // Toggle manual input and disable camera when showing input
        setShowManualInput(!showManualInput);
        setUseCamera(showManualInput); // Enable camera if we're closing manual input
    };

    const toggleFunctionPresets = () => {
        // Close the other panel if open
        if (showManualInput) {
            setShowManualInput(false);
        }

        // Close bottom sheet if it's open
        if (!showFunctionPresets) {
            bottomSheetRef.current?.close();
        }

        // Toggle presets and disable camera when showing presets
        setShowFunctionPresets(!showFunctionPresets);
        setUseCamera(showFunctionPresets); // Enable camera if we're closing presets
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { rotate: `${rotation.value}deg` }
            ],
        };
    });

    // Function to close input panels when bottom sheet is opened
    const closeInputPanels = () => {
        if (apiStatus === API_STATUS.SUCCESS) {
            setShowManualInput(false);
            setShowFunctionPresets(false);
        }
    };

    // Render UI
    return (
        <View style={{ flex: 1 }}>
            {/* Camera */}
            {hasPermission && !showFunctionPresets && !showManualInput ?
                <Camera
                    preview={preview}
                    onPreviewStarted={() => console.log('Preview started!')}
                    onPreviewStopped={() => console.log('Preview stopped!')}
                    androidPreviewViewType="texture-view"
                    torch={torch ? "on" : "off"}
                    format={format}
                    style={[StyleSheet.absoluteFill]}
                    ref={cameraRef}
                    device={device}
                    isActive={useCamera}
                    photo={true}
                /> : null
            }

            {/* Display photo after capture */}
            {photoUri &&
                <>
                    <Image
                        source={{ uri: "file://" + photoUri }}
                        style={isImageFromCamera ?
                            {
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                resizeMode: 'contain',
                            }
                            :
                            {
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                resizeMode: 'contain',
                                bottom: screenHeight / 5,
                                backgroundColor: "rgba(0, 0, 0, 0.525)"
                            }
                        }
                    />
                    <TouchableOpacity onPress={handleBackToCamera} style={{ top: screenHeight / 16, right: 18, position: "absolute", backgroundColor: "white", borderRadius: 30 }}>
                        <AntDesign style={{ padding: 5 }} size={20} color={'#71797E'} name='close' />
                    </TouchableOpacity>
                </>
            }

            {/* Cropper for camera */}
            {isImageFromCamera && !showFunctionPresets && !showManualInput ? <ReanimatedCropper onCropChange={handleCropChange} /> : null}

            {/* Settings button */}
            <TouchableOpacity
                onPress={() => setShowModels(!showModels)}
                style={{
                    position: "absolute",
                    top: 50,
                    left: 14,
                    borderRadius: 100,
                    backgroundColor: "#FDFDFD50",
                    padding: 8
                }}>
                <Feather size={24} color={"white"} name='settings' />
            </TouchableOpacity>

            {/* Model selector popup */}
            {showModels && (
                <Animated.View
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={{
                        position: "absolute",
                        top: 100,
                        left: 14,
                        backgroundColor: "#FFF",
                        borderRadius: 8,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 5,
                    }}>
                    <TouchableOpacity style={{ borderBottomWidth: 0.5, borderBottomColor: "#9a9a9a", paddingHorizontal: 36, paddingVertical: 12 }} onPress={() => {
                        setModelName("predict")
                        setShowModels(!showModels)
                    }}>
                        <Text>Base Model</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ paddingHorizontal: 36, paddingVertical: 12 }} onPress={() => {
                        setModelName("predict-basic-math")
                        setShowModels(!showModels)
                    }}>
                        <Text>Basic Model</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={{ paddingHorizontal: 36, paddingVertical: 12 }} onPress={() => {
                        setApiUrl("http://127.0.0.1:8000")
                    }}>
                        <Text>Local API</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={{ paddingHorizontal: 36, paddingVertical: 12 }} onPress={() => {
                        setShowModels("https://unified-vervet-slowly.ngrok-free.app")
                    }}>
                        <Text>Ngrok API</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}

            {/* Camera control buttons */}
            {!photoUri && !showFunctionPresets && !showManualInput ? (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", marginBottom: 65 }}>
                    <Text style={{ color: "white", backgroundColor: "rgba(0, 0, 0, 0.55)", borderRadius: 30, marginBottom: 30, paddingVertical: 2, paddingHorizontal: 13, fontWeight: 500, fontSize: 13 }}>
                        Take a photo of a math problem
                    </Text>

                    <CaptureButtonPanel
                        isCaptureLoading={isCaptureLoading}
                        onTakePicture={handleTakePicture}
                        onPickImage={pickImage}
                        onToggleFlash={toggleFlash}
                        torch={torch}
                        animatedStyle={animatedStyle}
                        captureLoadingUse={captureLoadingUse}
                        CaptureButtonImage={CaptureButtonImage}
                        disabled={showManualInput || showFunctionPresets}
                    />
                </View>
            ) : null}

            {/* Input option buttons */}
            <View style={{
                position: "absolute",
                top: 50,
                right: 14,
                flexDirection: "row",
                gap: 10
            }}>
                <TouchableOpacity
                    onPress={toggleManualInput}
                    style={{
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        paddingVertical: 10,
                        paddingHorizontal: 20,
                        borderRadius: 30,
                    }}
                >
                    <Text style={{ color: "white", fontWeight: "500" }}>
                        {showManualInput ? "Hide" : "Enter Function"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={toggleFunctionPresets}
                    style={{
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        paddingVertical: 10,
                        paddingHorizontal: 20,
                        borderRadius: 30,
                    }}
                >
                    <Text style={{ color: "white", fontWeight: "500" }}>
                        {showFunctionPresets ? "Hide" : "Presets"}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Manual input panel */}
            {showManualInput && (
                <ManualInputPanel
                    screenWidth={screenWidth}
                    onSubmit={handleManualInputSubmit}
                />
            )}

            {/* Function presets panel */}
            {showFunctionPresets && (
                <FunctionPresets
                    screenWidth={screenWidth}
                    onPresetSelected={handlePresetSelected}
                />
            )}

            {/* Overlays */}
            <TransparentViewTop />
            <TransparentViewBottom />

            {/* Results bottom sheet */}
            <BottomSheet
                index={-1}
                snapPoints={['50%', '75%']}
                enablePanDownToClose
                ref={bottomSheetRef}
                onChange={handleSheetChanges}
                onAnimate={closeInputPanels}
                backgroundStyle={{ backgroundColor: "rgb(91, 91, 91)", borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
                handleComponent={TransparentBottomSheetHandle}
            >
                <BottomSheetScrollView style={{ flex: 0 }}>
                    {/* Loading state */}
                    {apiStatus === API_STATUS.LOADING && (
                        <LoadingIndicator />
                    )}

                    {/* Error state */}
                    {apiStatus === API_STATUS.ERROR && (
                        <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: "white", fontSize: 18, marginBottom: 10 }}>
                                {error || "An unexpected error occurred"}
                            </Text>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: "#09a350",
                                    paddingVertical: 12,
                                    paddingHorizontal: 20,
                                    borderRadius: 30,
                                    marginTop: 20
                                }}
                                onPress={handleBackToCamera}
                            >
                                <Text style={{ color: "white", fontWeight: "600" }}>Try Again</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Results */}
                    {apiStatus === API_STATUS.SUCCESS && (
                        <View style={{ justifyContent: "center", alignItems: "center" }}>
                            <ResultsPanel
                                screenWidth={screenWidth}
                                equationType={equationType}
                                equationResponse={equationResponse}
                                equationTypeLetter={equationTypeLetter}
                                isolatedEquation={isolatedEquation}
                                equationResponseSolution={equationResponseSolution}
                                toLatex={toLatex}
                                arrowImg={arrowImg}
                                onRetry={() => processImage(debugImage)}
                            />

                            {/* Graph panel (if applicable) */}
                            {isolatedEquation && (
                                <GraphPanel
                                    screenWidth={screenWidth}
                                    equationType={equationType}
                                    isolatedEquation={isolatedEquation}
                                    equationResponse={equationResponse}
                                />
                            )}
                        </View>
                    )}
                </BottomSheetScrollView>
            </BottomSheet>
        </View>
    );
}

const styles = StyleSheet.create({
    camera: {
        flex: 1,
    },
});