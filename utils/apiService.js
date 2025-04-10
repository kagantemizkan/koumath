import { ERRORS } from './constants';

/**
 * Make a request to the prediction API
 * @param {string} base64Image - Base64 encoded image
 * @param {string} modelName - The model endpoint to use
 * @param {string} baseUrl - The base URL for API requests
 * @param {Function} limitApiCallback - Function to call if the main API fails
 * @returns {Object|null} Processed response or null on error
 */
export const predictAPI = async (base64Image, modelName, baseUrl, limitApiCallback) => {
  try {
    // Make the initial API request
    const response = await fetch(`${baseUrl}/${modelName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
      }),
    });

    // If API response isn't successful, attempt limit API as fallback
    if (!response.ok) {
      console.log("API error detected, switching to predict-limit endpoint");
      return limitApiCallback(base64Image, baseUrl);
    }

    const resData = await response.json();
    console.log("API Response:", resData);

    // Check for multiple equals signs - indicates potential parsing issue
    if ((resData.formatted_equation.match(/=/g) || []).length > 1) {
      console.log("Multiple equals signs detected:", resData.formatted_equation);
      console.log("Switching to predict-limit endpoint");
      return limitApiCallback(base64Image, baseUrl);
    }

    // Check for invalid solutions or null solutions
    if (
      (Array.isArray(resData.solution) && 
       (resData.solution[0] === "Error: Invalid equation" || resData.solution[0] === null))
    ) {
      console.log("Invalid/null solution detected");
      
      // Check if this might be a two-variable function
      const lowerCaseEquation = resData.formatted_equation.toLowerCase();
      if (lowerCaseEquation.includes("x") && lowerCaseEquation.includes("y")) {
        console.log("Two-variable function detected");
        return {
          formatted_equation: resData.formatted_equation,
          solution: [],
          isolated_solution: resData.isolated_solition || resData.formatted_equation
        };
      }
      
      // Not a two-variable function, try limit API
      console.log("Switching to predict-limit endpoint");
      return limitApiCallback(base64Image, baseUrl);
    }

    // Success case
    console.log("Equation determined successfully:", resData.formatted_equation);
    console.log("Solution(s):", resData.solution);

    return {
      formatted_equation: resData.formatted_equation,
      solution: resData.solution,
      isolated_solution: resData.isolated_solition || ''
    };
  } catch (error) {
    console.error("Error in predictAPI:", error);
    throw new Error(ERRORS.PROCESSING_ERROR);
  }
};

/**
 * Make a request to the limit prediction API
 * @param {string} base64Image - Base64 encoded image
 * @param {string} baseUrl - The base URL for API requests
 * @returns {Object|null} Processed response or null on error
 */
export const predictLimitAPI = async (base64Image, baseUrl) => {
  try {
    const response = await fetch(`${baseUrl}/predict-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
      }),
    });

    if (!response.ok) {
      console.log("Limit API error");
      throw new Error(ERRORS.PROCESSING_ERROR);
    }

    const resData = await response.json();
    console.log("Limit API Response:", resData);

    console.log("Equation determined successfully:", resData.formatted_equation);
    console.log("Solution(s):", resData.solution);

    // Format solutions if they're an array
    const formattedSolutions = Array.isArray(resData.solution)
      ? resData.solution.map((sol) => {
          if (sol === null) return "No solution";
          const num = parseFloat(sol);
          return Number.isInteger(num) ? num.toString() : num.toFixed(3);
        })
      : [resData.solution?.toString() || "No solution"];

    return {
      formatted_equation: resData.formatted_equation,
      solution: formattedSolutions,
      isolated_solution: ''
    };
  } catch (error) {
    console.error("Error in predictLimitAPI:", error);
    throw new Error(ERRORS.PROCESSING_ERROR);
  }
};