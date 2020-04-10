const fs = require('fs');


//functionArray = data.slice(3,functionLimit);
//TODO
//1. lowercase
fs.readFile('./test.txt', 'utf-8', (err,data)=>{
    if (err){
        console.log(err);
    }
    
    data = normalizeData(data);

    var MinMax = [];
    var A = [];
    var b = [];
    var c = [];
    var Eqin = [];

    var currestState = "Parsing the objective function";
    var functionLimit = 2;
    var variableSymbol = "-";
    var functionArray = [];
    var variables = [];
    var indexArray = [];

    //MIN - MAX
    MinMax = getProblemTypeIdentifier(data);

    //FINDING THE FUNCTION LIMIT
    functionLimit = getFunctionLimit(data);

    //GETTING THE FUNCTIION ARRAY
    functionArray = getFunctionArray(data, functionLimit);

    //CHECKING IF ALL THE VARIABLE SYMBOLS OF THE FUNCTION ARE THE SAME.
    variables = getVariables(functionArray);
    normalizeAndcheckVariables(variables);
    variableSymbol = getVariableSymbol(variables);

    //CHECKING IF ALL THE VARIABLES HAVE AN INDEX AND SAVING THEM
    indexArray = getVaribleIndexesArray(functionArray,variableSymbol);

    //INTIALIZING THE C ARRAY
    initializeCArray(indexArray,c);

    //CHECKING AND SAVING THE FACTORS (CREATING THE C ARRAY)
    getFactors(functionArray,indexArray,c);
    

    //CHECKING AND GETTING THE OPERANDS
    getAndCheckOpernands(functionArray,indexArray,c,A);

    console.log("c  : " + c);
    console.log("A  : " + A);
    
});





//'12x1+2x2+3x3_nl_'




function normalizeData(data){
    return data.split('\r').join('_nl_').split(/\s/).join('').toLowerCase();
}

function getProblemTypeIdentifier(data){
    switch(data[0]+data[1]+data[2]){
        case "min":
            return [-1];
        case "max":
            return [1];
        default:
            console.error("The problem type identifier was not found. Please ensure that the first three characters of your document make up either the word min or max.");
            process.exit(1);
    }
}

function getFunctionLimit(data){

    if(data.indexOf("st") != data.indexOf("_nl_") + 4 && data.indexOf("s.t.") != data.indexOf("_nl_") + 4 && data.indexOf("subjectto") != data.indexOf("_nl_") + 4){
        console.error("The restrictions initializer is misplaced or not included at all. Please ensure that it is placed right before the restrictions");
        process.exit(1);
    }
    else if(data.indexOf("st")>0){
        return data.indexOf("st");
    }
    else if(data.indexOf("s.t.")>0){
        return data.indexOf("s.t.");
    }
    else if(data.indexOf("subjectto")>0){
        return data.indexOf("subjectto");
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
            console.error("The variable symbols are not the same. Please use a unique symbol (x is suggested) for all the variables, followed by its index.");
            process.exit(1);
        }
    }
}

function getVariableSymbol(variables){
    return variables[0];
}

function getVaribleIndexesArray(functionArray, variableSymbol){
    var variablesIndexArray = [];

    for(var i=0;i<functionArray.length;i++){
        if(functionArray[i] == variableSymbol){
            if(functionArray[i+1].match(/[0-9]+/g)){
                variablesIndexArray.push({variableIndex:functionArray[i+1],position:i+1});
            }
            else{
                console.error("A variable without index was found. Please ensure that all the variables have their indexes assigned by their right side.");
                process.exit(1);
            }
        }
    }
    
    return variablesIndexArray;
}

function initializeCArray(variablesIndexArray,c){
    var maxIndex = 0;
    for(var i =0;i<variablesIndexArray.length;i++){
        if(Number(variablesIndexArray[i].variableIndex) > maxIndex){
            maxIndex = Number(variablesIndexArray[i].variableIndex);
        }
    }
    for(var i=0;i<maxIndex;i++){
        c.push('');
    }
}

function getFactors(functionArray,variablesIndexArray,factorsArray){
    for(var i=0;i<variablesIndexArray.length;i++){

        var j = 2;

        if(variablesIndexArray[i].position-j>=0){

            while(functionArray[variablesIndexArray[i].position-j].match(/[0-9]+/g) || functionArray[variablesIndexArray[i].position-j] == '.' || functionArray[variablesIndexArray[i].position-j] == ','){
                factorsArray[Number(variablesIndexArray[i].variableIndex)-1] += functionArray[variablesIndexArray[i].position-j];
                j++;
                if(variablesIndexArray[i].position-j<0){
                    break;
                }
            }
        }
    
    }

    for(var i=0;i<factorsArray.length;i++){
        factorsArray[i] = factorsArray[i].split("").reverse().join("");

        /*if(c[i]==''){
            c[i] = "1";
        }*/
    }
}


function getAndCheckOpernands(functionArray,variablesIndexArray,factorsArray,operandsArray){

    if(!functionArray[0].match(/[0-9]+/g)){
        if(functionArray[0] == "+"){
            operandsArray.push("+");
        }
        else if(functionArray[0] == "-"){
            operandsArray.push("-");
        }
        else{
            console.error("There was an error with an operand. Please ensure that all the operands are placed in the right side of the variables factors.");
            process.exit(1);
        }
    }
    else{
        operandsArray.push("+");
    }

    for(var i=1;i<variablesIndexArray.length;i++){
        
        if(functionArray[variablesIndexArray[i].position-2-factorsArray[Number(variablesIndexArray[i].variableIndex)-1].length] == "+"){
            operandsArray.push("+");
        }
        else if (functionArray[variablesIndexArray[i].position-2-factorsArray[Number(variablesIndexArray[i].variableIndex)-1].length] == "-"){
            operandsArray.push("-");
        }
        else{
            console.error("There was an error with an operand. Please ensure that all the operands are placed in the right side of the variables factors.");
            process.exit(1);
        }
        
    }
}