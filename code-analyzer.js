const fs = require('fs');
const path = require('path');

function analyzeJSFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    let numCommentLines = 0;
    let insideBlockComment = false;

    const logicalLines = lines.filter(line => {
        const trimmedLine = line.trim();

        if (trimmedLine === '') {
            return false;
        }

        // Handle block comments
        if (insideBlockComment) {
            numCommentLines++;
            if (trimmedLine.includes('*/')) {
                insideBlockComment = false;
            }
            return false;
        }

        if (trimmedLine.startsWith('/*')) {
            numCommentLines++;
            if (!trimmedLine.includes('*/')) {
                insideBlockComment = true;
            }
            return false;
        }

        if (trimmedLine.startsWith('*')) {
            numCommentLines++;
            return false;
        }

        // Handle inline comments and count logical expressions
        const commentIndex = trimmedLine.indexOf('//');
        if (commentIndex !== -1) {
            numCommentLines++;
            const codePart = trimmedLine.slice(0, commentIndex).trim();

            return !!codePart;

        }

        return true; // This line has logical expressions
    }).reduce((count, line) => count + countLogicalExpressions(line), 0);

    const numLines = lines.length;
    const numEmptyLines = lines.filter(line => line.trim() === '').length;
    const levelOfCommenting = numCommentLines / numLines;
    const physicalLines = numLines;
    const cyclomaticComplexity = calculateCyclomaticComplexity(content);

    return {
        filePath,
        numLines,
        numEmptyLines,
        numCommentLines,
        levelOfCommenting,
        physicalLines,
        logicalLines,
        cyclomaticComplexity
    };
}

function countLogicalExpressions(code) {
    // Regex to find function calls and other logical expressions
    const logicalExpressionRegex = /[a-zA-Z_]\w*\s*\([^)]*\)|&&|\|\||\b(if|for|while|switch|case|catch)\b/g;
    const expressions = code.match(logicalExpressionRegex) || [];
    return expressions.length;
}

function analyzeDirectory(directory) {
    const metrics = [];
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const filePath = path.join(directory, file);
        if (fs.statSync(filePath).isDirectory()) {
            metrics.push(...analyzeDirectory(filePath));
        } else if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
            const fileMetrics = analyzeJSFile(filePath);
            metrics.push(fileMetrics);
        }
    }
    return metrics;
}

function calculateCyclomaticComplexity(content) {
    const decisionKeywords = ['if', 'for', 'while', 'switch', 'case', 'catch', '||', '&&'];
    let complexity = 1;

    const tokens = tokenize(content);

    for (let i = 0; i < tokens.length; i++) {
        if (decisionKeywords.includes(tokens[i])) {
            complexity++;
        }
    }

    return complexity;
}

function tokenize(content) {
    const tokens = [];
    const tokenRegex = /\b(?:if|for|while|switch|case|catch)\b|&&|\|\|/g;
    let match;

    while ((match = tokenRegex.exec(content)) !== null) {
        tokens.push(match[0]);
    }

    return tokens;
}

function printMetrics(metrics) {
    const totalFiles = metrics.length;
    const totalLines = metrics.reduce((acc, m) => acc + m.numLines, 0);
    const totalEmptyLines = metrics.reduce((acc, m) => acc + m.numEmptyLines, 0);
    const totalCommentLines = metrics.reduce((acc, m) => acc + m.numCommentLines, 0);
    const totalPhysicalLines = metrics.reduce((acc, m) => acc + m.physicalLines, 0);
    const totalLogicalLines = metrics.reduce((acc, m) => acc + m.logicalLines, 0);
    const totalCyclomaticComplexity = metrics.reduce((acc, m) => acc + m.cyclomaticComplexity, 0);

console.log(`Total Files: ${totalFiles}`);
    console.log(`Total Lines of Code: ${totalLines}`);
    console.log(`Total Empty Lines: ${totalEmptyLines}`);
    console.log(`Total Comment Lines: ${totalCommentLines}`);
    console.log(`Level of Commenting: ${(totalCommentLines / totalLines).toFixed(2)}`);
    console.log(`Total Physical Lines: ${totalPhysicalLines}`);
    console.log(`Total Logical Lines: ${totalLogicalLines}`);
    console.log(`Total Cyclomatic Complexity: ${totalCyclomaticComplexity}`);
}

// Directory to analyze
const directoryToAnalyze = 'jquery';
const metrics = analyzeDirectory(directoryToAnalyze);
printMetrics(metrics);
