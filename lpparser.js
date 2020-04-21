const fs = require('fs');
const path = require('path');
const util = require('util');
var data = "";
var parsedProblem = "";
var errors = "";

function parseLinearProblem(filenameInput){
   

    data = fs.readFileSync(filenameInput, 'utf-8');

 
    var MinMax = [];
    var A = [];
    var b = [];
    var c = [];
    var cOperands = [];
    var Eqin = [];


    var restrictionsIdentifier = "";
    var functionLimit = 2;
    var variableSymbol = "-";
    var functionArray = [];
    var variables = [];
    var indexArray = [];

    var restrictionsArrays = [];
    var restrictionTypesIndexes = [];
    var restrictionVariables = [];
    var restrictionVariableSymbols = [];
    var restrictionVariableIndexesArray = [];
    var restrictionOperands = [];
    

    //NORMALIZING THE DATA
    data = normalizeData(data);

    //MIN - MAX
    MinMax = getProblemTypeIdentifier(data);
    if(errors != ""){
        return {content:errors,hasErrors:true};
    }

    //FINDING THE FUNCTION LIMIT
    [functionLimit, restrictionsIdentifier] = getFunctionLimit(data);
    if(errors != ""){
        return {content:errors,hasErrors:true};
    }

    //GETTING THE FUNCTIION ARRAY
    functionArray = getFunctionArray(data, functionLimit);

    //CHECKING IF ALL THE VARIABLE SYMBOLS OF THE FUNCTION ARE THE SAME.
    variables = getVariables(functionArray);
    normalizeAndcheckVariables(variables);
    if(errors != ""){
        return {content:errors,hasErrors:true};
    }
    variableSymbol = getVariableSymbol(variables);

    //CHECKING IF ALL THE VARIABLES HAVE AN INDEX AND SAVING THEM
    indexArray = getVariableIndexesArray(functionArray,variableSymbol);
    if(errors != ""){
        return {content:errors,hasErrors:true};
    }

    //INTIALIZING THE C ARRAY
    initializeFactorsArray(indexArray,c);

    //CHECKING AND SAVING THE FACTORS (CREATING THE C ARRAY)
    getFactors(functionArray,indexArray,c);

    //CHECKING AND GETTING THE OPERANDS
    getAndCheckOpernands(functionArray,indexArray,c,cOperands);
    if(errors != ""){
        return {content:errors,hasErrors:true};
    }
    
    applyOperandsToFactors(c,cOperands);
    if(errors != ""){
        return {content:errors,hasErrors:true};
    }

    //GET RESTRICTIONS ARRAYS
    restrictionsArrays = getRestrictionsArrays(data,functionLimit,restrictionsIdentifier);

    //GET RESTRICITON TYPES (Eqin array)
    [Eqin,restrictionTypesIndexes] = getRestrictionTypes(restrictionsArrays);
    if(errors != ""){
        return {content:errors,hasErrors:true};
    }


    //GET RESTRICTIONS RIGHT SIDES
    b = getRestrictionsRightSides(restrictionsArrays,Eqin,restrictionTypesIndexes);
    if(errors != ""){
        return {content:errors,hasErrors:true};
    }

    //ANALYZE RESTRICTIONS LEFT SIDES
    [restrictionVariables,restrictionVariableSymbols,restrictionVariableIndexesArray,A,restrictionOperands] =
    parseRestrictionsLeftSides(restrictionsArrays,restrictionTypesIndexes,variableSymbol);
    if(errors != ""){
        return {content:errors,hasErrors:true};
    }

    parsedProblem =  printLinearProblem(A,b,c,Eqin,MinMax);  


    return {content:parsedProblem,hasErrors:false};
    


}


function normalizeData(data){

    data = data.split('\r').join('_nl_').split(/\s/).join('').toLowerCase();
    
    var i = 0;
    while(data[i] == "_"  || data[i] == "n" || data[i] == "l"){
        i++;
    }
    data = data.slice(i,data.length);

    return data;
}

function getProblemTypeIdentifier(data){
    switch(data[0]+data[1]+data[2]){
        case "min":
            return [-1];
        case "max":
            return [1];
        default:
            errors = "The problem type identifier was not found. Please ensure that the first three characters of your document make up either the word min or max.\n";
            return;
    }
}

function getFunctionLimit(data){

    if(data.indexOf("st") != data.indexOf("_nl_") + 4 && data.indexOf("s.t.") != data.indexOf("_nl_") + 4 && data.indexOf("subjectto") != data.indexOf("_nl_") + 4){
        console.error("The restrictions initializer is misplaced or not included at all. Please ensure that it is placed right before the restrictions");
        return;
    }
    else if(data.indexOf("st")>0){
        return [data.indexOf("st"), "st"];
    }
    else if(data.indexOf("s.t.")>0){
        return [data.indexOf("s.t."), "s.t."];
    }
    else if(data.indexOf("subjectto")>0){
        return [data.indexOf("subjectto"),"subjectto"];
    }
  
    
}

function getFunctionArray(data,functionLimit){
    return data.slice(3,functionLimit);
}

function getVariables(functionArray){
    return functionArray.match(/[A-Za-z]+/g);
}

function normalizeAndcheckVariables(variables){
    if(variables.indexOf("nl")>0){
        variables.splice(variables.indexOf("nl"), variables.indexOf("nl")+1);
    }

    for(var i = 1; i<variables.length;i++){
        if(variables[i] != variables[i-1]){
            errors = "The variable symbols are not the same. Please use the same symbol (x is suggested) for all the variables, followed by its index.";
            return;
        }
    }
}

function getVariableSymbol(variables){
    return variables[0];
}

function getVariableIndexesArray(functionArray, variableSymbol){
    var variablesIndexArray = [];

    for(var i=0;i<functionArray.length;i++){
        var j=0;
        var currIndex = "";
        if(functionArray[i] == variableSymbol){
            if(!functionArray[i+1].match(/[0-9]+/g)){
                errors = "A variable without index was found. Please ensure that all the variables have their indexes assigned by their right side.";
                return;
            }
            else{
                while(functionArray[i+j+1].match(/[0-9]+/g)){
                    currIndex += functionArray[i+j+1]; 
                 
                    j++;
                  
                }
                variablesIndexArray.push({variableIndex:currIndex,position:i+1});
            }
        }
    }
    
    return variablesIndexArray;
}

function initializeFactorsArray(variablesIndexArray,factorsArray){
    var maxIndex = 0;
    var signleVariableIndexes  = variablesIndexArray.map(a => Number(a.variableIndex));
 
    
    for(var i =0;i<variablesIndexArray.length;i++){
        if(Number(variablesIndexArray[i].variableIndex) > maxIndex){
            maxIndex = Number(variablesIndexArray[i].variableIndex);
        }
    }
    for(var i=0;i<maxIndex+1;i++){
        if(signleVariableIndexes.indexOf(i)>=0){
            factorsArray[i] = '' ;
        }
        else{
            factorsArray[i] = '0';
        }
       
    }
    
}

function getFactors(functionArray,variablesIndexArray,factorsArray){
    for(var i=0;i<variablesIndexArray.length;i++){

        var j = 2;

        if(variablesIndexArray[i].position-j>=0){

            while(functionArray[variablesIndexArray[i].position-j].match(/[0-9]+/g) || functionArray[variablesIndexArray[i].position-j] == '.' || functionArray[variablesIndexArray[i].position-j] == ','){
                factorsArray[Number(variablesIndexArray[i].variableIndex)] += functionArray[variablesIndexArray[i].position-j];
                j++;
                if(variablesIndexArray[i].position-j<0){
                    break;
                }
            }
        }
    
    }

    for(var i=0;i<factorsArray.length;i++){
        factorsArray[i] = factorsArray[i].split("").reverse().join("");
    }
}

function getAndCheckOpernands(functionArray,variablesIndexArray,factorsArray,operandsArray){

    if(!functionArray[0].match(/[0-9]+/g) && !functionArray[0].match(/[A-Za-z]+/g)){
        if(functionArray[0] == "+"){
            operandsArray.push({index:variablesIndexArray[0].variableIndex,operand:"+"});
        }
        else if(functionArray[0] == "-"){
            operandsArray.push({index:variablesIndexArray[0].variableIndex,operand:"-"});
        }
        else{
            errors = "There was an error with an operand. Please ensure that all the operands are placed in the right side of the variables factors.";
            return;
        }
    }
    else{
        operandsArray.push({index:variablesIndexArray[0].variableIndex,operand:"+"});
    }

    for(var i=1;i<variablesIndexArray.length;i++){
        
        if(functionArray[variablesIndexArray[i].position-2-factorsArray[Number(variablesIndexArray[i].variableIndex)].length] == "+"){
            operandsArray.push({index:variablesIndexArray[i].variableIndex,operand:"+"});
        }
        else if (functionArray[variablesIndexArray[i].position-2-factorsArray[Number(variablesIndexArray[i].variableIndex)].length] == "-"){
            operandsArray.push({index:variablesIndexArray[i].variableIndex,operand:"-"});
        }
        else{
            errors = "There was an error with an operand. Please ensure that all the operands are placed in the right side of the variables factors.";
            return;
        }
        
    }
}

function applyOperandsToFactors(factorsArray, operandsArray){

    for(var i=0;i<factorsArray.length;i++){
        if(factorsArray[i]==''){
            factorsArray[i] = '1';
        }
    }
    for(var i=0;i<operandsArray.length;i++){
        switch(operandsArray[i].operand){
            case "-":
                factorsArray[operandsArray[i].index] = Number(factorsArray[operandsArray[i].index].replace(",",".")) * -1;
                break;
            case "+":
                factorsArray[operandsArray[i].index] = Number(factorsArray[operandsArray[i].index].replace(",","."));
                break;
            default:
                errors = "There was an error with an operand. Please ensure that all the operands are placed in the right side of the variables factors.";
                return;
        }
    }
    for(var i=0;i<factorsArray.length;i++){
        if(factorsArray[i]=='0'){
            factorsArray[i] = 0;
        }
    }
}

function getRestrictionsArrays(data,functionLimit,restrictionsIdentifier){
    return data.slice(functionLimit + restrictionsIdentifier.length ,data.length).split("_nl_").map(a => a+"_nl_");
}

function getRestrictionTypes(restrictionsArrays){

    var restrictionTypes = [];
    var restrictionTypesIndexes = [];
    for(var i=0;i<restrictionsArrays.length;i++){
        if(restrictionsArrays[i].indexOf(">=")>0){
            restrictionTypesIndexes.push(restrictionsArrays[i].indexOf(">="));
            restrictionTypes.push(1);
        }
        else if(restrictionsArrays[i].indexOf("<=")>0){
             restrictionTypesIndexes.push(restrictionsArrays[i].indexOf("<="));
            restrictionTypes.push(-1);
        }
        else if(restrictionsArrays[i].indexOf("=")>0){
            restrictionTypesIndexes.push(restrictionsArrays[i].indexOf("="));
            restrictionTypes.push(0);
        }
        else{
            errors = "No restriction type operator was found for the restriction number " + i +". Please include all the operators, choosing from =, >=, <=";
            return;
        }
    }

    return [restrictionTypes, restrictionTypesIndexes];
}

function getRestrictionsRightSides(restrictionsArrays, restrictionTypes, restrictionTypesIndexes){
    
    var rightSidesArray = [];

    for(var i=0;i<restrictionsArrays.length;i++){
        if(restrictionsArrays[i].slice(restrictionTypesIndexes[i] + Math.abs(restrictionTypes[i] * 2) + 1 - Math.abs(restrictionTypes[i]), restrictionsArrays[i].length-4) == ""){
            errors = "The restriction number " + i + " has no right side.";
            return;
        }
        rightSidesArray.push(restrictionsArrays[i].slice(restrictionTypesIndexes[i] + Math.abs(restrictionTypes[i] * 2) + 1 - Math.abs(restrictionTypes[i]), restrictionsArrays[i].length-4));
    }

    return rightSidesArray;
}

function parseRestrictionsLeftSides(restrictionsArrays,restrictionTypesIndexes,variableSymbol){

    var currRestrictionArray = [];
    var restrictionVariables = [];
    var restrictionVariablesSymbols = [];
    var restrictionVariableIndexes = [];
    var restrictionsFactors = [];
    var restrictionOperands = [];

    for (var i=0; i<restrictionsArrays.length;i++){
        
        /*1*/
        currRestrictionArray = restrictionsArrays[i].slice(0,restrictionTypesIndexes[i]) + "_nl_";
      
        /*2*/
        restrictionVariables[i] = getVariables(currRestrictionArray);
        /*3*/
        normalizeAndcheckVariables(restrictionVariables[i]);
        /*4*/
        restrictionVariablesSymbols[i] = getVariableSymbol(restrictionVariables[i]);
        /*5*/
        if(restrictionVariablesSymbols[i] != variableSymbol){
            errors = "The variable symbol of the restriction number " + i + " was not the same with the variable symbol of the function.";
            return;
        }
        /*6*/
        restrictionVariableIndexes[i] = getVariableIndexesArray(currRestrictionArray,restrictionVariablesSymbols[i]);
        /*7*/
        restrictionsFactors[i] = [];
        initializeFactorsArray(restrictionVariableIndexes[i],restrictionsFactors[i]);
        /*8*/
        getFactors(currRestrictionArray,restrictionVariableIndexes[i],restrictionsFactors[i]);
        /*9*/
        restrictionOperands[i] = [];
        getAndCheckOpernands(currRestrictionArray,restrictionVariableIndexes[i],restrictionsFactors[i],restrictionOperands[i]);
        /*10*/
        applyOperandsToFactors(restrictionsFactors[i],restrictionOperands[i]);
    }
    return [restrictionVariables,restrictionVariablesSymbols,restrictionVariableIndexes,restrictionsFactors,restrictionOperands];

}

function printLinearProblem(A,b,c,Eqin,MinMax){

    var content = 
    "Min or Max:" +'\n' +
    MinMax + '\n' + '\n' + 
    "C table:" + '\n' + 
    JSON.stringify(c) + '\n' + '\n' + 
    "A table:" + '\n' + 
    JSON.stringify(A) + '\n' + '\n' + 
    "Inequalities operators (eqin table):" + '\n' + 
    JSON.stringify(Eqin) +'\n' + '\n' + 
    "B table:" + '\n' + 
    JSON.stringify(b); 

   return content;
 
}





module.exports = parseLinearProblem;