// react
import { useState, useRef, useEffect, useCallback } from 'react';
// react-native
import { StyleSheet, TouchableOpacity, View, Dimensions, Image, BackHandler, AppState, Text, Pressable, TextInput } from 'react-native';
// react-native-vision-camera
import { useCameraDevice, Camera, useCameraFormat, useCameraPermission } from 'react-native-vision-camera';
// @gorhom/bottom-sheet
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
// react-native-reanimated
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, cancelAnimation, FadeIn, FadeOut } from 'react-native-reanimated';
// react-native-vector-icons
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
// Components
import TransparentViewBottom from '../components/TransparentViewBottom';
import TransparentViewTop from '../components/TransparentViewTop';
import ReanimatedCropper from '../components/ReanimatedCropper';
// Images (svg, png)
import CaptureButtonImage from "../assets/captureButton.svg";
import captureLoadingUse from "../assets/captureLoadingUse.png";
import arrowImg from "../assets/arrow.png";
// Expo
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Link } from 'expo-router';
// Math Expression
import { MathJaxSvg } from 'react-native-mathjax-html-to-svg';
import TransparentBottomSheetHandle from '../components/TransparentBottomSheetHandle';
import CoordinateSystem from '../components/CoordinateSystem';


const screenWidth = Dimensions.get('screen').width;
const screenHeight = Dimensions.get('screen').height;


const url = 'http://127.0.0.1:8000'

export default function HomeScreen() {
    const screenAspectRatio = screenHeight / screenWidth;

    const device = useCameraDevice('back')
    const format = useCameraFormat(device, [
        { autoFocusSystem: true },
        { photoAspectRatio: screenAspectRatio },
        { photoResolution: 'max' },
        { pixelFormat: 'native' },
    ]);


    // camera
    const { hasPermission, requestPermission } = useCameraPermission()
    // states
    const [torch, setTorch] = useState(false);
    const [cropInfo, setCropInfo] = useState(null);
    const [photoUri, setPhotoUri] = useState(null);
    const [preview, setPreview] = useState(true)
    const [useCamera, setUseCamera] = useState(true)
    const [isCaptureLoading, setIsCaptureLoading] = useState(false)
    const [equationType, setEquationType] = useState("")
    const [equationTypeLetter, setEquationTypeLetter] = useState("")
    const [equationResponse, setEquationResponse] = useState("")
    const [equationResponseSolition, setEquationResponseSolition] = useState([])
    const [isolatedEquation, setIsolatedEquation] = useState("")
    const [isImageFromCamera, setIsImageFromCamera] = useState(true)
    const [showModels, setShowModels] = useState(false)
    const [modelName, setModelName] = useState("predict")
    const [manualInput, setManualInput] = useState("");
    const [showManualInput, setShowManualInput] = useState(false);

    //! DEBUG
    const [debugImage, setDebugImage] = useState("")

    // Reanimated Shared Values
    const rotation = useSharedValue(0);

    // refs
    const bottomSheetRef = useRef(null);
    const cameraRef = useRef(null);


    // useEffects
    useEffect(() => {
        if (hasPermission == false) {
            requestPermission()
        }
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                console.log('App has come to the foreground!');
                setUseCamera(true);
            } else if (nextAppState === 'background') {
                console.log('App has gone to the background!');
                setUseCamera(false);
            }
        });

        return () => {
            subscription.remove();
        };
    }, [])

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
    }, [preview]);


    // useCallBack
    const handleSheetChanges = useCallback((index) => {
        if (index === -1) {
            handleBackToCamera();
        }
    }, []);


    const handleBackToCamera = () => {
        setIsImageFromCamera(true)
        setPreview(true);
        setPhotoUri(null);
        bottomSheetRef.current?.close();
        setIsCaptureLoading(false)
        setEquationTypeLetter("")
        setEquationType("")
        setIsolatedEquation("")
    };


    const toggleFlash = () => {
        setTorch(!torch)
    }


    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { rotate: `${rotation.value}deg` }
            ],
        };
    });


    const handleCropChange = (newCropInfo) => {
        setCropInfo(newCropInfo);
    };


    const handleTakePicture = async () => {
        setIsCaptureLoading(true)
        if (cameraRef.current && cropInfo) {
            const photo = await cameraRef.current.takePhoto({
                quality: 85,
                skipMetadata: true,
            });
            setTimeout(() => {
                setPreview(false);
            }, 600);
            setPhotoUri(photo.path);
            setIsImageFromCamera(true)
            await handleCropPicture(photo.path, cropInfo, photo.width, photo.height);
            bottomSheetRef.current.snapToIndex(1)
        }
    };


    const handleCropPicture = async (uri, cropInfo, photoWidth, photoHeight) => {
        try {
            const { left, top, width, height } = cropInfo;

            const cropX = left * photoWidth / screenWidth;
            const cropY = top * photoHeight / screenHeight;
            const cropWidth = width * photoWidth / screenWidth;
            const cropHeight = height * photoHeight / screenHeight;

            const croppedImage = await ImageManipulator.manipulateAsync(
                uri,
                [
                    {
                        crop: {
                            originX: cropX,
                            originY: cropY,
                            width: cropWidth,
                            height: cropHeight,
                        },
                    },
                ],
                {
                    compress: 1,
                    format: ImageManipulator.SaveFormat.PNG,
                    base64: true,
                }
            );

            console.log('Cropped Photo:', croppedImage.uri);
            // setPhotoUri(croppedImage.uri);
            setDebugImage(croppedImage.base64)
            predictAPI(croppedImage.base64)

        } catch (error) {
            console.error("Cropping failed: ", error);
        }
    };

    const predictLimitAPI = async (image) => {
        const response = await fetch(`${url}/predict-limit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: image,
            }),
        });


        if (!response.ok) {
            console.log("API hatasını kontrol edin.")
            return null;
        }

        const resData = await response.json();
        console.log(resData)

        console.log("İşlem belirlendi ve sonucu var!")
        console.log("İşlem: ", resData.formatted_equation)
        analyzeFunction(resData.formatted_equation)
        console.log("Çözüm(ler): ", resData.solution)
        setEquationResponse(toLatex(resData.formatted_equation))

        const formattedSolutions = Array.isArray(resData.solution)
            ? resData.solution.map((sol) => {
                const num = parseFloat(sol);
                return Number.isInteger(num) ? num.toString() : num.toFixed(3);
            })
            : [resData.solution];

        setEquationResponseSolition(formattedSolutions);
    }


    const predictAPI = async (image) => {
        const response = await fetch(`${url}/${modelName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: image,
            }),
        });

        if (!response.ok) {
            console.log("API hatasını kontrol edin.")
            console.log("/predict-limit endpointine yönlendiriliyor.")
            predictLimitAPI(image)
            return null;
        }

        const resData = await response.json();
        console.log("Response Data: ", resData)


        if ((resData.formatted_equation.match(/=/g) || []).length > 1) {
            console.log("Hatalı format: ", resData.formatted_equation)
            console.log("/predict-limit endpointine yönlendiriliyor.")
            predictLimitAPI(image)
            return null
        }


        //! bu kısım limit olabilir veya 2 değişkenli fonksiyon olabilir.
        // şimdilik limit olarak varsayılacak.
        if (resData.solution[0] === "Error: Invalid equation" || resData.solution[0] === null) {
            console.log("LaTeX'den düz stringe çevirildi: ", toLatex(resData.formatted_equation))
            const lowerCaseEquation = resData.formatted_equation.toLowerCase();

            if (lowerCaseEquation.includes("x") && lowerCaseEquation.includes("y")) {
                console.log("İki değişkenli fonksiyon tespit edildi. /predict-limit endpointine yönlendirme yapılmayacak.");
                console.log("İşlem: ", resData.formatted_equation)
                setEquationType("İki değişkenli denklem")
                setEquationResponse(toLatex(resData.formatted_equation))
                console.log("isolated_solition: ", resData.isolated_solition)
                setIsolatedEquation(resData.isolated_solition)
                return null;
            }
            console.log("/predict-limit endpointine yönlendiriliyor.")
            predictLimitAPI(image)
            //! setEquationResponse(toLatex(resData.formatted_equation))
            return null;
        } else {
            console.log("İşlem belirlendi ve sonucu var!")
            console.log("İşlem: ", resData.formatted_equation)
            analyzeFunction(resData.formatted_equation)

            console.log("Çözüm(ler): ", resData.solution)
            setEquationResponse(toLatex(resData.formatted_equation))
            const formattedSolutions = resData.solution.map((sol) => {
                const num = parseFloat(sol);
                return Number.isInteger(num) ? num.toString() : num.toFixed(3);
            });
            setEquationResponseSolition(formattedSolutions)
        }

        console.log(resData)
    };

    const degreeToWord = (degree) => {
        switch (degree) {
            case '1': return 'Birinci';
            case '2': return 'İkinci';
            case '3': return 'Üçüncü';
            case '4': return 'Dördüncü';
            case '5': return 'Beşinci';
            default: return `${degree}`;
        }
    };

    const analyzeFunction = (ifade) => {
        ifade = ifade.toLowerCase();

        // Limit ifadesi kontrolü
        if (ifade.includes("lim")) {
            const limitMatch = ifade.match(/lim.*?([a-z])\s*\\to/); // "\to"dan önceki harfi bul
            const harf = limitMatch ? limitMatch[1] : "";
            console.log("Limiti hesaplayınız");
            setEquationType("Limiti hesaplayınız");
            setEquationTypeLetter(harf || ""); // Harf varsa ayarla, yoksa boş bırak
            return;
        }
        // Derece denklemleri için kontrol (^ veya ** ifadesiyle)
        else if (/\b[a-z](\^|\*\*)\d+\b/.test(ifade)) {
            const match = ifade.match(/\b([a-z])(\^|\*\*)(\d+)\b/);
            const harf = match ? match[1] : "";
            const derece = match ? match[3] : "";
            const dereceKelime = degreeToWord(derece);
            console.log(`${dereceKelime} dereceden denklemi çözünüz`);
            setEquationType(`${dereceKelime} dereceden denklemi çözünüz`);
            setEquationTypeLetter(harf);
            return;
        }
        // Denklemi ve değişkenleri kontrol et
        else if (/[\+\-\*\/]/.test(ifade) && /[=]/.test(ifade)) {
            if (/[a-z]/.test(ifade)) {
                const match = ifade.match(/\b([a-z])(\^|\*\*)?(\d+)?\b/);
                const harf = match ? match[1] : "";
                console.log(`Denklemi çözünüz`);
                setEquationType(`Denklemi çözünüz`);
                setEquationTypeLetter(harf);
            } else {
                console.log("Denklem var, işlemleri çözünüz.");
                setEquationType("Denklem var, işlemleri çözünüz.");
                setEquationTypeLetter(""); // Harf olmadığında boş bırak
            }
            return;
        }
        // Tek bir harf içeren denklemler
        else if (/[a-z]/.test(ifade)) {
            const harfler = [...new Set(ifade.match(/[a-z]/g))];
            console.log(`Denklemi çözünüz: ${harfler.join(", ")} harfleri ile`);
            setEquationType(`${harfler.join(", ")} için denklemi çözünüz`);
            setEquationTypeLetter(harfler[0] || ""); // İlk harfi kullan, yoksa boş bırak
            return;
        }
        // Sadece dört işlem varsa ve değişken yoksa
        else if (/[\+\-\*\/]/.test(ifade) && !/[=]/.test(ifade) && !/[a-z]/.test(ifade)) {
            const islem = [];
            if (ifade.includes("+")) islem.push("Toplamı");
            if (ifade.includes("-")) islem.push("Çıkarmı");
            if (ifade.includes("*")) islem.push("Çarpımı");
            if (ifade.includes("/")) islem.push("Bölümü");
            console.log(`${islem.join(", ")} hesaplayınız`);
            setEquationType(`${islem.join(", ")} hesaplayınız`);
            setEquationTypeLetter(""); // Harf olmadığında boş bırak
            return;
        }
        // Geçersiz durumlar için
        else {
            console.log("Geçersiz ifade.");
            setEquationType("Geçersiz ifade");
            setEquationTypeLetter(""); // Geçersiz ifade durumunda boş bırak
        }
    };

    const toLatex = (expression) => {
        // Replace "**" with "^" for powers
        let latexExpression = expression.replace(/\*\*/g, "^");

        // Turn letters to lowercase 
        latexExpression = latexExpression.toLowerCase();

        // Replace "*" with LaTeX multiplication symbol (implicitly remove "*")
        latexExpression = latexExpression.replace(/\*/g, "");

        // Replace sqrt() with LaTeX square root syntax
        latexExpression = latexExpression.replace(/sqrt\(([^)]+)\)/g, "\\sqrt{$1}");

        // Replace divisions with \frac{}{} LaTeX syntax for fractions, but only for independent fractions
        latexExpression = latexExpression.replace(/(?<![a-zA-Z0-9)])\/(?![a-zA-Z0-9(])/g, "\\frac{");

        // Use regex to add closing braces for fractions after each independent division
        latexExpression = latexExpression.replace(/(\d+|\(.+?\))\/(\d+|\(.+?\))/g, "\\frac{$1}{$2}");

        // Replace variables or numbers followed by "^" with curly braces for LaTeX power syntax
        latexExpression = latexExpression.replace(/(\w+)\^(\w+)/g, "$1^{ $2 }");
        console.log(latexExpression)
        return latexExpression;
    }



    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            alert('Permission to access camera roll is required!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            console.log(result.assets[0].uri);
            setPreview(false);
            setPhotoUri(result.assets[0].uri);

            // Convert the image to base64
            const manipResult = await ImageManipulator.manipulateAsync(
                result.assets[0].uri,
                [],
                { base64: true }
            );

            // Send the base64 image to predictAPI
            predictAPI(manipResult.base64);
            setDebugImage(manipResult.base64)
            setIsImageFromCamera(false)
            bottomSheetRef.current.snapToIndex(1)
        }
    };

    const handleManualInputSubmit = () => {
        if (!manualInput.trim()) return;

        setPreview(false);
        setIsImageFromCamera(false);
        setIsCaptureLoading(true);

        // Process the equation directly without API
        try {
            // Format the input equation similar to what would come from the API
            const formattedEquation = manualInput.trim();

            console.log("Manual input equation:", formattedEquation);
            setEquationResponse(toLatex(formattedEquation));

            // Analyze the type of equation
            analyzeFunction(formattedEquation);

            // If it's an equation with an isolated variable, set it up for graphing
            if (formattedEquation.includes("=")) {
                const parts = formattedEquation.split("=");
                if (parts.length === 2) {
                    // Rearrange to isolate y if possible (simplified approach)
                    if (formattedEquation.toLowerCase().includes("y")) {
                        setIsolatedEquation(formattedEquation);
                    }
                }
            } else {
                // For non-equation expressions
                setIsolatedEquation(formattedEquation);
            }

            // For simple equations, try to solve
            if (formattedEquation.includes("=") && !formattedEquation.includes("y")) {
                try {
                    // Very basic equation solving (just for simple cases)
                    const parts = formattedEquation.split("=");
                    if (parts.length === 2) {
                        // This is a very simplified solver and won't work for complex equations
                        const solution = eval(parts[1] + "-(" + parts[0] + ")");
                        setEquationResponseSolition([solution.toString()]);
                    }
                } catch (error) {
                    console.error("Error solving equation:", error);
                    setEquationResponseSolition(["Unable to solve"]);
                }
            }

            bottomSheetRef.current.snapToIndex(1);
        } catch (error) {
            console.error("Error processing manual input:", error);
        } finally {
            setIsCaptureLoading(false);
            setShowManualInput(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>

            {hasPermission &&
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

                />}
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
            {isImageFromCamera ? <ReanimatedCropper onCropChange={handleCropChange} /> : null}


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
            {showModels && (
                <Animated.View
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={{
                        position: "absolute",
                        top: 100, // TouchableOpacity'nin altında bir boşluk bırakır
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
                </Animated.View>
            )}


            {!photoUri &&
                <View style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", marginBottom: 65 }}>

                    <Text style={{ color: "white", backgroundColor: "rgba(0, 0, 0, 0.55)", borderRadius: 30, marginBottom: 30, paddingVertical: 2, paddingHorizontal: 13, fontWeight: 500, fontSize: 13 }}>Bir matematik probleminin resmini çek</Text>

                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <TouchableOpacity activeOpacity={0.6} style={styles.captureButton} onPress={pickImage}>
                            <FontAwesome size={25} color={'#fff'} name='picture-o' />
                        </TouchableOpacity>

                        {isCaptureLoading ?
                            <View style={{ paddingHorizontal: 45 }}>
                                <Animated.Image
                                    source={captureLoadingUse}
                                    style={[
                                        { width: 75, height: 75 },
                                        animatedStyle
                                    ]}
                                />
                            </View>
                            :
                            <TouchableOpacity activeOpacity={0.6} onPress={handleTakePicture} style={{ paddingHorizontal: 45 }}>
                                <CaptureButtonImage width={75} height={75} />
                            </TouchableOpacity>
                        }
                        <TouchableOpacity onPress={toggleFlash} activeOpacity={0.6} style={styles.captureButton}>
                            <Ionicons size={25} color={'#fff'} name={torch ? 'flash-off-outline' : "flash-outline"} />
                        </TouchableOpacity>
                    </View>
                </View>
            }
            {/* Manual Input Button */}
            <TouchableOpacity
                onPress={() => setShowManualInput(!showManualInput)}
                style={{
                    position: "absolute",
                    top: 50,
                    right: 14,
                    alignSelf: "center",
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 30,
                }}
            >
                <Text style={{ color: "white", fontWeight: "500" }}>
                    {showManualInput ? "Gizle" : "Fonksiyon gir"}
                </Text>
            </TouchableOpacity>

            {/* Manual Input Panel */}
            {showManualInput && (
                <Animated.View
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={{
                        position: "absolute",
                        bottom: 80,
                        width: screenWidth - 40,
                        backgroundColor: "#FFF",
                        borderRadius: 15,
                        padding: 15,
                        alignSelf: "center",
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 5,
                    }}
                >
                    <Text style={{ marginBottom: 10, fontWeight: "600", color: "#333" }}>
                        Matematik fonksiyonu girin (ör: y=x^2, x+y=5)
                    </Text>
                    <TextInput
                        style={{
                            height: 50,
                            borderColor: '#ddd',
                            borderWidth: 1,
                            borderRadius: 10,
                            paddingHorizontal: 15,
                            marginBottom: 15,
                            fontSize: 16,
                        }}
                        value={manualInput}
                        onChangeText={setManualInput}
                        placeholder="örn: x=y^2, 2x+3=9"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TouchableOpacity
                        onPress={handleManualInputSubmit}
                        style={{
                            backgroundColor: "#09a350",
                            paddingVertical: 12,
                            borderRadius: 10,
                            alignItems: "center",
                        }}
                    >
                        <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
                            Hesapla
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            )}

            <TransparentViewTop />
            <TransparentViewBottom />

            <BottomSheet
                index={-1}
                snapPoints={['50%', '75%']}
                enablePanDownToClose
                ref={bottomSheetRef}
                onChange={handleSheetChanges}
                backgroundStyle={{ backgroundColor: "rgb(91, 91, 91)", borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
                handleComponent={TransparentBottomSheetHandle}
            >
                <BottomSheetScrollView style={{ flex: 0 }}>
                    <View style={{ justifyContent: "center", alignItems: "center" }}>
                        <View style={{ width: screenWidth / 1.1, borderRadius: 20, backgroundColor: "white", paddingVertical: 15, paddingBottom: 25 }}>
                            <Text style={{ color: "#494a4e", fontWeight: 700, fontSize: 16, marginBottom: 12, paddingLeft: 20 }}>
                                ÇÖZÜM ADIMLARI
                            </Text>
                            <Text style={{ color: "black", fontWeight: 700, fontSize: 24, marginBottom: 24, paddingLeft: 20 }}>{equationType}</Text>
                            <MathJaxSvg
                                style={{ marginBottom: 10, paddingLeft: 20 }} // Use margin for spacing
                                fontSize={20}
                                color="#000000"
                                fontCache={true}
                            >
                                {`$$${equationResponse}$$`}
                            </MathJaxSvg>

                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <Image source={arrowImg} style={{ height: 70, width: 20, resizeMode: "contain", marginVertical: 10, marginLeft: 20 }} />
                                <Text style={{ color: "#4c4c4e", fontWeight: 400, paddingLeft: 12, fontSize: 15 }}>
                                    {equationTypeLetter !== "" ?
                                        `${equationTypeLetter} için çözünüz`
                                        :
                                        equationType === "İki değişkenli denklem" ? "İşlemi sadeleştiriniz" : "Hesaplayınız"
                                    }
                                </Text>
                            </View>
                            <View style={{ borderLeftColor: "#09a350", borderLeftWidth: 8, paddingLeft: 12, justifyContent: "center", gap: 2 }}>

                                {equationType === "İki değişkenli denklem" ? (
                                    <MathJaxSvg
                                        fontSize={24}
                                        color="#000000"
                                        fontCache={true}
                                    >
                                        {`$$${toLatex(isolatedEquation)}$$`}
                                    </MathJaxSvg>
                                ) : (
                                    equationResponseSolition.map((solution, index) => {
                                        const prefix = equationTypeLetter
                                            ? (equationResponseSolition.length > 1
                                                ? `${equationTypeLetter}_{${index + 1}} =`
                                                : `${equationTypeLetter} =`)
                                            : ''; // No prefix if EquationTypeLetter is empty

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
                                    })
                                )}
                            </View>

                            <TouchableOpacity style={{
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
                            }}
                                onPress={() => predictAPI(debugImage)}
                            >
                                <Text style={{ color: "white", fontSize: 16, fontWeight: 500 }}>Tekrar Hesapla</Text>
                                <Feather size={19} color={"white"} name='refresh-ccw' />
                            </TouchableOpacity>
                        </View>

                        {isolatedEquation ?
                            <View style={{
                                backgroundColor: "white",
                                overflow: "hidden",
                                width: screenWidth / 1.1,
                                height: 500,
                                borderRadius: 20,
                                marginTop: 25,
                                marginBottom: 40,
                            }}>
                                <Text style={{ backgroundColor: "white", color: "#494a4e", fontWeight: 700, fontSize: 16, paddingBottom: 12, paddingLeft: 20, paddingTop: 15 }}>
                                    GRAFİK
                                </Text>
                                <Text style={{
                                    backgroundColor: "white",
                                    color: "black",
                                    fontWeight: 700,
                                    fontSize: 24,
                                    paddingLeft: 20,
                                    paddingBottom: 20
                                }}
                                >{equationType}</Text>


                                {isolatedEquation ?
                                    <CoordinateSystem
                                        mathFunction={isolatedEquation.replace("**", "^")}
                                        scaleProp={1.2}
                                        isGestureActive={false}
                                    />
                                    : null
                                }

                                <Link
                                    push
                                    href={{
                                        pathname: "/mathGraphScreen",
                                        params: { isolatedEquation: isolatedEquation, equationResponse: equationResponse },
                                    }}
                                    asChild
                                >
                                    <TouchableOpacity style={{
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
                                    }}>
                                        <Text style={{ color: "white", fontSize: 16, fontWeight: 500 }}>Grafiği Keşfet</Text>
                                        <Feather size={19} color={"white"} name='arrow-right' />
                                    </TouchableOpacity>
                                </Link>
                            </View>
                            :
                            null
                        }

                    </View>

                </BottomSheetScrollView>
            </BottomSheet>
        </View >
    );
}

const styles = StyleSheet.create({
    camera: {
        flex: 1,
    },
});