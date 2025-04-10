import { DEGREE_WORD_MAP } from './constants';

/**
 * Analyzes a mathematical expression to determine its type and variables
 * @param {string} expression - The mathematical expression to analyze
 * @returns {Object} Object containing type and letter (if applicable)
 */
export const analyzeFunction = (expression) => {
  // Convert to lowercase for consistent analysis
  expression = expression.toLowerCase();
  
  // Check for limit expressions
  if (expression.includes("lim")) {
    const limitMatch = expression.match(/lim.*?([a-z])\s*\\?to/);
    const variable = limitMatch ? limitMatch[1] : "";
    return {
      type: "Find the limit",
      letter: variable
    };
  }
  
  // Check for polynomial equations (with powers)
  else if (/\b[a-z](\^|\*\*)\d+\b/.test(expression)) {
    const match = expression.match(/\b([a-z])(\^|\*\*)(\d+)\b/);
    const variable = match ? match[1] : "";
    const degree = match ? match[3] : "";
    const degreeWord = DEGREE_WORD_MAP[degree] || degree;
    
    return {
      type: `Solve the ${degreeWord} degree equation`,
      letter: variable
    };
  }
  
  // Check for equations with operations and equals sign
  else if (/[\+\-\*\/]/.test(expression) && /[=]/.test(expression)) {
    if (/[a-z]/.test(expression)) {
      const match = expression.match(/\b([a-z])(\^|\*\*)?(\d+)?\b/);
      const variable = match ? match[1] : "";
      
      return {
        type: "Solve the equation",
        letter: variable
      };
    } else {
      return {
        type: "Solve the equation",
        letter: ""
      };
    }
  }
  
  // Check for expressions with variables but no equals sign
  else if (/[a-z]/.test(expression)) {
    // Get unique variables
    const variables = [...new Set(expression.match(/[a-z]/g))];
    
    if (variables.length >= 2 && expression.includes('y') && expression.includes('x')) {
      return {
        type: "Two-variable equation",
        letter: ""
      };
    }
    
    return {
      type: `Solve for ${variables.join(", ")}`,
      letter: variables[0] || ""
    };
  }
  
  // Basic arithmetic operations without variables or equals sign
  else if (/[\+\-\*\/]/.test(expression) && !/[=]/.test(expression) && !/[a-z]/.test(expression)) {
    const operations = [];
    if (expression.includes("+")) operations.push("Addition");
    if (expression.includes("-")) operations.push("Subtraction");
    if (expression.includes("*")) operations.push("Multiplication");
    if (expression.includes("/")) operations.push("Division");
    
    return {
      type: `Calculate ${operations.join(", ")}`,
      letter: ""
    };
  }
  
  // Default case for unrecognized expressions
  return {
    type: "Expression analysis",
    letter: ""
  };
};

/**
 * Converts a standard mathematical expression to LaTeX format
 * @param {string} expression - The mathematical expression to convert
 * @returns {string} LaTeX formatted expression
 */
export const toLatex = (expression) => {
  if (!expression) return "";
  
  // Replace "**" with "^" for powers
  let latexExpression = expression.replace(/\*\*/g, "^");

  // Turn letters to lowercase 
  latexExpression = latexExpression.toLowerCase();

  // Replace "*" with LaTeX multiplication symbol (implicitly remove "*")
  latexExpression = latexExpression.replace(/\*/g, "");

  // Replace sqrt() with LaTeX square root syntax
  latexExpression = latexExpression.replace(/sqrt\(([^)]+)\)/g, "\\sqrt{$1}");

  // Replace divisions with \frac{}{} LaTeX syntax for fractions
  // First mark the beginning of fractions
  latexExpression = latexExpression.replace(/(?<![a-zA-Z0-9)])\/(?![a-zA-Z0-9(])/g, "\\frac{");

  // Use regex to add closing braces for fractions after each independent division
  latexExpression = latexExpression.replace(/(\d+|\(.+?\))\/(\d+|\(.+?\))/g, "\\frac{$1}{$2}");

  // Replace variables or numbers followed by "^" with curly braces for LaTeX power syntax
  latexExpression = latexExpression.replace(/(\w+)\^(\w+)/g, "$1^{ $2 }");
  
  // Handle special functions and notations
  latexExpression = latexExpression.replace(/sin\(/g, "\\sin(");
  latexExpression = latexExpression.replace(/cos\(/g, "\\cos(");
  latexExpression = latexExpression.replace(/tan\(/g, "\\tan(");
  latexExpression = latexExpression.replace(/log\(/g, "\\log(");
  latexExpression = latexExpression.replace(/ln\(/g, "\\ln(");
  latexExpression = latexExpression.replace(/lim/g, "\\lim");
  latexExpression = latexExpression.replace(/\\to/g, "\\to");
  
  return latexExpression;
};